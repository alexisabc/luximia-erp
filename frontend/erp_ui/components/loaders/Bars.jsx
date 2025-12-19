export default function Bars({ width = 40, height = 40, className = "" }) {
    return (
        <svg
            className={`overflow-visible ${className}`}
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="bars-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
                </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
                <rect
                    key={i}
                    x={4 + (i * 5)}
                    y="10"
                    width="3"
                    height="8"
                    rx="1.5"
                    fill="url(#bars-gradient)"
                >
                    <animate
                        attributeName="height"
                        values="4;14;4"
                        dur="1s"
                        repeatCount="indefinite"
                        begin={`${i * 0.15}s`}
                        calcMode="spline"
                        keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                    />
                    <animate
                        attributeName="y"
                        values="10;5;10"
                        dur="1s"
                        repeatCount="indefinite"
                        begin={`${i * 0.15}s`}
                        calcMode="spline"
                        keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                    />
                </rect>
            ))}
        </svg>
    );
}
