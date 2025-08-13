// components/LoginAnimation.js

export default function LoginAnimation({ state, eyeTranslation }) {
    // Determinar la transformación completa de los ojos basada en el estado
    let eyesTransform = `translateX(${eyeTranslation}px)`;
    if (state === 'typing-user' || state === 'typing-otp') {
        // Mirar MÁS hacia abajo Y seguir el cursor horizontalmente
        eyesTransform = `translateY(8px) translateX(${eyeTranslation}px)`;
    } else if (state === 'error' || state === 'authenticating') {
        // Solo mirar ligeramente hacia abajo durante el error o autenticación
        eyesTransform = 'translateY(4px)';
    }


    return (
        <>
            <style jsx>{`
                .svg-container, .eyes, .eye {
                    transition: all 0.4s ease-out;
                }
                .eye, .face-circle {
                    transform-origin: center;
                }
                .mouth {
                    /* Transición suave para el atributo 'd' (la forma del path) */
                    transition: d 0.4s ease-in-out;
                }

                /* --- Estados de la Animación --- */
                
                .success .eye-right {
                    animation: success-wink 2s infinite ease-in-out;
                }
                
                .error .svg-container {
                    animation: shake 0.6s ease-in-out;
                }
                
                /* --- Animación IDLE Simple --- */
                .idle .eye {
                    animation: simple-blink 5s infinite;
                }
                @keyframes simple-blink {
                    0%, 95%, 100% { transform: scaleY(1); }
                    97.5% { transform: scaleY(0.1); }
                }

                /* --- Animación BORED Acelerada (Ciclo de 20 segundos) --- */
                .sleep-elements {
                    opacity: 0;
                }
                .bored .face-circle {
                    animation: bored-breathing 20s infinite ease-in-out;
                }
                .bored .sleep-elements {
                    animation: fade-in-sleep 20s infinite;
                }
                .bored .eyes {
                    animation: look-around 20s infinite;
                }
                .bored .eye {
                    animation: sleepy-eyes 20s infinite;
                }
                .bored .drool-bubble {
                    animation: drool-cycle 20s infinite;
                }
                .bored .zzz {
                    animation: zzz-cycle 20s infinite;
                    animation-delay: calc(var(--i) * 0.3s);
                }
                
                /* --- Expresiones de la Boca (Morphing) --- */
                .idle .mouth {
                    d: path('M 40 70 Q 50 75 60 70'); /* Sonrisa normal */
                }
                .typing-user .mouth,
                .typing-otp .mouth {
                    d: path('M 45 72 Q 50 77 55 72'); /* Boca de concentración */
                }
                .authenticating .mouth {
                    d: path('M 42 72 L 58 72'); /* Boca recta mientras se autentica */
                }
                .success .mouth { 
                    d: path('M 40 70 Q 50 85 60 70'); /* Sonrisa grande */
                }
                .error .mouth { 
                    d: path('M 40 75 Q 50 65 60 75'); /* Boca triste */
                }
                .bored .mouth {
                    animation: bored-mouth-morph 20s infinite;
                }

                @keyframes look-around {
                    0%, 12%, 48%, 50%, 100% { transform: translateX(0) translateY(0); }
                    15%, 25% { transform: translateX(-8px) translateY(0); } /* Izquierda */
                    28%, 38% { transform: translateX(8px) translateY(0); }  /* Derecha */
                    40%, 47% { transform: translateY(-8px) translateX(0); } /* Arriba */
                }

                @keyframes sleepy-eyes {
                    0%, 48%, 100% { transform: scaleY(1); }
                    49% { transform: scaleY(0.1); }
                    50%, 99.9% { transform: scaleY(0.1) translateY(2px); }
                }

                @keyframes bored-breathing {
                    0%, 50% { transform: scale(1); }
                    62.5% { transform: scale(1.03); }
                    75% { transform: scale(1); }
                    87.5% { transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
                
                @keyframes fade-in-sleep {
                    0%, 49.9% { opacity: 0; }
                    50%, 100% { opacity: 1; }
                }

                @keyframes bored-mouth-morph {
                    0%, 49.9% { d: path('M 40 70 Q 50 75 60 70'); } /* Sonrisa normal */
                    50%, 99.9% { d: path('M 45 72 Q 50 75 55 72'); } /* Boca de dormido */
                    100% { d: path('M 40 70 Q 50 75 60 70'); }
                }

                @keyframes drool-cycle {
                    0%, 50%, 95%, 100% { transform: scale(0); }
                    70% { transform: scale(1.2); }
                    85% { transform: scale(1); }
                }

                @keyframes zzz-cycle {
                    0%, 50%, 95%, 100% { opacity: 0; transform: translateY(0); }
                    55% { opacity: 1; }
                    90% { opacity: 0; transform: translateY(-20px); }
                }

                @keyframes shake {
                    10%, 90% { transform: translateX(-2px) rotate(-3deg); }
                    20%, 80% { transform: translateX(4px) rotate(3deg); }
                    30%, 50%, 70% { transform: translateX(-6px) rotate(-3deg); }
                    40%, 60% { transform: translateX(6px) rotate(3deg); }
                }

                @keyframes success-wink {
                    0%, 80%, 100% { transform: scaleY(1); }
                    90% { transform: scaleY(0.1); }
                }
            `}</style>
            <svg viewBox="0 0 100 100" className={state}>
                <g className="svg-container">
                    {/* Cara */}
                    <circle className="face-circle" cx="50" cy="50" r="45" fill="#e0e0e0" />

                    {/* Ojos */}
                    <g className="eyes" style={{ transform: eyesTransform }}>
                        <circle className="eye eye-left" cx="35" cy="45" r="5" fill="#333" />
                        <circle className="eye eye-right" cx="65" cy="45" r="5" fill="#333" />
                    </g>

                    {/* Boca (una sola línea que se transforma) */}
                    <path className="mouth" d="M 40 70 Q 50 75 60 70" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />

                    {/* Elementos para dormir */}
                    <g className="sleep-elements">
                        <circle className="drool-bubble" cx="42" cy="78" r="4" fill="#aedff7" style={{ transformOrigin: '42px 78px' }} />
                        <text className="zzz" x="65" y="40" fontSize="10" fill="#333" style={{ "--i": 1 }}>Z</text>
                        <text className="zzz" x="70" y="30" fontSize="12" fill="#333" style={{ "--i": 2 }}>z</text>
                        <text className="zzz" x="75" y="20" fontSize="14" fill="#333" style={{ "--i": 3 }}>z</text>
                    </g>
                </g>
            </svg>
        </>
    );
}