export default function Dots({ size = 12, className = "text-blue-600 dark:text-blue-500" }) {
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-full bg-currentColor animate-bounce"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: 'currentColor',
                        animationDuration: '0.6s',
                        animationDelay: `${i * 0.15}s`,
                        animationDirection: 'alternate' // Efecto yo-yo suave
                    }}
                />
            ))}
        </div>
    );
}
