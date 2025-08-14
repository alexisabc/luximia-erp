// frontend/luximia_erp_ui/components/ChatInteligente.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { consultaInteligente } from '@/services/api';
import Image from 'next/image'; //

// ### VERSIÓN CORREGIDA Y ROBUSTA ###
const TypingMessage = ({ text, start }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Reinicia el efecto si la ventana se vuelve a abrir (cuando 'start' es true)
        if (start) {
            setCurrentIndex(0);
            setDisplayedText('');
        }
    }, [start]);

    useEffect(() => {
        if (!start || currentIndex >= text.length) {
            return; // Detiene el efecto si no debe iniciar o si ya terminó
        }

        // Un temporizador que añade la siguiente letra
        const timeoutId = setTimeout(() => {
            setDisplayedText((prev) => prev + text[currentIndex]);
            setCurrentIndex((prevIndex) => prevIndex + 1);
        }, 50); // Velocidad de tipeo

        // Limpieza del temporizador
        return () => clearTimeout(timeoutId);

    }, [currentIndex, text, start]); // Se ejecuta cada vez que el índice cambia

    return <p>{displayedText}</p>;
};

const AssistantMessage = ({ response, isWelcome, chatIsOpen }) => {
    // Para el mensaje de bienvenida con efecto de tipeo
    if (isWelcome) {
        return <TypingMessage text={response.respuesta} start={chatIsOpen} />;
    }
    // Para respuestas de texto simple (ej. "Se encontraron 5 contratos.")
    if (response.respuesta) {
        return <p>{response.respuesta}</p>;
    }

    // Para respuestas que son una lista de resultados
    if (Array.isArray(response)) {
        if (response.length === 0) return <p>No se encontraron resultados que coincidan con tu búsqueda.</p>;

        return (
            <div className="space-y-2">
                <p>Aquí tienes los resultados que encontré:</p>
                <ul className="list-disc list-inside bg-gray-200 dark:bg-gray-900 p-3 rounded-md">
                    {response.map((item, index) => {
                        // ### NUEVO ###: Lógica para mostrar diferentes tipos de resultados
                        let content = JSON.stringify(item); // Fallback por si no reconoce el tipo

                        if (item.cliente?.nombre_completo) { // Es un Contrato
                            content = `Contrato #${item.id} de ${item.cliente.nombre_completo}`;
                        } else if (item.nombre_completo && item.email) { // Es un Cliente
                            content = `Cliente: ${item.nombre_completo} (${item.email})`;
                        } else if (item.identificador && item.proyecto_nombre) { // Es una UPE
                            content = `UPE: ${item.identificador} (${item.proyecto_nombre}) - ${item.estado}`;
                        } else if (item.nombre && item.descripcion !== undefined) { // Es un Proyecto
                            content = `Proyecto: ${item.nombre} (${item.activo ? 'Activo' : 'Inactivo'})`;
                        }

                        return <li key={item.id || index}>{content}</li>;
                    })}
                </ul>
            </div>
        );
    }

    return <p>No pude procesar la respuesta.</p>;
};

export default function ChatInteligente() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'assistant', isWelcome: true, data: { respuesta: '¡Hola! Soy tu asistente de Luximia ERP. ¿En qué puedo ayudarte hoy?' } }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
            const res = await consultaInteligente(inputValue);
            const assistantMessage = { sender: 'assistant', data: res.data };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = { sender: 'assistant', data: { respuesta: 'Lo siento, ocurrió un error.' } };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border dark:border-gray-700 hover:scale-110 transition-transform focus:outline-none z-50"
                aria-label="Abrir chat inteligente"
            >
                <Image
                    src="/icon-luximia-ia.png" // Apunta a tu nuevo ícono en la carpeta public
                    alt="Asistente IA"
                    width={40} // Ajusta el tamaño según necesites
                    height={40}
                    style={{ height: 'auto' }}
                    className="rounded-full"
                />
            </button>
            <div className={`fixed bottom-24 right-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out z-40 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Asistente Inteligente</h3>
                    <button onClick={toggleChat} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                <div className="p-4 h-96 overflow-y-auto space-y-4 flex-grow">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs text-sm break-words ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                {msg.sender === 'user' ? msg.text : <AssistantMessage response={msg.data} isWelcome={msg.isWelcome} chatIsOpen={isOpen} />}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 text-sm">
                                <span className="animate-pulse">Pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pregúntale algo..."
                        className="flex-grow bg-gray-100 dark:bg-gray-900 rounded-lg px-4 py-2 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading} className="ml-2 text-blue-500 hover:text-blue-700 font-semibold disabled:text-gray-400">Enviar</button>
                </div>
            </div>
        </>
    );
}