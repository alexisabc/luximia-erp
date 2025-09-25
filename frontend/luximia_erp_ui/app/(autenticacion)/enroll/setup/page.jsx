// app/(autenticacion)/enroll/setup/page.jsx
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';
import { Key, QrCode } from 'lucide-react';

// ✨ CAMBIO: Importamos todas las funciones necesarias de nuestro servicio
import {
    getPasskeyRegisterChallenge,
    verifyPasskeyRegistration,
    setupTotp,
    verifyTotp,
} from '@/services/api';

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
    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrUri, setQrUri] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const totpInputRef = useRef(null);

    useEffect(() => {
        if (step !== 2) return;
        (async () => {
            try {
                // ✨ CAMBIO: Usamos la función de la API
                const { data } = await setupTotp();
                setQrUri(data.otpauth_uri);
                totpInputRef.current?.focus();
            } catch (err) {
                setError(err.response?.data?.detail || 'No se pudo obtener el código QR.');
            }
        })();
    }, [step]);

    const handlePasskey = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            // ✨ CAMBIO: Lógica refactorizada para usar el servicio de API
            // 1. Obtener el desafío
            const { data: options } = await getPasskeyRegisterChallenge();

            // 2. Usar la librería del navegador para que el usuario cree la credencial
            const registrationResponse = await startRegistration(options);

            // 3. Enviar la respuesta para verificación y registro
            await verifyPasskeyRegistration(registrationResponse);

            setStep(2); // Avanzar al siguiente paso
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'Error al registrar la passkey.';
            setError(err.name === 'AbortError' ? 'Registro de passkey cancelado.' : errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);
        try {
            // ✨ CAMBIO: Usamos la función de la API
            await verifyTotp(totpCode);
            router.replace('/login?enrolled=true');
        } catch (err) {
            setError(err.response?.data?.detail || 'Código TOTP inválido.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-gray-900 text-white">
            <div className="w-full max-w-xl p-4 sm:p-6 md:p-8 border border-gray-700 rounded-lg bg-gray-800 shadow-lg">
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
                            <div className="p-4 bg-white flex justify-center rounded-lg max-w-sm mx-auto">
                                <QRCode value={qrUri} size={256} />
                            </div>
                        ) : (
                            <p className="text-center">Cargando código QR...</p>
                        )}
                        <input
                            ref={totpInputRef} // <-- Agregado: asigna la referencia al input
                            type="text"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            maxLength={6}
                            className="border p-2 w-full text-center tracking-widest bg-gray-700 text-white rounded"
                            placeholder="Ingresa el código de 6 dígitos generado por tu App"
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
        <Suspense fallback={<div>Cargando...</div>}>
            <EnrollmentSetup />
        </Suspense>
    );
}