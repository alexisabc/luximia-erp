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
    // Target: Active (0,0) covers eyes. Idle moves them off-screen diagonally (from bottom corners).
    // Left starts at -50, 50. Right starts at 50, 50.
    const leftPawTransform = isTypingOtp ? 'translate(0, 0)' : 'translate(-60px, 60px)';
    const rightPawTransform = isTypingOtp ? 'translate(0, 0)' : 'translate(60px, 60px)';

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
                .success .ear-left {
                    animation: ear-wiggle 1s ease-in-out infinite;
                    transform-origin: 22px 36px;
                }
                .success .ear-right {
                    animation: ear-wiggle 1s ease-in-out infinite;
                    transform-origin: 78px 36px;
                }
                @keyframes wink {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.1); }
                }
                @keyframes ear-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(10deg); }
                }

                /* ERROR: Negación "No" (Movimiento de cara 3D) */
                .error .face-features {
                    animation: no-gesture 1s ease-in-out infinite;
                }
                @keyframes no-gesture {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
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
                .typing-user .mouth { d: path('M 43 73 Q 50 76 57 73'); }
                .typing-otp .mouth  { d: path('M 45 68 Q 50 65 55 68'); }
                .authenticating .mouth { d: path('M 43 72 L 57 72'); } 
                .success .mouth     { d: path('M 42 70 Q 50 78 58 70'); }
                .error .mouth       { d: path('M 43 74 Q 50 68 57 74'); }
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
                    {/* Orejas - Grouped for proper animation of inner parts */}
                    <g className="ear-left">
                        <circle cx="22" cy="30" r="10" fill="#795548" />
                        <circle cx="22" cy="30" r="5" fill="#4e342e" />
                    </g>
                    <g className="ear-right">
                        <circle cx="78" cy="30" r="10" fill="#795548" />
                        <circle cx="78" cy="30" r="5" fill="#4e342e" />
                    </g>

                    {/* Cabeza Base */}
                    <circle cx="50" cy="55" r="35" fill="#8d6e63" />

                    {/* GRUPO CARA (Para animar el giro independientemente de la cabeza) */}
                    <g className="face-features">
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
                </g>

                {/* Manos cubriendo ojos (Diagonal desde los lados) */}
                <g className="hands-container">
                    {/* MANO IZQUIERDA */}
                    {/* MANO IZQUIERDA */}
                    <g className="paw-group paw-left" style={{ transform: leftPawTransform }}>
                        {/* Brazo y Mano - Slimmer Design */}
                        <path
                            d="M 12 110 L 28 65 Q 38 48 48 65 L 52 110 Z"
                            fill="#795548" stroke="#5d4037" strokeWidth="1"
                        />
                        {/* Almohadilla */}
                        <ellipse cx="38" cy="72" rx="6" ry="4.5" fill="#d7ccc8" transform="rotate(-20 38 72)" />

                        {/* Garritas (Estilizadas y Curvas) */}
                        <path d="M 30 58 Q 28 50 33 50 Q 34 54 35 57 Z" fill="#3e2723" />
                        <path d="M 37 55 Q 36 46 41 46 Q 42 50 43 55 Z" fill="#3e2723" />
                        <path d="M 45 58 Q 46 50 50 50 Q 49 54 50 57 Z" fill="#3e2723" />
                    </g>

                    {/* MANO DERECHA */}
                    <g className="paw-group paw-right" style={{ transform: rightPawTransform }}>
                        {/* Brazo y Mano - Slimmer Design */}
                        <path
                            d="M 88 110 L 72 65 Q 62 48 52 65 L 48 110 Z"
                            fill="#795548" stroke="#5d4037" strokeWidth="1"
                        />
                        {/* Almohadilla */}
                        <ellipse cx="62" cy="72" rx="6" ry="4.5" fill="#d7ccc8" transform="rotate(20 62 72)" />

                        {/* Garritas (Estilizadas y Curvas) */}
                        <path d="M 70 58 Q 72 50 67 50 Q 66 54 65 57 Z" fill="#3e2723" />
                        <path d="M 63 55 Q 64 46 59 46 Q 58 50 57 55 Z" fill="#3e2723" />
                        <path d="M 55 58 Q 54 50 50 50 Q 51 54 50 57 Z" fill="#3e2723" />
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
