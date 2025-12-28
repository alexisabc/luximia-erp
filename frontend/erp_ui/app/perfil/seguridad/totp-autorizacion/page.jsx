'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Shield, Lock, QrCode, CheckCircle, AlertTriangle,
    RefreshCw, ArrowLeft, Smartphone, Key, Info, XCircle
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { configurarTOTPAutorizacion } from '@/services/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConfigurarTOTPAutorizacionPage() {
    const { user, hasPermission } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Intro, 2: QR, 3: Verificar, 4: Completado
    const [qrData, setQrData] = useState(null);
    const [codigo, setCodigo] = useState('');
    const [verificando, setVerificando] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);

    // Verificar permisos al cargar
    useEffect(() => {
        if (user !== null) {
            const canAccess = user?.is_staff || hasPermission?.('pos.authorize_cancellation');
            if (!canAccess) {
                setUnauthorized(true);
            }
        }
    }, [user, hasPermission]);

    // Si no tiene permisos, mostrar mensaje de error
    if (unauthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <Card className="max-w-md shadow-xl border-0">
                    <CardHeader className="text-center pb-2">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-red-600">Acceso Denegado</CardTitle>
                        <CardDescription className="text-base mt-2">
                            No tienes permisos para configurar el TOTP de autorización
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                Esta funcionalidad está reservada para usuarios con el permiso de <strong>autorizar cancelaciones</strong> o administradores del sistema.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/perfil')}
                            className="w-full"
                            variant="outline"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Mi Perfil
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const generarQR = async () => {
        setLoading(true);
        try {
            const response = await configurarTOTPAutorizacion.generar();
            setQrData(response.data);
            setStep(2);
            toast.success('QR generado exitosamente');
        } catch (error) {
            toast.error('Error al generar el código QR');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const verificarCodigo = async () => {
        if (codigo.length !== 6) {
            toast.error('El código debe tener 6 dígitos');
            return;
        }

        setVerificando(true);
        try {
            await configurarTOTPAutorizacion.verificar(codigo);
            setStep(4);
            toast.success('¡TOTP de autorización configurado exitosamente!');
        } catch (error) {
            toast.error('Código inválido. Verifica e intenta de nuevo.');
        } finally {
            setVerificando(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Configurar TOTP de Autorización
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Código de seguridad para autorizar operaciones sensibles
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="max-w-2xl mx-auto">
                {/* Step 1: Introducción */}
                {step === 1 && (
                    <Card className="shadow-xl border-0">
                        <CardHeader className="text-center pb-2">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Key className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle className="text-2xl">¿Qué es el TOTP de Autorización?</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Un código de seguridad adicional para operaciones sensibles
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Explicación */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                        <p className="font-medium mb-2">Este código es DIFERENTE al de inicio de sesión</p>
                                        <p>
                                            Configura un segundo código TOTP específico para autorizar operaciones como:
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Casos de uso */}
                            <div className="grid gap-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Cancelaciones de Ventas</p>
                                        <p className="text-sm text-gray-500">Autorizar cancelaciones de tickets del POS</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                        <RefreshCw className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Devoluciones</p>
                                        <p className="text-sm text-gray-500">Autorizar devoluciones de productos</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Operaciones Sensibles</p>
                                        <p className="text-sm text-gray-500">Cualquier operación que requiera autorización</p>
                                    </div>
                                </div>
                            </div>

                            {/* Requisitos */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" />
                                    Necesitarás:
                                </p>
                                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 ml-7">
                                    <li>• Google Authenticator, Authy, o similar</li>
                                    <li>• Puede ser la misma app de tu TOTP de login</li>
                                    <li>• Verás dos entradas diferentes en la app</li>
                                </ul>
                            </div>

                            <Button
                                onClick={generarQR}
                                disabled={loading}
                                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                                {loading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <QrCode className="w-5 h-5 mr-2" />
                                )}
                                Generar Código QR
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Mostrar QR */}
                {step === 2 && qrData && (
                    <Card className="shadow-xl border-0">
                        <CardHeader className="text-center pb-2">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Paso 1: Escanea el Código QR</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Usa tu app autenticadora para escanear este código
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-xl shadow-lg border">
                                    <img
                                        src={qrData.qr_code}
                                        alt="QR Code para TOTP de Autorización"
                                        className="w-64 h-64"
                                    />
                                </div>
                            </div>

                            {/* Información adicional */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <strong>Aparecerá en tu app como:</strong>
                                </p>
                                <p className="font-mono text-lg text-indigo-600 dark:text-indigo-400">
                                    ERP-Autorizaciones ({user?.username})
                                </p>
                            </div>

                            {/* Clave manual (por si no puede escanear) */}
                            <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                                    ¿No puedes escanear? Ingresa la clave manualmente
                                </summary>
                                <div className="mt-3">
                                    <Label className="text-sm text-gray-500">Clave secreta:</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border font-mono text-sm break-all">
                                            {qrData.secret}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(qrData.secret);
                                                toast.success('Clave copiada');
                                            }}
                                        >
                                            Copiar
                                        </Button>
                                    </div>
                                </div>
                            </details>

                            <Button
                                onClick={() => setStep(3)}
                                className="w-full h-12 text-lg"
                            >
                                Ya escaneé el código
                                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Verificar Código */}
                {step === 3 && (
                    <Card className="shadow-xl border-0">
                        <CardHeader className="text-center pb-2">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Paso 2: Verifica tu Código</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Ingresa el código de 6 dígitos que aparece en tu app
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Campo de código */}
                            <div>
                                <Label className="text-center block mb-3">Código de verificación</Label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="text-center text-4xl tracking-[0.5em] font-mono h-16 border-2"
                                    autoFocus
                                />
                                <p className="text-sm text-gray-500 text-center mt-2">
                                    Ingresa el código de <strong>ERP-Autorizaciones</strong>
                                </p>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(2)}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Ver QR de nuevo
                                </Button>
                                <Button
                                    onClick={verificarCodigo}
                                    disabled={codigo.length !== 6 || verificando}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    {verificando ? (
                                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Verificar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Completado */}
                {step === 4 && (
                    <Card className="shadow-xl border-0">
                        <CardHeader className="text-center pb-2">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <CheckCircle className="w-14 h-14 text-white" />
                            </div>
                            <CardTitle className="text-2xl text-green-600">¡Configuración Completada!</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Tu TOTP de autorización está activo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Resumen */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 text-center">
                                <p className="text-green-800 dark:text-green-200 mb-4">
                                    Ahora puedes autorizar operaciones sensibles usando tu código TOTP.
                                </p>
                                <div className="flex items-center justify-center gap-4 text-sm text-green-700 dark:text-green-300">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Cancelaciones</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Devoluciones</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Más...</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recordatorio */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                        <p className="font-medium mb-1">Recuerda:</p>
                                        <ul className="space-y-1">
                                            <li>• Busca <strong>ERP-Autorizaciones</strong> en tu app</li>
                                            <li>• Es diferente a tu código de inicio de sesión</li>
                                            <li>• Úsalo cuando te pidan autorizar una operación</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/perfil')}
                                    className="flex-1"
                                >
                                    Ir a Mi Perfil
                                </Button>
                                <Button
                                    onClick={() => router.push('/pos/cancelaciones')}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                                >
                                    Ir a Cancelaciones
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Indicador de pasos */}
                <div className="flex justify-center gap-2 mt-6">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`w-3 h-3 rounded-full transition-all ${s === step
                                ? 'bg-indigo-600 w-8'
                                : s < step
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
