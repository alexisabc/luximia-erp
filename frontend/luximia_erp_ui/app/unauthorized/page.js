import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Acceso denegado</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">No tienes permisos para ver esta página.</p>
      <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">Volver al inicio</Link>
    </div>
  );
}
