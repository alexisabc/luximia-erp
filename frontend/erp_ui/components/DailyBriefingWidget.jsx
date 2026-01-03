'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getDailyBriefing, triggerAuditScan } from '@/services/ia';
import { toast } from 'react-hot-toast';

export default function DailyBriefingWidget() {
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        loadBriefing();
    }, []);

    const loadBriefing = async () => {
        try {
            setLoading(true);
            const res = await getDailyBriefing();
            setBriefing(res.data);
        } catch (error) {
            console.error("Error loading briefing:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunAnalysis = async () => {
        try {
            setAnalyzing(true);
            const res = await triggerAuditScan();
            setBriefing({
                contenido: res.data.briefing,
                fecha: new Date().toISOString()
            });
            toast.success("Análisis completado correctamente");
        } catch (error) {
            console.error("Error running audit:", error);
            toast.error("Error al ejecutar el análisis proactivo");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading && !briefing) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                    <div className="h-4 w-4/6 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden transition-all duration-300">
            <div className="p-5 flex items-center justify-between border-b border-indigo-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Resumen de Inteligencia</h2>
                        <p className="text-xs text-indigo-600 font-medium">Análisis Proactivo • Hoy</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRunAnalysis}
                        disabled={analyzing}
                        className={`p-2 rounded-lg transition-colors ${analyzing ? 'bg-gray-100 text-gray-400' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 shadow-sm'
                            }`}
                        title="Ejecutar análisis ahora"
                    >
                        <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6">
                    {briefing?.vacio ? (
                        <div className="text-center py-6">
                            <AlertCircle className="w-12 h-12 text-indigo-300 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-600 font-medium">No hay briefing disponible</p>
                            <p className="text-sm text-gray-500 mb-4">Inicie un análisis para obtener insights de IA sobre su operación.</p>
                            <button
                                onClick={handleRunAnalysis}
                                disabled={analyzing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                            >
                                {analyzing ? 'Analizando...' : 'Iniciar Análisis Ahora'}
                            </button>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                            {briefing?.contenido?.split('\n').map((paragraph, i) => (
                                <p key={i} className={i > 0 ? "mt-4" : ""}>
                                    {paragraph}
                                </p>
                            ))}

                            <div className="mt-6 pt-4 border-t border-indigo-50 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                <span>Inteligencia Artificial • GPT-4o / Llama-3</span>
                                <span>Actualizado: {new Date(briefing?.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
