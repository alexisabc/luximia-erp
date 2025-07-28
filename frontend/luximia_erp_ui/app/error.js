'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Algo salió mal</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Se produjo un error inesperado. Puedes intentar recargar la página.</p>
          <div className="flex gap-4">
            <button onClick={() => reset()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Reintentar</button>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">Volver al inicio</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
