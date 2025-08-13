//app/enroll/setup/page.jsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import apiClient from '../../../../services/api';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';
import { useRouter } from 'next/navigation';

function EnrollmentSetup() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [qrUri, setQrUri] = useState('');
    const [totpCode, setTotpCode] = useState('');

    // Cuando entramos a step 2, pedir el QR (requiere sesión de enrollment activa)
    useEffect(() => {
        if (step !== 2) return;
        (async () => {
            try {
                const { data } = await apiClient.post('/users/totp/setup/');
                setQrUri(data.otpauth_uri);
            } catch (err) {
                setError('No se pudo obtener el código QR.');
            }
        })();
    }, [step]);

    const handlePasskey = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            // Si no hay sesión de enrollment, el backend devolverá 400 aquí
            const { data: options } = await apiClient.get('/users/passkey/register/challenge/');
            if (!options?.challenge) throw new Error('Respuesta inválida del servidor.');

            const registrationResponse = await startRegistration({ optionsJSON: options });
            await apiClient.post('/users/passkey/register/', registrationResponse);

            setStep(2);
        } catch (err) {
            if (err?.response) {
                const detail = err.response.data?.detail || 'Fallo en el registro.';
                setError(`Error del servidor: ${detail}`);
                // (opcional) si detail indica que no hay sesión, redirige a /enroll/[token]
            } else {
                setError(err.name === 'AbortError' ? 'Registro de passkey cancelado.' : 'Error al registrar la passkey.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        if (isProcessing) return;            // evita doble click
        setIsProcessing(true);
        setError(null);

        try {
            const { data } = await apiClient.post('/users/totp/verify/', { code: totpCode });
            console.log('[ENROLL] TOTP verificado. Respuesta:', data);

            // Navegación robusta
            try {
                // Preferible: no dejar regresar al enroll
                router.replace('/login?enrolled=true');
            } catch (_) {
                // fallback por si el router no navega en dev/HMR
                window.location.href = '/login?enrolled=true';
                return;
            }

            // fallback extra por si el replace no hace nada (raro, pero pasa)
            setTimeout(() => {
                if (typeof window !== 'undefined' && !window.location.href.includes('/login')) {
                    window.location.assign('/login?enrolled=true');
                }
            }, 150);
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Código TOTP inválido.';
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="p-8 border border-gray-700 rounded-lg w-full max-w-md bg-gray-800 shadow-lg">
                <h1 className="text-2xl font-bold mb-4 text-center">Inscripción de Seguridad</h1>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-center text-gray-400">Paso 1: Configura tu passkey para continuar.</p>
                        <button
                            onClick={handlePasskey}
                            disabled={isProcessing}
                            className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-500"
                        >
                            {isProcessing ? 'Procesando...' : 'Configurar Passkey'}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyTotp} className="space-y-4">
                        <p className="text-center text-gray-400">Paso 2: Escanea el código QR y verifica el código.</p>
                        {qrUri ? (
                            <div className="p-4 bg-white flex justify-center">
                                <QRCode value={qrUri} />
                            </div>
                        ) : (
                            <p className="text-center">Cargando código QR...</p>
                        )}
                        <input
                            type="text"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            maxLength={6}
                            className="border p-2 w-full text-center tracking-widest bg-gray-700 text-white rounded"
                            placeholder="123456"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isProcessing || totpCode.length !== 6}
                            className="bg-green-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
                        >
                            {isProcessing ? 'Verificando...' : 'Verificar y Activar Cuenta'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function EnrollSetupPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
            <EnrollmentSetup />
        </Suspense>
    );
}
