'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import apiClient, {
    getUser,
    updateUser,
    listPasskeyCredentials,
    resetPasskeys,
    startTotpReset,
    verifyTotpReset,
} from '@/services/api';
import { startRegistration } from '@simplewebauthn/browser';
import QRCode from 'react-qr-code';

export default function AjustesPage() {
    const { user } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [message, setMessage] = useState('');
    const [passkeys, setPasskeys] = useState([]);
    const [passkeyProvider, setPasskeyProvider] = useState('');
    const [hasTotp, setHasTotp] = useState(false);
    const [totpUri, setTotpUri] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [totpProvider, setTotpProvider] = useState('');

    useEffect(() => {
        if (user) {
            const storedImage = localStorage.getItem('profileImage');
            if (storedImage) setProfileImage(storedImage);
            getUser(user.user_id).then(async res => {
                setFirstName(res.data.first_name || '');
                setLastName(res.data.last_name || '');
                setEmail(res.data.email || '');
                setHasTotp(res.data.has_totp);
                setTotpProvider(res.data.totp_provider || '');
                setPasskeyProvider(res.data.passkey_provider || '');
                if (res.data.has_passkey) {
                    const creds = await listPasskeyCredentials();
                    setPasskeys(creds.data.credentials || []);
                }
            });
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
                localStorage.setItem('profileImage', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setProfileImage(null);
        localStorage.removeItem('profileImage');
    };

    const handleRegisterPasskey = async () => {
        setMessage('');
        try {
            const { data: options } = await apiClient.get('/users/passkey/register/challenge/');
            const registration = await startRegistration({ optionsJSON: options });
            const provider = prompt('Proveedor de la passkey (ej. Nordpass)') || '';
            await apiClient.post('/users/passkey/register/', { ...registration, provider });
            const { data } = await listPasskeyCredentials();
            setPasskeys(data.credentials || []);
            setPasskeyProvider(provider);
            setMessage('Passkey registrada');
        } catch {
            setMessage('Error al registrar Passkey');
        }
    };

    const handleReplacePasskey = async () => {
        try {
            await resetPasskeys();
            setPasskeys([]);
            setPasskeyProvider('');
            await handleRegisterPasskey();
        } catch {
            setMessage('Error al reemplazar Passkey');
        }
    };

    const handleResetPasskey = async () => {
        try {
            await resetPasskeys();
            setPasskeys([]);
            setPasskeyProvider('');
            setMessage('Passkey eliminada');
        } catch {
            setMessage('Error al eliminar Passkey');
        }
    };

    const startTotpSetup = async () => {
        setMessage('');
        try {
            const provider = prompt('App TOTP (ej. Authy)') || '';
            setTotpProvider(provider);
            const { data } = await startTotpReset();
            setTotpUri(data.otpauth_uri);
            setTotpCode('');
        } catch {
            setMessage('Error al iniciar TOTP');
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        try {
            await verifyTotpReset(totpCode, totpProvider);
            setHasTotp(true);
            setTotpUri('');
            setTotpCode('');
            setMessage('TOTP verificado');
        } catch {
            setMessage('Código TOTP inválido');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!user) return;
        try {
            await updateUser(user.user_id, {
                username: user.username,
                first_name: firstName,
                last_name: lastName,
                email,
            });
            setMessage('Datos actualizados');
        } catch (err) {
            setMessage('Error al actualizar');
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-4">
            <h1 className="text-xl font-bold">Ajustes de Usuario</h1>
            {message && <div className="text-center text-sm text-red-500">{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24">
                        <Image src={profileImage || '/icon-luximia.png'} alt="Perfil" fill className="rounded-full object-cover" />
                    </div>
                    <div>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
                        {profileImage && (
                            <button type="button" onClick={removeImage} className="text-red-500 text-sm">Eliminar</button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm">Nombre</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm">Apellido</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-sm">Correo</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar cambios</button>
            </form>
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold">Passkey {passkeyProvider && `(con ${passkeyProvider})`}</h2>
                    {passkeys.length > 0 ? (
                        <ul className="list-disc ml-6">
                            {passkeys.map((p, i) => (
                                <li key={i}>{p.id.slice(0, 10)}... {p.provider && `(${p.provider})`}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No hay passkeys registradas</p>
                    )}
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={handleRegisterPasskey} className="px-3 py-1 bg-blue-600 text-white rounded">Registrar</button>
                        {passkeys.length > 0 && (
                            <>
                                <button type="button" onClick={handleReplacePasskey} className="px-3 py-1 bg-gray-600 text-white rounded">Reemplazar</button>
                                <button type="button" onClick={handleResetPasskey} className="px-3 py-1 bg-red-600 text-white rounded">Eliminar</button>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold">TOTP</h2>
                    {hasTotp ? (
                        <p>Configurado {totpProvider && `con ${totpProvider}`}</p>
                    ) : (
                        <p>No configurado</p>
                    )}
                    {totpUri ? (
                        <form onSubmit={handleVerifyTotp} className="space-y-2 mt-2">
                            <div className="p-2 bg-white inline-block"><QRCode value={totpUri} /></div>
                            <input
                                type="text"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                maxLength={6}
                                className="border p-2 w-full text-center rounded-md bg-white dark:bg-gray-800"
                                placeholder="123456"
                            />
                            <button
                                type="submit"
                                disabled={totpCode.length !== 6}
                                className="px-3 py-1 bg-green-600 text-white rounded w-full"
                            >
                                Verificar
                            </button>
                        </form>
                    ) : (
                        <button
                            type="button"
                            onClick={startTotpSetup}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                        >
                            {hasTotp ? 'Reconfigurar TOTP' : 'Configurar TOTP'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
