export default function Spinner({ size = 48, className = "" }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg
                className="animate-spin"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                    </linearGradient>
                </defs>

                {/* Track (Fondo sutil) */}
                <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" className="opacity-10" />

                {/* Indicator (Anillo giratorio con gradiente) */}
                <path
                    d="M25 5 A 20 20 0 0 1 45 25"
                    stroke="url(#spinner-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>

            {/* Destello central opcional para efecto premium */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 rounded-full animate-pulse" />
        </div>
    );
}
