'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Key, QrCode, ArrowLeft, Loader2, Mail, Sparkles } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import apiClient from '@/services/api';
import LoginAnimation from '@/components/features/auth/LoginAnimation';

export default function LoginPage() {
    const { setAuthData } = useAuth();
    const router = useRouter();
    const search = useSearchParams();

    // Estados del formulario
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loginMethod, setLoginMethod] = useState(null); // 'passkey' | 'totp' | null
    const [availableMethods, setAvailableMethods] = useState([]); // Métodos disponibles para el usuario
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Animación
    const [animationState, setAnimationState] = useState('idle');
    const [eyeTranslation, setEyeTranslation] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const inactivityTimerRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');

    const otpInputRef = useRef(null);

    useEffect(() => {
        if (search?.get('enrolled') === 'true') {
            setError(null);
            setSuccessMessage('¡Cuenta activada! Inicia sesión para continuar.');
            setAnimationState('success');
            setTimeout(() => setAnimationState('idle'), 2000);
        }
    }, [search]);

    useEffect(() => {
        clearTimeout(inactivityTimerRef.current);
        if ((animationState === 'idle' || animationState === 'waiting') && hasInteracted) {
            // Timer para pasar a "waiting" (mirar a los lados) rápido
            // Timer para pasar a "bored" (dormir) después de 30s

            // Si estamos en idle, pasamos a waiting en 3s
            if (animationState === 'idle') {
                inactivityTimerRef.current = setTimeout(() => {
                    setAnimationState('waiting');
                }, 3000);
            }
            // Si estamos en waiting, pasamos a bored en 27s (total 30s desde idle)
            else if (animationState === 'waiting') {
                inactivityTimerRef.current = setTimeout(() => {
                    setAnimationState('bored');
                }, 27000);
            }
        }
        return () => clearTimeout(inactivityTimerRef.current);
    }, [animationState, hasInteracted]);

    useEffect(() => {
        if (loginMethod === 'totp' && otpInputRef.current) {
            otpInputRef.current.focus();
        }
    }, [loginMethod]);

    const markAsInteracted = () => {
        if (!hasInteracted) setHasInteracted(true);
    };

    const startInactivityTimer = () => {
        clearTimeout(inactivityTimerRef.current);
        if (hasInteracted) {
            inactivityTimerRef.current = setTimeout(() => setAnimationState('bored'), 3000);
        }
    };

    const startLoginEndpoint = '/users/login/start/';
    const passkeyChallengeEndpoint = '/users/passkey/login/challenge/';
    const passkeyVerifyEndpoint = '/users/passkey/login/';
    const totpVerifyEndpoint = '/users/totp/login/verify/';

    const handlePasskeyLogin = async () => {
        setIsLoading(true);
        setError(null);
        setAnimationState('authenticating');
        try {
            const { data: options } = await apiClient.get(passkeyChallengeEndpoint);
            if (!options?.challenge) throw new Error('Challenge inválido del servidor'); // Ajuste de robustez

            // Decodifica si es necesario, pero startAuthentication maneja JSON usualmente.
            const assertion = await startAuthentication({ optionsJSON: options });

            const { data: tokens } = await apiClient.post(passkeyVerifyEndpoint, assertion);
            setAuthData(tokens);
            setAnimationState('success');
            setTimeout(() => router.push('/'), 1200);
        } catch (err) {
            console.error(err);
            const detail = err?.response?.data?.detail;
            if (detail) setError(detail);
            else if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') setError('Cancelaste la autenticación.');
            else setError('No pudimos validar tu acceso. Intenta de nuevo.');

            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 1400);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTotpLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAnimationState('authenticating');
        try {
            const { data: tokens } = await apiClient.post(totpVerifyEndpoint, { code: otp });
            setAuthData(tokens);
            setAnimationState('success');
            setTimeout(() => router.push('/'), 1200);
        } catch (err) {
            setError(err?.response?.data?.detail || 'El código es incorrecto.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 1400);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAnimationState('authenticating'); // Breve estado de "pensando"

        try {
            const { data } = await apiClient.post(startLoginEndpoint, { email });
            if (data.available_methods?.length > 0) {
                setAvailableMethods(data.available_methods);
                setAnimationState('idle'); // Volver a idle para elegir
                // Priorizar passkey si existe
                if (data.available_methods.includes('passkey')) {
                    // Opcional: Auto-trigger passkey? Mejor dejar que el usuario elija.
                }
            } else {
                throw new Error('No tienes métodos de acceso configurados.');
            }
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Error al conectar con el servidor.');
            setAnimationState('error');
            setTimeout(() => setAnimationState('idle'), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFocus = (field) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        // Si está aburrido, esperando o en error, despiértalo
        if (animationState === 'bored' || animationState === 'error' || animationState === 'waiting') setAnimationState('idle');

        // Pequeño delay para la transición natural
        setTimeout(() => {
            if (field === 'email') setAnimationState('typing-user');
            if (field === 'otp') setAnimationState('typing-otp');
        }, 50);
    };

    const handleBlur = () => {
        setAnimationState('idle');
        setEyeTranslation(0);
        startInactivityTimer();
    };

    const handleEmailChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);

        // Si estaba dormido, esperando o idle, asegurar que pasa a modo typing
        if (animationState === 'bored' || animationState === 'idle' || animationState === 'waiting') {
            setAnimationState('typing-user');
        }

        const val = e.target.value;
        setEmail(val);

        // Tracking visual más robusto usando la longitud
        const visibleRange = 15; // Aumentar rango para que el movimiento sea más suave a lo largo de un email promedio
        const currentLen = val.length;

        // Mapear 0..visibleRange a -10..10 (coordenadas X de los ojos)
        const pct = Math.min(currentLen, visibleRange) / visibleRange;
        const maxOffset = 5; // Reducido para que los ojos no se peguen al borde

        setEyeTranslation((pct * 2 - 1) * maxOffset);
    };

    const handleOtpChange = (e) => {
        markAsInteracted();
        clearTimeout(inactivityTimerRef.current);
        if (animationState === 'bored' || animationState === 'waiting') setAnimationState('idle');
        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6); // Solo números
        setOtp(val);
    };

    const resetFlow = () => {
        setLoginMethod(null);
        setAvailableMethods([]);
        setEmail('');
        setError(null);
        setOtp('');
        setAnimationState('idle');
        setHasInteracted(false);
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-[#020617] selection:bg-cyan-500/30 text-slate-200">

            {/* --- ULTIMATE NEBULA BACKGROUND --- */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                {/* Deep Void Base */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617]" />

                {/* Animated Aurora Layers */}
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen animate-nebula-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/10 blur-[120px] mix-blend-screen animate-nebula-medium delay-1000" />
                <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-violet-500/10 blur-[100px] mix-blend-screen animate-nebula-fast delay-2000" />

                {/* Accent Orbs for Depth */}
                <div className="absolute top-[10%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-blue-600/20 blur-[80px] mix-blend-overlay animate-float" />
                <div className="absolute bottom-[10%] left-[10%] w-[25vw] h-[25vw] rounded-full bg-emerald-500/10 blur-[80px] mix-blend-overlay animate-float delay-3000" />

                {/* Cinematic Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150 mix-blend-overlay" />
            </div>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center justify-center p-4">

                {/* Bear Container - Floating with Ethereal Glow */}
                <div className="relative z-20 mb-[-60px] hover:scale-105 transition-transform duration-500 ease-out cursor-pointer group/bear">
                    <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl group-hover/bear:blur-2xl transition-all duration-500 opacity-60" />
                    <div className="w-48 h-48 rounded-full p-1 bg-gradient-to-b from-slate-700/50 to-slate-900/50 backdrop-blur-md shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)] ring-1 ring-white/10 relative">
                        <div className="w-full h-full rounded-full border-[3px] border-white/5 bg-[#e2e8f0] dark:bg-[#0f172a] flex items-center justify-center overflow-hidden relative shadow-inner">
                            {/* Inner Vignette / Atmosphere */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_80%)] pointer-events-none" />
                            <LoginAnimation state={animationState} eyeTranslation={eyeTranslation} />
                        </div>
                    </div>
                </div>

                {/* Card - Ultra Premium Glass */}
                <div className="w-full bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_-20px_rgba(0,0,0,0.5)] pt-20 pb-8 px-8 sm:px-10 overflow-hidden relative group">

                    {/* Subtle top sheen */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 mb-2 tracking-tight drop-shadow-sm">
                            Bienvenido
                        </h2>
                        <p className="text-slate-500 text-xs font-semibold tracking-[0.2em] uppercase">
                            {process.env.NEXT_PUBLIC_APP_NAME || 'SISTEMA EMPRESARIAL'}
                        </p>
                    </div>

                    {successMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl text-center text-sm mb-6 animate-in fade-in slide-in-from-top-2 shadow-sm backdrop-blur-md font-medium">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-2xl text-center text-sm mb-6 animate-in fade-in slide-in-from-top-2 shadow-sm backdrop-blur-md font-medium">
                            {error}
                        </div>
                    )}

                    {/* FASE 1: EMAIL INPUT */}
                    {availableMethods.length === 0 && loginMethod === null && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1" htmlFor="email">
                                    Correo Corporativo
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-500 group-focus-within:text-cyan-400">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        onFocus={() => handleFocus('email')}
                                        onBlur={handleBlur}
                                        required
                                        className="block w-full pl-11 pr-4 py-4 bg-[#020617]/50 border border-white/5 rounded-2xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none text-white placeholder-slate-600 shadow-inner hover:bg-[#020617]/70"
                                        placeholder="usuario@dominio.com"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-2xl shadow-[0_0_20px_-5px_rgba(8,145,178,0.4)] transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/10"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continuar'}
                            </button>
                        </form>
                    )}

                    {/* FASE 2: SELECT METHOD */}
                    {availableMethods.length > 0 && loginMethod === null && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 bg-[#020617]/50 py-2.5 px-6 rounded-full w-fit mx-auto mb-6 border border-white/5 backdrop-blur-sm">
                                <User className="h-4 w-4 text-cyan-400" />
                                <span className="font-medium text-slate-200">{email}</span>
                            </div>

                            <div className="space-y-3">
                                {availableMethods.includes('passkey') && (
                                    <button
                                        type="button"
                                        onClick={handlePasskeyLogin}
                                        disabled={isLoading}
                                        className="w-full bg-[#1e293b]/30 border border-white/5 hover:border-cyan-500/50 hover:bg-[#1e293b]/60 text-left py-4 px-5 rounded-2xl transition-all shadow-lg hover:shadow-cyan-500/10 flex items-center justify-between group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                                                <Key className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-slate-100">Usar Passkey</div>
                                                <div className="text-xs text-slate-400 mt-0.5">Biometría o Llave de Seguridad</div>
                                            </div>
                                        </div>
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 text-slate-500" /> : <ArrowLeft className="h-5 w-5 rotate-180 text-slate-500 group-hover:text-cyan-400 transition-colors" />}
                                    </button>
                                )}

                                {availableMethods.includes('totp') && (
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('totp')}
                                        disabled={isLoading}
                                        className="w-full bg-[#1e293b]/30 border border-white/5 hover:border-violet-500/50 hover:bg-[#1e293b]/60 text-left py-4 px-5 rounded-2xl transition-all shadow-lg hover:shadow-violet-500/10 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 group-hover:scale-110 transition-transform">
                                                <QrCode className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-slate-100">Código TOTP</div>
                                                <div className="text-xs text-slate-400 mt-0.5">Google Auth / Authy</div>
                                            </div>
                                        </div>
                                        <ArrowLeft className="h-5 w-5 rotate-180 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={resetFlow}
                                className="w-full mt-6 text-slate-500 hover:text-white text-xs font-semibold tracking-wide py-2 transition-colors flex items-center justify-center gap-2 group uppercase"
                            >
                                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                                Usar otra cuenta
                            </button>
                        </div>
                    )}

                    {/* FASE 3: TOTP INPUT */}
                    {loginMethod === 'totp' && (
                        <form onSubmit={handleTotpLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-white">Verificación de 2 Pasos</h3>
                                <p className="text-sm text-slate-400 mt-1">Ingresa el código generado en tu app</p>
                            </div>

                            <div className="flex justify-center my-8">
                                <div className="relative group">
                                    <input
                                        ref={otpInputRef}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={otp}
                                        onChange={handleOtpChange}
                                        onFocus={() => handleFocus('otp')}
                                        onBlur={handleBlur}
                                        className="block w-full text-center text-4xl font-mono tracking-[0.5em] py-4 bg-[#020617]/50 border-b-2 border-slate-700/50 focus:border-cyan-500 focus:bg-[#020617]/80 outline-none transition-all text-white placeholder-slate-700 shadow-xl rounded-t-xl"
                                        placeholder="000000"
                                    />
                                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 focus-within:opacity-100 transition-opacity duration-500" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length < 6}
                                className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold py-4 px-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(8,145,178,0.4)] transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/5"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verificar Acceso'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setLoginMethod(null)}
                                className="w-full text-slate-500 hover:text-white text-xs font-semibold tracking-wide py-2 transition-colors uppercase"
                            >
                                Regresar
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center opacity-60 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                        © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || 'Empresa Segura'}
                    </p>
                </div>
            </div>

            {/* Custom Animation Keyframes */}
            <style jsx global>{`
                @keyframes nebula-slow {
                    0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                    50% { transform: translate(30%, -15%) scale(1.2); opacity: 0.9; }
                    100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                }
                @keyframes nebula-medium {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-20%, 25%) scale(0.85); }
                    66% { transform: translate(15%, -10%) scale(1.1); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes nebula-fast {
                    0% { transform: translate(0, 0) rotate(0deg) scale(1); }
                    50% { transform: translate(15%, 15%) rotate(10deg) scale(1.1); }
                    100% { transform: translate(0, 0) rotate(0deg) scale(1); }
                }
                @keyframes float {
                    0% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-30px) translateX(15px); }
                    100% { transform: translateY(0px) translateX(0px); }
                }
                
                .animate-nebula-slow { animation: nebula-slow 20s infinite ease-in-out; }
                .animate-nebula-medium { animation: nebula-medium 15s infinite ease-in-out; }
                .animate-nebula-fast { animation: nebula-fast 12s infinite ease-in-out; }
                .animate-float { animation: float 10s infinite ease-in-out; }
            `}</style>
        </div>
    );
}