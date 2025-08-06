'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiClient from '../../services/api';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';

export default function EnrollPage() {
  const router = useRouter();
  const { token } = router.query || {};

  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrUri, setQrUri] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Validate enrollment token on load
  useEffect(() => {
    if (!token) return;
    const validate = async () => {
      try {
        await apiClient.post('/users/enrollment/validate/', { token });
      } catch (err) {
        setError('Token inválido o expirado.');
      }
    };
    validate();
  }, [token]);

  // Fetch TOTP setup when moving to step 2
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
    setLoading(true);
    setError(null);
    try {
      const { data: options } = await apiClient.get('/users/passkey/register/challenge/');

      // El objeto que devuelve startRegistration es complejo y contiene toda la info criptográfica.
      const registrationResponse = await startRegistration(options);

      // 👇 CAMBIO CLAVE: Envía el objeto completo, sin seleccionar campos.
      await apiClient.post('/users/passkey/register/', registrationResponse);

      setStep(2); // Avanza al siguiente paso (TOTP)
    } catch (err) {
      // Si el usuario cancela, err.name suele ser 'AbortError' o 'InvalidStateError'.
      // Puedes manejarlo para no mostrar un mensaje de error genérico.
      if (err.name === 'AbortError' || err.name === 'InvalidStateError') {
        setError('El registro de la passkey fue cancelado.');
      } else {
        setError('Error al registrar la passkey.');
      }
      console.error("Error en Passkey:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/users/totp/verify/', { code: totpCode });
      router.push('/dashboard');
    } catch (err) {
      setError('Código TOTP inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-6 border rounded w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Inscripción de Seguridad</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <p>Paso 1: Configura tu passkey para continuar.</p>
            <button
              onClick={handlePasskey}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loading ? 'Procesando...' : 'Configurar Passkey'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <p>Paso 2: Escanea el código QR y verifica tu código TOTP.</p>
            {qrUri && (
              <div className="flex justify-center">
                <QRCode value={qrUri} />
              </div>
            )}
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              className="border p-2 w-full text-center tracking-widest"
              placeholder="Ingresa tu código de 6 dígitos"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

