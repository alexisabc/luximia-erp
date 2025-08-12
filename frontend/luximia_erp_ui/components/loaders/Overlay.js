// components/loaders/Overlay.js
import Spinner from "./Spinner";

export default function Overlay({ show = false, children = null }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            {children ?? <Spinner size={56} className="text-blue-600" />}
        </div>
    );
}
