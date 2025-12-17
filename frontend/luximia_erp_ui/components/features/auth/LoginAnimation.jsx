// components/ui/LoginAnimation.jsx
export default function LoginAnimation({ state, eyeTranslation }) {
    // Definimos si estamos en modo OTP
    const isTypingOtp = state === 'typing-otp';
    const isTypingUser = state === 'typing-user';
    const isError = state === 'error';
    const isSuccess = state === 'success';
    const isBored = state === 'bored';
    const isWaiting = state === 'waiting';

    // Ojos: Siguen el cursor (limitado)
    let eyesX = eyeTranslation;
    let eyesY = 0;

    // Escala de ojos para parpadeo o dormir
    let eyeScaleY = 1;

    if (isTypingUser) {
        // Mirar abajo (al input) pero siguiendo X
        eyesY = 3;

        // Limitar el movimiento de los ojos para que no se salgan de la cara
        // El rango de eyeTranslation viene del padre (-12 a +12)
        // Lo suavizamos un poco
        eyesX = Math.max(-10, Math.min(10, eyeTranslation));

    } else if (isTypingOtp) {
        // Si se cubre los ojos, que los cierre fuerte
        eyeScaleY = 0.1;
        eyesY = 2;
    } else if (isError) {
        eyesY = 6; // Mirar abajo (triste)
        eyesX = 0; // Centrar
    } else if (isSuccess) {
        eyesY = -2; // Mirar un poco arriba (feliz)
        eyesX = 0;
    } else if (isBored) {
        // Ojos cerrados al dormir
        eyeScaleY = 0.1;
        eyesY = 2;
        eyesX = 0;
    } else if (isWaiting) {
        // En espera, la animación CSS 'look-around' controla el movimiento
        eyesY = 0;
        eyesX = 0;
    }

    // Manos:
    // Target X: Move towards center. Left starts ~25, needs ~45 (+20). Right starts ~75, needs ~55 (-20).
    // Target Y: Starts ~105 (hidden). Needs ~45 (-60).
    const leftPawTransform = isTypingOtp ? 'translate(22px, -60px)' : 'translate(0, 0)';
    const rightPawTransform = isTypingOtp ? 'translate(-22px, -60px)' : 'translate(0, 0)';

    return (
        <>
            <style jsx>{`
                /* Contenedor SVG */
                .bear-svg {
                    overflow: hidden; 
                    border-radius: 50%;
                    background-color: #d7ccc8;
                }

                .transition-all {
                    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }
                
                /* Ojos más rápidos para seguir el tipeo */
                .eyes {
                    transition: transform 0.1s ease-out !important;
                }

                /* --- Animaciones de Estado --- */
                
                /* IDLE: Parpadeo */
                .idle .eye {
                    animation: blink 4s infinite;
                    transform-origin: center;
                }
                @keyframes blink {
                    0%, 96%, 100% { transform: scaleY(1); }
                    98% { transform: scaleY(0.1); }
                }

                /* SUCCESS */
                .success .eye-right {
                    animation: wink 1s forwards;
                    transform-origin: center;
                }
                .success .ear {
                    animation: ear-wiggle 1s ease-in-out infinite;
                    transform-origin: center 80%;
                }
                @keyframes wink {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.1); }
                }
                @keyframes ear-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(10deg); }
                }

                /* ERROR */
                .error .head-group {
                    animation: shake 0.5s ease-in-out;
                    transform-origin: 50px 80px;
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    75% { transform: rotate(3deg); }
                }

                /* BORED: Respiración, Zzz y Burbuja */
                .bored .head-group {
                    animation: snooze-head 4s ease-in-out infinite alternate;
                    transform-origin: 50px 100px;
                }
                .bored .mouth {
                    d: path('M 47 72 Q 50 74 53 72'); /* Boca pequeña "o" */
                    transition: d 1s;
                }
                .bored .snot-bubble {
                    animation: snot-expand 4s ease-in-out infinite alternate;
                    transform-origin: 52px 68px; /* Origen en la nariz */
                }
                .zzz {
                    opacity: 0;
                    animation: float-z 3s infinite linear;
                }
                .zzz:nth-child(1) { animation-delay: 0s; }
                .zzz:nth-child(2) { animation-delay: 1s; }
                .zzz:nth-child(3) { animation-delay: 2s; }

                @keyframes snooze-head {
                    from { transform: translateY(0) rotate(0deg); }
                    to { transform: translateY(2px) rotate(1deg); }
                }
                @keyframes snot-expand {
                    0% { transform: scale(0); opacity: 0; }
                    40% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(0.2); opacity: 0.4; }
                }
                @keyframes float-z {
                    0% { transform: translate(60px, 40px) scale(0.5); opacity: 0; }
                    20% { opacity: 1;fill: #3e2723; }
                    100% { transform: translate(80px, 10px) scale(1.5); opacity: 0; }
                }

                .paw-group {
                    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                }

                .mouth {
                    fill: none;
                    stroke: #3e2723;
                    stroke-width: 2;
                    stroke-linecap: round;
                    transition: d 0.3s ease;
                }
                .idle .mouth        { d: path('M 45 74 Q 50 76 55 74'); }
                .typing-user .mouth { d: path('M 42 72 Q 50 78 58 72'); }
                .typing-otp .mouth  { d: path('M 45 68 Q 50 65 55 68'); }
                .authenticating .mouth { d: path('M 40 72 L 60 72'); } 
                .success .mouth     { d: path('M 35 68 Q 50 85 65 68'); }
                .error .mouth       { d: path('M 38 78 Q 50 65 62 78'); }
                .waiting .mouth     { d: path('M 45 74 Q 50 76 55 74'); } /* Igual a idle */

                /* WAITING: Mirar a los lados */
                .waiting .eyes {
                    animation: look-around 8s infinite;
                    transform-origin: center;
                }
                @keyframes look-around {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-8px, 0); } /* Izquierda */
                    15% { transform: translate(-8px, 0); }
                    25% { transform: translate(8px, 0); } /* Derecha */
                    30% { transform: translate(8px, 0); }
                    40% { transform: translate(0, -5px); } /* Arriba / Pensando */
                    45% { transform: translate(0, -5px); }
                    55% { transform: translate(0, 0); } /* Centro */
                }

            `}</style>

            <svg viewBox="0 0 100 100" className={`bear-svg ${state}`}>
                <g className="head-group transition-all">
                    {/* Orejas */}
                    <circle className="ear" cx="22" cy="30" r="10" fill="#795548" />
                    <circle className="ear" cx="78" cy="30" r="10" fill="#795548" />
                    <circle cx="22" cy="30" r="5" fill="#4e342e" />
                    <circle cx="78" cy="30" r="5" fill="#4e342e" />

                    {/* Cabeza Base */}
                    <circle cx="50" cy="55" r="35" fill="#8d6e63" />

                    {/* Hocico */}
                    <ellipse cx="50" cy="66" rx="14" ry="11" fill="#d7ccc8" />
                    <ellipse cx="50" cy="60" rx="4" ry="3" fill="#3e2723" />

                    {/* Ojos */}
                    <g className="eyes transition-all" style={{ transform: `translate(${eyesX}px, ${eyesY}px)` }}>
                        {/* Se cierran visualmente en bored modificando el rx/ry */}
                        <ellipse className="eye eye-left" cx="38" cy="50" rx="3.5" ry={3.5 * eyeScaleY} fill="#212121" />
                        <ellipse className="eye eye-right" cx="62" cy="50" rx="3.5" ry={3.5 * eyeScaleY} fill="#212121" />
                    </g>

                    {/* Burbuja de Baba (Solo visible en bored) */}
                    {isBored && (
                        <circle className="snot-bubble" cx="54" cy="65" r="5" fill="#b3e5fc" opacity="0.6" stroke="#81d4fa" strokeWidth="0.5" />
                    )}

                    {/* Boca */}
                    <path className="mouth" />
                </g>

                {/* Manos cubriendo ojos - Ahora con brazos para evitar efecto flotante */}
                <g className="hands-container">
                    {/* MANO IZQUIERDA */}
                    <g className="paw-group paw-left" style={{ transform: leftPawTransform }}>
                        <path
                            d="M 13 200 L 13 125 Q 13 105 25 105 Q 37 105 37 125 L 37 200 Z"
                            fill="#795548" stroke="#5d4037" strokeWidth="1"
                        />
                        <ellipse cx="25" cy="122" rx="6" ry="7" fill="#d7ccc8" transform="rotate(-10 25 122)" />
                        <circle cx="17" cy="108" r="2" fill="#3e2723" />
                        <circle cx="25" cy="102" r="2" fill="#3e2723" />
                        <circle cx="33" cy="108" r="2" fill="#3e2723" />
                    </g>
                    {/* MANO DERECHA */}
                    <g className="paw-group paw-right" style={{ transform: rightPawTransform }}>
                        <path
                            d="M 63 200 L 63 125 Q 63 105 75 105 Q 87 105 87 125 L 87 200 Z"
                            fill="#795548" stroke="#5d4037" strokeWidth="1"
                        />
                        <ellipse cx="75" cy="122" rx="6" ry="7" fill="#d7ccc8" transform="rotate(10 75 122)" />
                        <circle cx="83" cy="108" r="2" fill="#3e2723" />
                        <circle cx="75" cy="102" r="2" fill="#3e2723" />
                        <circle cx="67" cy="108" r="2" fill="#3e2723" />
                    </g>
                </g>

                {/* Elementos 'Zzz' */}
                {isBored && (
                    <g className="zzz-container">
                        {/* Removemos x/y estáticos porque la animación usa translate absoluto desde 0,0 */}
                        <text className="zzz" fill="#3e2723" fontWeight="bold" fontSize="14" style={{ fontFamily: 'sans-serif' }}>Z</text>
                        <text className="zzz" fill="#3e2723" fontWeight="bold" fontSize="14" style={{ fontFamily: 'sans-serif' }}>Z</text>
                        <text className="zzz" fill="#3e2723" fontWeight="bold" fontSize="14" style={{ fontFamily: 'sans-serif' }}>Z</text>
                    </g>
                )}
            </svg>
        </>
    );
}
