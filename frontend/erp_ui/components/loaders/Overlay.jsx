import Spinner from '@/components/loaders/Spinner';

export default function Overlay({ show = true, children = null, className = "" }) {
    if (!show) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] grid place-items-center bg-white/60 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-500 ${className}`}
            role="dialog"
            aria-modal="true"
        >
            {children ?? (
                <div className="flex flex-col items-center gap-6 p-8 bg-white/20 dark:bg-black/20 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl">
                    <Spinner size={56} className="text-slate-800 dark:text-white" />
                    <p className="text-xs font-semibold tracking-widest uppercase text-slate-800/70 dark:text-white/70 animate-pulse">
                        Cargando
                    </p>
                </div>
            )}
        </div>
    );
}
