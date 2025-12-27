import os
import logging
from django.conf import settings
from openai import OpenAI, OpenAIError
from google import genai
from google.genai import types
from groq import Groq, GroqError

logger = logging.getLogger(__name__)

class AIProvider:
    """Base class for AI providers"""
    def generate(self, messages, temperature=0.3):
        raise NotImplementedError

class GroqProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None

    def generate(self, messages, temperature=0.3):
        if not self.client:
            raise ValueError("Groq API Key not found")
        
        # Groq doesn't support 'system' role in some models effectively or expects specific transform
        # But generally follows OpenAI format.
        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="llama3-70b-8192", # Using a strong model as default
                temperature=temperature,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq Error: {e}")
            raise e

class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
        
    def generate(self, messages, temperature=0.3):
        if not self.client:
            raise ValueError("Gemini API Key not found")

        try:
            # Extract system instruction and user message
            system_instruction = next((m['content'] for m in messages if m['role'] == 'system'), None)
            user_message = next((m['content'] for m in messages if m['role'] == 'user'), "")
            
            config = types.GenerateContentConfig(
                temperature=temperature,
                system_instruction=system_instruction
            )

            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=user_message,
                config=config
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            raise e

class OpenAIProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, 'OPENAI_API_KEY', None)
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def generate(self, messages, temperature=0.3):
        if not self.client:
            raise ValueError("OpenAI API Key not found")
        
        try:
            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=temperature,
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI Error: {e}")
            raise e

class AIService:
    def __init__(self):
        self.providers = {
            'groq': GroqProvider(),
            'gemini': GeminiProvider(),
            'openai': OpenAIProvider()
        }
        # Failover order: Groq -> Gemini -> OpenAI
        self.failover_order = ['groq', 'gemini', 'openai']

    def generate_response(self, messages, preferred_model='auto'):
        """
        Generates a response using the preferred model or failover logic.
        
        :param messages: List of message dicts [{'role': '...', 'content': '...'}]
        :param preferred_model: 'auto', 'groq', 'gemini', 'openai'
        """
        
        if preferred_model != 'auto' and preferred_model in self.providers:
            # User explicitly selected a model
            try:
                return self.providers[preferred_model].generate(messages)
            except Exception as e:
                # If explicit model fails, return error (or could fallback? User asked for specific, so error might be better, but let's be nice and fallback if it's a transient error? 
                # Request says: "User ... possibility to choose". Usually if I choose X and X fails, I expect error or fallback warning.
                # But requirement "change makes in automatic" implies the main flow.
                # Let's try to stick to requested model, if it crashes, maybe we should just error out to let user know.
                # However, for robustness, if it's 'auto', we definitely failover.
                return f"Error with {preferred_model}: {str(e)}"

        # Auto mode or invalid model selected -> Start Failover Chain
        errors = []
        for provider_name in self.failover_order:
            try:
                provider = self.providers[provider_name]
                return provider.generate(messages)
            except Exception as e:
                errors.append(f"{provider_name}: {e}")
                continue
        
        raise Exception(f"All AI providers failed: {'; '.join(errors)}")
