// frontend/luximia_erp_ui/components/features/ChatInteligente.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { consultaInteligente } from '@/services/api';
import Image from 'next/image';
import { Send, X, Sparkles, Bot, Loader2 } from 'lucide-react';
import { APP_NAME } from '@/lib/branding';

// ### VERSIÓN CORREGIDA Y ROBUSTA ###
const TypingMessage = ({ text, start }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (start) {
            setCurrentIndex(0);
            setDisplayedText('');
        }
    }, [start]);

    useEffect(() => {
        if (!start || currentIndex >= text.length) {
            return;
        }

        const timeoutId = setTimeout(() => {
            setDisplayedText((prev) => prev + text[currentIndex]);
            setCurrentIndex((prevIndex) => prevIndex + 1);
        }, 30); // Ligeramente más rápido

        return () => clearTimeout(timeoutId);

    }, [currentIndex, text, start]);

    return <p>{displayedText}</p>;
};

const AssistantMessage = ({ response, isWelcome, chatIsOpen }) => {
    if (isWelcome) {
        return <TypingMessage text={response.respuesta} start={chatIsOpen} />;
    }

    if (response.respuesta) {
        return <p>{response.respuesta}</p>;
    }

    if (Array.isArray(response)) {
        if (response.length === 0) return <p>No se encontraron resultados que coincidan con tu búsqueda.</p>;

        return (
            <div className="space-y-3">
                <p>Aquí tienes los resultados que encontré:</p>
                <div className="bg-white/50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {response.map((item, index) => {
                            let content = JSON.stringify(item);
                            let icon = <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />;

                            if (item.cliente?.nombre_completo) {
                                content = (
                                    <>
                                        <span className="font-semibold block text-blue-600 dark:text-blue-400">Contrato #{item.id}</span>
                                        <span className="text-xs text-gray-500">{item.cliente.nombre_completo}</span>
                                    </>
                                );
                            } else if (item.nombre_completo && item.email) {
                                content = (
                                    <>
                                        <span className="font-semibold block">{item.nombre_completo}</span>
                                        <span className="text-xs text-gray-500">{item.email}</span>
                                    </>
                                );
                            } else if (item.identificador && item.proyecto_nombre) {
                                content = (
                                    <>
                                        <span className="font-semibold block text-indigo-600">UPE: {item.identificador}</span>
                                        <span className="text-xs text-gray-500">{item.proyecto_nombre} - {item.estado}</span>
                                    </>
                                );
                            } else if (item.nombre && item.descripcion !== undefined) {
                                content = (
                                    <>
                                        <span className="font-semibold block">{item.nombre}</span>
                                        <span className="text-xs text-gray-500">{item.activo ? 'Activo' : 'Inactivo'}</span>
                                    </>
                                );
                            }

                            return (
                                <li key={item.id || index} className="p-3 text-sm flex gap-3 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                    {icon}
                                    <div className="flex-1">{content}</div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        );
    }

    return <p>No pude procesar la respuesta.</p>;
};

export default function ChatInteligente() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'assistant', isWelcome: true, data: { respuesta: `¡Hola! Soy tu asistente de ${APP_NAME}. ¿En qué puedo ayudarte hoy?` } }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState('auto');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [messages, isOpen]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        const userMessage = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        try {
            const res = await consultaInteligente(inputValue, selectedModel);
            const assistantMessage = { sender: 'assistant', data: res.data };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = { sender: 'assistant', data: { respuesta: 'Lo siento, ocurrió un error al procesar tu solicitud.' } };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={toggleChat}
                className={`fixed bottom-6 right-6 p-1 rounded-full shadow-2xl transition-all duration-300 z-50 group
                    ${isOpen ? 'bg-gray-200 dark:bg-gray-800 rotate-90 scale-90' : 'bg-white dark:bg-gray-800 hover:scale-110'}`}
                aria-label={isOpen ? "Cerrar chat" : "Abrir chat inteligente"}
            >
                <div className={`relative p-2 rounded-full overflow-hidden ${isOpen ? '' : 'ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'}`}>
                    <Image
                        src="/icon-luximia-ia-new.png"
                        alt="Asistente IA"
                        width={48}
                        height={48}
                        className="rounded-full w-12 h-12 object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {!isOpen && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border border-white dark:border-gray-900"></span>
                        </span>
                    )}
                </div>
            </button>

            <div
                className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-[400px] h-[600px] max-h-[80vh]
                    bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50
                    flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-40 origin-bottom-right
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-12 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-b border-gray-100 dark:border-gray-800/50 flex justify-between items-center rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {APP_NAME} AI
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Beta</span>
                            </h3>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="text-xs bg-transparent border-none focus:ring-0 text-gray-500 cursor-pointer p-0"
                            >
                                <option value="auto">Auto (Smart)</option>
                                <option value="groq">Velocidad (Groq)</option>
                                <option value="gemini">Balanceado (Gemini)</option>
                                <option value="openai">Calidad (GPT-4o)</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={toggleChat}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-grow p-4 overflow-y-auto space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 text-white">
                                    <Bot className="w-5 h-5" />
                                </div>
                            )}

                            <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm
                                ${msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                                }`}>
                                {msg.sender === 'user' ? msg.text : <AssistantMessage response={msg.data} isWelcome={msg.isWelcome} chatIsOpen={isOpen} />}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 text-white">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Procesando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
                    <div className="relative flex items-end gap-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Escribe tu consulta..."
                            className="flex-grow bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all resize-none max-h-32 min-h-[44px]"
                            rows={1}
                            style={{ height: 'auto', minHeight: '44px' }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputValue.trim()}
                            className="absolute right-2 bottom-1.5 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:scale-100 transition-all duration-200"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-gray-400 mt-2">
                        El asistente puede cometer errores. Verifica la información importante.
                    </p>
                </div>
            </div>
        </>
    );
}