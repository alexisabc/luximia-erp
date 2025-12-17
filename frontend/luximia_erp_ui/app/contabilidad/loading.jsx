
import { Spinner } from '@/components/loaders';

export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
            <Spinner size={64} className="text-blue-600 dark:text-blue-400" />
        </div>
    );
}
