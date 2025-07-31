// components/LoginAnimation.js

export default function LoginAnimation({ state, eyeTranslation }) {
    // Determinar la transformación completa de los ojos basada en el estado
    let eyesTransform = `translateX(${eyeTranslation}px)`;
    if (state === 'typing-user') {
        // Mirar MÁS hacia abajo Y seguir el cursor horizontalmente
        eyesTransform = `translateY(8px) translateX(${eyeTranslation}px)`;
    } else if (state === 'error') {
        // Solo mirar hacia abajo durante el error
        eyesTransform = 'translateY(4px)';
    } else if (state === 'peeking-pass') {
        // Centrar los ojos cuando se tapa la cara
        eyesTransform = 'translateX(0px)';
    }


    return (
        <>
            <style jsx>{`
                .svg-container, .eyes, .mouth, .eye {
                    transition: all 0.4s ease-out;
                }
                .eye {
                    transform-origin: center;
                }

                /* --- Estados de la Animación --- */

                /* Ojos cerrados al escribir contraseña */
                .typing-pass .eye {
                    transform: scaleY(0.1);
                }

                /* Animación de espiar (humanizada) */
                .peeking-pass .eye-left {
                    animation: peek-squint-left 4s infinite ease-in-out;
                }
                .peeking-pass .eye-right {
                    animation: peek-squint-right 4s infinite ease-in-out;
                }
                
                /* Estado de éxito */
                .success .eye-left { transform: scaleY(0.1) translateY(40px) translateX(-5px); }
                .success .eye-right { transform: scaleY(0.1) translateY(40px) translateX(5px); }
                .success .mouth { d: path('M 40 70 Q 50 85 60 70'); stroke-width: 3; }

                /* Estado de error: sacudir la cabeza */
                .error .svg-container {
                    animation: shake 0.6s ease-in-out;
                }
                .error .mouth { 
                    d: path('M 40 75 Q 50 65 60 75');
                }
                
                /* --- Animación IDLE Simple --- */
                .idle .eye {
                    animation: simple-blink 5s infinite;
                }
                @keyframes simple-blink {
                    0%, 95%, 100% { transform: scaleY(1); }
                    97.5% { transform: scaleY(0.1); }
                }

                /* --- Animación BORED Compleja (Ciclo de 60 segundos) --- */
                .sleep-elements {
                    opacity: 0; /* Oculto por defecto */
                }
                .bored .sleep-elements {
                    opacity: 1; /* Visible solo en estado 'bored' */
                }
                .bored .eyes {
                    animation: look-around 60s infinite;
                }
                .bored .eye {
                    animation: sleepy-eyes 60s infinite;
                }
                .bored .drool-bubble {
                    animation: drool-anim 60s infinite;
                }
                .bored .zzz {
                    animation: zzz-anim 60s infinite;
                    animation-delay: calc(var(--i) * 0.2s); /* Delay para cada Z */
                }

                /* 0-30s: Mirando alrededor */
                @keyframes look-around {
                    0%, 4%, 20%, 25%, 48%, 50%, 100% { transform: translateX(0) translateY(0); }
                    5%, 9% { transform: translateX(-8px) translateY(0); }   /* Izquierda */
                    10%, 14% { transform: translateX(8px) translateY(0); }  /* Derecha */
                    15%, 19% { transform: translateY(-8px) translateX(0); } /* Arriba */
                }

                /* 0-30s: Parpadeo | 30-60s: Durmiendo */
                @keyframes sleepy-eyes {
                    0%, 23%, 27%, 48%, 100% { transform: scaleY(1); }
                    25% { transform: scaleY(0.1); } /* Parpadeo */
                    50%, 99.9% { transform: scaleY(0.1) translateY(2px); } /* Durmiendo */
                }

                /* 50-60s: Babeo */
                @keyframes drool-anim {
                    0%, 83%, 100% { transform: scale(0); opacity: 0; }
                    83.1% { transform: scale(0); opacity: 1; }
                    88% { transform: scale(1.2); } /* Se infla */
                    95% { transform: scale(1); } /* Se desinfla un poco */
                    99.9% { transform: scale(0); opacity: 1; }
                }

                /* 40-50s: Zzz */
                @keyframes zzz-anim {
                    0%, 66%, 83%, 100% { opacity: 0; transform: translate(5px, -5px) scale(0.8); }
                    66.1% { opacity: 1; transform: translate(5px, -5px) scale(1); }
                    82.9% { opacity: 0; transform: translate(15px, -40px) scale(1.5); }
                }

                /* Animación de sacudir la cabeza */
                @keyframes shake {
                    10%, 90% { transform: translateX(-2px) rotate(-3deg); }
                    20%, 80% { transform: translateX(4px) rotate(3deg); }
                    30%, 50%, 70% { transform: translateX(-6px) rotate(-3deg); }
                    40%, 60% { transform: translateX(6px) rotate(3deg); }
                }

                /* Animación de espiar (humanizada) */
                @keyframes peek-squint-left {
                    0%, 20%  { transform: scaleY(0.1); } /* Cerrado */
                    25%, 45% { transform: scaleY(0.6); } /* Entrecerrado */
                    50%, 100%{ transform: scaleY(0.1); } /* Cerrado */
                }
                @keyframes peek-squint-right {
                    0%, 50%  { transform: scaleY(0.1); } /* Cerrado */
                    55%, 75% { transform: scaleY(0.6); } /* Entrecerrado */
                    80%, 100%{ transform: scaleY(0.1); } /* Cerrado */
                }
            `}</style>
            <svg viewBox="0 0 100 100" className={state}>
                <g className="svg-container">
                    {/* Cara */}
                    <circle cx="50" cy="50" r="45" fill="#e0e0e0" />

                    {/* Ojos */}
                    <g className="eyes" style={{ transform: eyesTransform }}>
                        <circle className="eye eye-left" cx="35" cy="45" r="5" fill="#333" />
                        <circle className="eye eye-right" cx="65" cy="45" r="5" fill="#333" />
                    </g>

                    {/* Boca */}
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