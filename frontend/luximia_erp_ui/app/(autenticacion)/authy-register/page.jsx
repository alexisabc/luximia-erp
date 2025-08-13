'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/api';

export default function AuthyRegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('52');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/authy/register/', { username, password, phone, country_code: countryCode });
            setMessage('Registrado correctamente. Revisa tu teléfono y vuelve a iniciar sesión.');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            setMessage('Error al registrar.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
                <h2 className="text-xl font-bold">Vincular Authy</h2>
                <input className="border p-2 w-full" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} required />
                <input className="border p-2 w-full" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                <input className="border p-2 w-full" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required />
                <input className="border p-2 w-full" placeholder="Código de país" value={countryCode} onChange={e => setCountryCode(e.target.value)} required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Registrar</button>
                {message && <p className="text-center text-sm mt-2">{message}</p>}
            </form>
        </div>
    );
}
