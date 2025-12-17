// app/(auth)/enroll/setup/page.jsx
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';
import { Key, QrCode, ArrowRight, CheckCircle2, Loader2, Fingerprint } from 'lucide-react';
import LoginAnimation from '@/components/features/auth/LoginAnimation';

import {
    getPasskeyRegisterChallenge,
    verifyPasskeyRegistration,
    setupTotp,
    verifyTotp,
} from '@/services/api';

const StepIndicator = ({ currentStep, totalSteps, title, description }) => (
    <div className="text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(totalSteps)].map((_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'
                        }`}
                />
            ))}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
);

function EnrollmentSetup() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // TOTP Data
    const [qrUri, setQrUri] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const totpInputRef = useRef(null);

    // Animation Data
    const [animationState, setAnimationState] = useState('idle');
    const [eyeTranslation, setEyeTranslation] = useState(0);

    useEffect(() => {
        // Al entrar al paso 2 (TOTP), el oso mira hacia abajo (al QR)
        if (step === 2) {
            setAnimationState('typing-user');
            setTimeout(() => {
                // Fetch QR
                (async () => {
                    try {
                        const { data } = await setupTotp();
                        setQrUri(data.otpauth_uri);
                        // Focus automático después de un momento
                        setTimeout(() => totpInputRef.current?.focus(), 500);
                    } catch (err) {
                        setError(err.response?.data?.detail || 'No se pudo generar el código QR.');
                        setAnimationState('error');
                    }
                })();
            }, 500);
        } else {
            setAnimationState('idle');
        }
    }, [step]);

    const handlePasskey = async () => {
        setIsProcessing(true);
        setError(null);
        setAnimationState('authenticating'); // Oso se pone serio/trabajando

        try {
            const challengeResponse = await getPasskeyRegisterChallenge();
            const rawOptions = JSON.parse(JSON.stringify(challengeResponse.data));
            const optionsJSON = rawOptions?.publicKey ?? rawOptions;

            if (!optionsJSON || !optionsJSON.challenge) {
                throw new Error("Error de configuración del servidor.");
            }

            const registrationResponse = await startRegistration({ optionsJSON });
            await verifyPasskeyRegistration(registrationResponse);

            setAnimationState('success'); // ¡Éxito!
            setTimeout(() => {
                setStep(2);
                setIsProcessing(false);
            }, 1500);

        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido.';
            setError(err.name === 'AbortError' ? 'Registro cancelado.' : errorMessage);
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 2000);
            setIsProcessing(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);
        setAnimationState('authenticating');

        try {
            await verifyTotp(totpCode);
            setAnimationState('success');
            setTimeout(() => router.replace('/login?enrolled=true'), 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'El código es incorrecto.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 2000);
            setIsProcessing(false);
        }
    };

    // Manejo de animación en input TOTP
    const handleTotpChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setTotpCode(val);
    };

    const handleFocus = () => {
        // Oso se concentra o cubre ojos (si quisieras typing-otp para password hidden)
        // Para TOTP visible, typing-user (mirar input) está bien
        setAnimationState('typing-otp');
    };

    const handleBlur = () => {
        setAnimationState('idle');
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black transition-colors duration-500">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27 opacity=%271%27/%3E%3C/svg%3E')]"></div>

            <div className="relative w-full max-w-xl">
                {/* Bear Container */}
                <div className="relative z-20 flex justify-center -mb-16 pointer-events-none">
                    <div className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-700 shadow-2xl bg-[#d7ccc8] flex items-center justify-center overflow-hidden transition-all duration-300 pointer-events-auto">
                        <LoginAnimation state={animationState} eyeTranslation={eyeTranslation} />
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-3xl shadow-2xl pt-20 pb-8 px-8 sm:px-12 overflow-hidden relative min-h-[500px] flex flex-col justify-center">

                    {error && (
                        <div className="absolute top-4 left-0 right-0 mx-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-xl text-center text-sm animate-in fade-in slide-in-from-top-2 border border-red-100 dark:border-red-800 z-10">
                            {error}
                        </div>
                    )}

                    {/* FASE 1: PASSKEY */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <StepIndicator
                                currentStep={1}
                                totalSteps={2}
                                title="Configura tu Acceso Biométrico"
                                description="Usa tu huella, rostro o PIN para iniciar sesión de forma segura y rápida."
                            />

                            <div className="flex justify-center py-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                                    <Fingerprint className="h-24 w-24 text-blue-600 dark:text-blue-400 relative z-10" />
                                </div>
                            </div>

                            <button
                                onClick={handlePasskey}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" /> Esperando dispositivo...
                                    </>
                                ) : (
                                    <>
                                        <Key className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                        Crear mi Llave de Acceso
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400">
                                Compatible con Windows Hello, Touch ID, Face ID y Llaves FIDO2.
                            </p>
                        </div>
                    )}

                    {/* FASE 2: TOTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyTotp} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <StepIndicator
                                currentStep={2}
                                totalSteps={2}
                                title="Autenticación de Respaldo"
                                description="Escanea el código QR con Google Authenticator o Authy."
                            />

                            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 mx-auto max-w-[200px] flex items-center justify-center min-h-[200px]">
                                {qrUri ? (
                                    <QRCode value={qrUri} size={180} className="w-full h-full" />
                                ) : (
                                    <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        ref={totpInputRef}
                                        type="text"
                                        value={totpCode}
                                        onChange={handleTotpChange}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        maxLength={6}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        className="block w-full text-center text-2xl font-mono tracking-[0.5em] py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-gray-800 dark:text-white placeholder-gray-300 uppercase"
                                        placeholder="000000"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing || totpCode.length !== 6}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-green-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : 'Finalizar Configuración'}
                                    {!isProcessing && <CheckCircle2 className="h-5 w-5" />}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500 font-medium">
                    <p>© 2025 Grupo Luximia</p>
                </div>
            </div>
        </div>
    );
}

export default function EnrollSetupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>}>
            <EnrollmentSetup />
        </Suspense>
    );
}
