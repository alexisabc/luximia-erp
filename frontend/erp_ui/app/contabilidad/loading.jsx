
import Spinner from '@/components/atoms/Spinner';

export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
            <Spinner size="xl" variant="primary" />
        </div>
    );
}
