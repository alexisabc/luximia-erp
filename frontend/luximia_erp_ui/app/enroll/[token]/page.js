//app/enroll/[token]/page.js
'use client';

import { Suspense, useEffect, useState } from 'react';
// ✨ CAMBIO: Se importa `useParams` en lugar de `useSearchParams`.
import { useRouter, useParams } from 'next/navigation';
import apiClient from '../../../services/api';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';

function EnrollmentComponent() {
  const router = useRouter();
  // ✨ CAMBIO: Se usa `useParams` para leer el token de la ruta dinámica.
  const params = useParams();
  const token = params.token;

  const [step, setStep] = useState(1);
  const [isTokenValidated, setIsTokenValidated] = useState(false);
  const [error, setError] = useState(null);

  // ✨ MEJORA: Estados de carga más específicos para una mejor UX.
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [qrUri, setQrUri] = useState('');
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    console.log(">>> [FRONTEND] Token leído de la URL:", token);
    if (token) {
      setIsValidatingToken(true);
      setError(null);
      apiClient.post('/users/enrollment/validate/', { token })
        .then(() => {
          console.log("Token validado con éxito.");
          setIsTokenValidated(true);
        })
        .catch(() => {
          setError("Este enlace de inscripción no es válido o ha expirado.");
        })
        .finally(() => {
          setIsValidatingToken(false);
        });
    } else {
      setIsValidatingToken(false);
      setError("No se encontró un token de inscripción en la URL.");
    }
  }, [token]);

  useEffect(() => {
    if (step !== 2) return;
    const fetchTotp = async () => {
      try {
        const { data } = await apiClient.post('/users/totp/setup/');
        setQrUri(data.otpauth_uri);
      } catch (err) {
        setError('No se pudo obtener el código QR.');
      }
    };
    fetchTotp();
  }, [step]);

  const handlePasskey = async () => {
    setIsProcessing(true); // ✨ Se usa el estado de procesamiento
    setError(null);
    try {
      const { data: options } = await apiClient.get('/users/passkey/register/challenge/');
      if (!options || !options.challenge) {
        throw new Error("Respuesta inválida del servidor.");
      }
      const registrationResponse = await startRegistration(options);
      await apiClient.post('/users/passkey/register/', registrationResponse);
      setStep(2);
    } catch (err) {
      setError(err.name === 'AbortError' ? 'Registro de passkey cancelado.' : 'Error al registrar la passkey.');
      console.error("Error en Passkey:", err);
    } finally {
      setIsProcessing(false); // ✨ Se finaliza el procesamiento
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setIsProcessing(true); // ✨ Se usa el estado de procesamiento
    setError(null);
    try {
      await apiClient.post('/users/totp/verify/', { code: totpCode });
      router.push('/login?enrolled=true');
    } catch (err) {
      setError('Código TOTP inválido.');
    } finally {
      setIsProcessing(false); // ✨ Se finaliza el procesamiento
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="p-8 border border-gray-700 rounded-lg w-full max-w-md bg-gray-800 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Inscripción de Seguridad</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-center text-gray-400">Paso 1: Configura tu passkey para continuar.</p>
            <button
              onClick={handlePasskey}
              // ✨ MEJORA: La lógica de deshabilitado es más clara
              disabled={!isTokenValidated || isValidatingToken || isProcessing}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-500"
            >
              {/* ✨ MEJORA: El texto del botón es más informativo */}
              {isValidatingToken ? 'Validando enlace...' : (isProcessing ? 'Procesando...' : 'Configurar Passkey')}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <p className="text-center text-gray-400">Paso 2: Escanea el código QR y verifica el código.</p>
            {qrUri ? (
              <div className="p-4 bg-white flex justify-center">
                <QRCode value={qrUri} />
              </div>
            ) : <p className="text-center">Cargando código QR...</p>}
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              className="border p-2 w-full text-center tracking-widest bg-gray-700 text-white rounded"
              placeholder="123456"
              required
            />
            <button
              type="submit"
              disabled={isProcessing} // ✨ Se usa el estado de procesamiento
              className="bg-green-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
            >
              {isProcessing ? 'Verificando...' : 'Verificar y Activar Cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <EnrollmentComponent />
    </Suspense>
  );
}