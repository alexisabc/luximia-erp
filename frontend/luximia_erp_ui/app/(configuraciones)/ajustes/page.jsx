'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getUser, updateUser } from '@/services/api';

export default function AjustesPage() {
    const { user } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            const storedImage = localStorage.getItem('profileImage');
            if (storedImage) setProfileImage(storedImage);
            getUser(user.user_id).then(res => {
                setFirstName(res.data.first_name || '');
                setLastName(res.data.last_name || '');
                setEmail(res.data.email || '');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!user) return;
        if (password && password !== confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            return;
        }
        try {
            const payload = {
                username: user.username,
                first_name: firstName,
                last_name: lastName,
                email
            };
            if (password) payload.password = password;
            await updateUser(user.user_id, payload);
            setMessage('Datos actualizados');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setMessage('Error al actualizar');
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-4">
            <h1 className="text-xl font-bold">Ajustes de Usuario</h1>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm">Nueva contraseña</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm">Confirmar contraseña</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
                {message && <div className="text-center text-sm text-red-500">{message}</div>}
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar cambios</button>
            </form>
        </div>
    );
}
