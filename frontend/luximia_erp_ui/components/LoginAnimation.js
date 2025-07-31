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

                .typing-pass .eye {
                    transform: scaleY(0.1);
                }

                .peeking-pass .eye-left {
                    animation: peek-squint-left 4s infinite ease-in-out;
                }
                .peeking-pass .eye-right {
                    animation: peek-squint-right 4s infinite ease-in-out;
                }
                
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

                /* --- Animación BORED Compleja --- */
                .sleep-elements {
                    opacity: 0;
                }
                .bored .sleep-elements {
                    animation: fade-in-sleep 60s infinite;
                }
                .bored .eyes {
                    animation: look-around 60s infinite;
                }
                .bored .eye {
                    animation: sleepy-eyes 60s infinite;
                }
                .bored .drool-bubble {
                    animation: drool-cycle 20s infinite 30s;
                }
                .bored .zzz {
                    animation: zzz-cycle 3s infinite;
                    animation-delay: calc(30s + var(--i) * 0.3s);
                }
                
                /* --- Expresiones de la Boca con Transiciones Suaves --- */
                .mouth {
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                }
                .idle .mouth-idle,
                .typing-user .mouth-typing,
                .peeking-pass .mouth-peeking,
                .typing-pass .mouth-peeking, /* CORRECCIÓN: Añadido para que la boca no desaparezca */
                .success .mouth-success,
                .error .mouth-error {
                    opacity: 1;
                }
                
                .bored .mouth-idle {
                    animation: fade-out-mouth 60s infinite;
                }
                .bored .mouth-bored {
                    animation: fade-in-mouth 60s infinite;
                }

                @keyframes look-around {
                    0%, 4%, 20%, 25%, 48%, 50%, 100% { transform: translateX(0) translateY(0); }
                    5%, 9% { transform: translateX(-8px) translateY(0); }
                    10%, 14% { transform: translateX(8px) translateY(0); }
                    15%, 19% { transform: translateY(-8px) translateX(0); }
                }

                @keyframes sleepy-eyes {
                    0%, 23%, 27%, 48%, 100% { transform: scaleY(1); }
                    25% { transform: scaleY(0.1); }
                    50%, 99.9% { transform: scaleY(0.1) translateY(2px); }
                }
                
                @keyframes fade-in-sleep {
                    0%, 49.9% { opacity: 0; }
                    50%, 100% { opacity: 1; }
                }
                
                @keyframes fade-out-mouth {
                    0%, 49.9% { opacity: 1; }
                    50%, 100% { opacity: 0; }
                }
                @keyframes fade-in-mouth {
                    0%, 49.9% { opacity: 0; }
                    50%, 100% { opacity: 1; }
                }

                @keyframes drool-cycle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }

                @keyframes zzz-cycle {
                    0% { opacity: 0; transform: translate(5px, -5px) scale(0.8); }
                    20% { opacity: 1; transform: translate(5px, -5px) scale(1); }
                    80% { opacity: 0; transform: translate(15px, -40px) scale(1.5); }
                    100% { opacity: 0; }
                }

                @keyframes shake {
                    10%, 90% { transform: translateX(-2px) rotate(-3deg); }
                    20%, 80% { transform: translateX(4px) rotate(3deg); }
                    30%, 50%, 70% { transform: translateX(-6px) rotate(-3deg); }
                    40%, 60% { transform: translateX(6px) rotate(3deg); }
                }

                @keyframes peek-squint-left {
                    0%, 20%  { transform: scaleY(0.1); }
                    25%, 45% { transform: scaleY(0.6); }
                    50%, 100%{ transform: scaleY(0.1); }
                }
                @keyframes peek-squint-right {
                    0%, 50%  { transform: scaleY(0.1); }
                    55%, 75% { transform: scaleY(0.6); }
                    80%, 100%{ transform: scaleY(0.1); }
                }
                @keyframes success-wink {
                    0%, 80%, 100% { transform: scaleY(1); }
                    90% { transform: scaleY(0.1); }
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

                    {/* Grupo de Bocas para Transiciones */}
                    <g>
                        <path className="mouth mouth-idle" d="M 40 70 Q 50 75 60 70" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path className="mouth mouth-typing" d="M 45 72 Q 50 77 55 72" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path className="mouth mouth-peeking" d="M 42 72 L 58 72" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path className="mouth mouth-success" d="M 40 70 Q 50 85 60 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <path className="mouth mouth-error" d="M 40 75 Q 50 65 60 75" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path className="mouth mouth-bored" d="M 45 72 Q 50 75 55 72" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </g>

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