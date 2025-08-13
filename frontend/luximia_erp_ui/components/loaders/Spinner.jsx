//components/loaders/Spinner.jsx
export default function Spinner({ size = 40, className = "text-blue-600" }) {
    const box = 24;
    return (
        <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg className="animate-spin" viewBox={`0 0 ${box} ${box}`} xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
            </svg>
        </div>
    );
}
