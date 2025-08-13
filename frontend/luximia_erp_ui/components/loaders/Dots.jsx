//components/loaders/Dots.jsx
export default function Dots({ size = 10, gap = 8, className = "text-blue-600" }) {
    const color = "currentColor";
    return (
        <div className={`flex items-center ${className}`} style={{ gap }}>
            {[0, 1, 2].map((i) => (
                <svg key={i} width={size} height={size} viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="5" cy="5" r="5" fill={color}>
                        <animate
                            attributeName="opacity"
                            values="0.3;1;0.3"
                            dur="1s"
                            begin={`${i * 0.15}s`}
                            repeatCount="indefinite"
                        />
                        <animateTransform
                            attributeName="transform"
                            type="scale"
                            values="0.8;1;0.8"
                            dur="1s"
                            begin={`${i * 0.15}s`}
                            repeatCount="indefinite"
                            additive="sum"
                        />
                    </circle>
                </svg>
            ))}
        </div>
    );
}
