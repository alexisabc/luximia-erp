//app/(autenticacion)/enroll/[token]/page.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
// ✨ CAMBIO: Importamos la función específica en lugar del cliente genérico
import { validateEnrollmentToken } from '@/services/api';

export default function EnrollTokenPage() {
  const router = useRouter();
  const { token } = useParams();
  const ran = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setError('No se encontró un token de inscripción en la URL.');
      return;
    }

    (async () => {
      try {
        // ✨ CAMBIO: Usamos la función del servicio de API
        await validateEnrollmentToken(token);
        router.replace('/enroll/setup');
      } catch (err) {
        setError(err.response?.data?.detail || 'Este enlace de inscripción no es válido o ha expirado.');
      }
    })();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="p-8 border border-gray-700 rounded-lg w-full max-w-md bg-gray-800 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Validando enlace...</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}