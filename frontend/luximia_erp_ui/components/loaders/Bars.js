// components/loaders/Bars.js
export default function Bars({ width = 48, height = 24, className = "text-blue-600" }) {
    const barW = 4, gap = 3;
    return (
        <svg
            className={`overflow-visible ${className}`}
            width={width}
            height={height}
            viewBox="0 0 32 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[0, 1, 2, 3].map((i) => (
                <rect
                    key={i}
                    x={i * (barW + gap)}
                    y="4"
                    width={barW}
                    height="16"
                    rx="2"
                    fill="currentColor"
                >
                    <animate
                        attributeName="y"
                        values="10;4;10"
                        dur="0.9s"
                        repeatCount="indefinite"
                        begin={`${i * 0.1}s`}
                    />
                    <animate
                        attributeName="height"
                        values="4;16;4"
                        dur="0.9s"
                        repeatCount="indefinite"
                        begin={`${i * 0.1}s`}
                    />
                </rect>
            ))}
        </svg>
    );
}
