//app/_routes/not-found.jsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8">
      <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-200 mb-4">404</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">Lo sentimos, la página que buscas no existe.</p>
      <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">Volver al inicio</Link>
    </div>
  );
}
