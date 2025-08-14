// app/(autenticacion)/enroll/setup/page.jsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import apiClient from '@/services/api';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';
import { useRouter } from 'next/navigation';
import { Key, QrCode } from 'lucide-react';

// Nuevo componente para mostrar el progreso
const StepIndicator = ({ currentStep, totalSteps, title, description }) => (
    <div className="text-center mb-6">
        <h2 className="text-sm font-semibold text-blue-400">Paso {currentStep} de {totalSteps}</h2>
        <h1 className="text-2xl font-bold mt-1 text-gray-200">{title}</h1>
        <p className="mt-2 text-gray-400">{description}</p>
    </div>
);

function EnrollmentSetup() {
    const router = useRouter();

    const [step, setStep] = useState(1); // 1: Passkey, 2: TOTP, 3: Finalizado
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [qrUri, setQrUri] = useState('');
    const [totpCode, setTotpCode] = useState('');

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
            const { data: options } = await apiClient.get('/users/passkey/register/challenge/');
            if (!options?.challenge) throw new Error('Respuesta inválida del servidor.');
            const registrationResponse = await startRegistration({ optionsJSON: options });
            await apiClient.post('/users/passkey/register/', registrationResponse);
            setStep(2);
        } catch (err) {
            if (err?.response) {
                const detail = err.response.data?.detail || 'Fallo en el registro.';
                setError(`Error del servidor: ${detail}`);
            } else {
                setError(err.name === 'AbortError' ? 'Registro de passkey cancelado.' : 'Error al registrar la passkey.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        if (isProcessing) return;
        setIsProcessing(true);
        setError(null);
        try {
            const { data } = await apiClient.post('/users/totp/verify/', { code: totpCode });
            console.log('[ENROLL] TOTP verificado. Respuesta:', data);
            router.replace('/login?enrolled=true');
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Código TOTP inválido.';
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="p-8 border border-gray-700 rounded-lg w-full max-w-xl bg-gray-800 shadow-lg">
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

                {/* Paso 1: Configurar Passkey */}
                {step === 1 && (
                    <div className="space-y-6">
                        <StepIndicator
                            currentStep={1}
                            totalSteps={2}
                            title="Configurar Passkey"
                            description="Usa tu dispositivo para crear una llave de acceso."
                        />
                        <div className="flex justify-center mb-4">
                            <Key className="h-20 w-20 text-gray-500" />
                        </div>
                        <button
                            onClick={handlePasskey}
                            disabled={isProcessing}
                            className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-500"
                        >
                            {isProcessing ? 'Procesando...' : 'Crear mi Passkey'}
                        </button>
                    </div>
                )}

                {/* Paso 2: Configurar TOTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyTotp} className="space-y-6">
                        <StepIndicator
                            currentStep={2}
                            totalSteps={2}
                            title="Configurar Código TOTP"
                            description="Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)."
                        />
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