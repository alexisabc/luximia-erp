// app/error.js
'use client';

export default function Error({ error, reset }) {
  // opcional: console.error(error);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full bg-gray-800 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-gray-300 mb-4">
          Ocurrió un error inesperado. Intenta recargar la página.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Reintentar
          </button>
          <a href="/" className="text-blue-400 hover:underline">Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
