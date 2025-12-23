'use client';

import React, { useState, useEffect } from 'react';
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
import { Card } from '@/components/ui/Card';
import ConfirmationModal from '@/components/modals/Confirmation';
import { Key, Smartphone, Save, RefreshCw, User, Lock, Mail, ShieldCheck } from 'lucide-react';
import { COMPANY_NAME } from '@/lib/branding';

export default function ProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile Data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);

    // Security Data
    const [passkeys, setPasskeys] = useState([]);
    const [hasTotp, setHasTotp] = useState(false);
    const [totpUri, setTotpUri] = useState('');
    const [totpCode, setTotpCode] = useState('');

    // Modals
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        action: null,
        type: 'danger'
    });

    useEffect(() => {
        if (user) {
            const storedImage = localStorage.getItem('profileImage');
            if (storedImage) setProfileImage(storedImage);
            getUser(user.user_id).then(async (res) => {
                setFirstName(res.data.first_name || '');
                setLastName(res.data.last_name || '');
                setEmail(res.data.email || '');
                setHasTotp(res.data.has_totp);
                if (res.data.has_passkey) {
                    try {
                        const creds = await listPasskeyCredentials();
                        setPasskeys(creds.data.credentials || []);
                    } catch (e) {
                        console.error("Error fetching passkeys", e);
                    }
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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateUser(user.user_id, {
                first_name: firstName,
                last_name: lastName,
                // Email extraído para evitar modificaciones accidentales
            });
            setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al actualizar tu información.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPasskey = async () => {
        setLoading(true);
        try {
            const { data: options } = await apiClient.get('/users/passkey/register/challenge/');
            const registration = await startRegistration({ optionsJSON: options });
            await apiClient.post('/users/passkey/register/', registration);
            const { data } = await listPasskeyCredentials();
            setPasskeys(data.credentials || []);
            setMessage({ type: 'success', text: 'Dispositivo biométrico registrado.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'No se pudo registrar el dispositivo.' });
        } finally {
            setLoading(false);
        }
    };

    const confirmDeletePasskeys = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Desactivar Biometría',
            message: '¿Estás seguro de que deseas desactivar el acceso rápido?',
            type: 'danger',
            action: async () => {
                try {
                    await resetPasskeys();
                    setPasskeys([]);
                    setMessage({ type: 'success', text: 'Biometría desactivada.' });
                } catch {
                    setMessage({ type: 'error', text: 'Error al eliminar llaves.' });
                }
            }
        });
    };

    const startTotpSetup = async () => {
        setLoading(true);
        try {
            const { data } = await startTotpReset();
            setTotpUri(data.otpauth_uri);
        } catch {
            setMessage({ type: 'error', text: 'Error al iniciar 2FA.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        try {
            await verifyTotpReset(totpCode);
            setHasTotp(true);
            setTotpUri('');
            setTotpCode('');
            setMessage({ type: 'success', text: 'Doble factor activado.' });
        } catch {
            setMessage({ type: 'error', text: 'Código inválido.' });
        }
    };

    const confirmLostDeviceTotp = () => {
        setConfirmModal({
            isOpen: true,
            title: '¿Extraviaste tu dispositivo?',
            message: 'Al confirmar, se invalidará tu configuración actual de TOTP. ¿Continuar?',
            type: 'danger',
            action: startTotpSetup
        });
    };

    return (
        <div className="h-[calc(100vh-2rem)] w-full bg-background text-foreground p-5 overflow-hidden flex flex-col gap-5">

            {/* Header synced with theme */}
            <div className="flex-none space-y-1">
                <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
                    <User className="w-7 h-7 text-primary" />
                    Perfiles {COMPANY_NAME || 'Empresariales'}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                    <Lock className="w-4 h-4" /> Configuración de identidad y blindaje de cuenta
                </p>
                {message.text && (
                    <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-bold w-fit animate-in slide-in-from-left-4 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Panel Izquierdo: Perfil */}
                <div className="lg:col-span-4 h-full">
                    <Card className="h-full bg-card border border-border shadow-sm flex flex-col p-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-muted relative ring-4 ring-background shadow-lg">
                                    <Image
                                        src={profileImage || '/icon-luximia.png'}
                                        alt="Profile"
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Edit Overlay */}
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <RefreshCw className="w-6 h-6 text-white drop-shadow-md" />
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                                <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-1.5 rounded-full ring-2 ring-background shadow-sm">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 font-medium">Click en la imagen para actualizar</p>
                        </div>

                        {/* Form Section */}
                        <form onSubmit={handleUpdateProfile} className="space-y-5 flex-1 w-full flex flex-col justify-center">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <User className="w-3.5 h-3.5" /> Tu Nombre
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Nombre"
                                            className="w-full bg-muted/30 border border-border/50 focus:border-primary/50 text-foreground rounded-xl px-4 py-3 text-base font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30"
                                        />
                                        <input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Apellido"
                                            className="w-full bg-muted/30 border border-border/50 focus:border-primary/50 text-foreground rounded-xl px-4 py-3 text-base font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                        <Mail className="w-3.5 h-3.5" /> Credencial Corporativa
                                    </label>
                                    <div className="relative group">
                                        <input
                                            value={email}
                                            readOnly={true}
                                            className="w-full bg-muted/50 border border-transparent text-foreground/70 rounded-xl px-4 py-3 pl-10 text-sm font-bold outline-none cursor-not-allowed group-hover:bg-muted/70 transition-colors"
                                        />
                                        <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground ml-1 font-medium flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-green-500" />
                                        Identidad verificada y protegida.
                                    </p>
                                </div>
                            </div>
                        </form>

                        <button
                            onClick={handleUpdateProfile}
                            disabled={loading}
                            className="mt-4 w-full py-3 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50 text-base"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Perfil
                        </button>
                    </Card>
                </div>

                {/* Panel Derecho: Seguridad */}
                <div className="lg:col-span-8 flex flex-col gap-5">

                    {/* Tarjeta Passkeys */}
                    <Card className="flex-1 bg-card border border-border shadow-sm p-6 flex flex-col relative overflow-hidden group">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl ring-1 ring-purple-500/20">
                                    <Key className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Biometría Luximia</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">Acceso sin contraseñas mediante FaceID o Huella.</p>
                                </div>
                            </div>
                            {passkeys.length > 0 && (
                                <div className="px-3 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-widest ring-1 ring-green-500/30">
                                    Vinculado
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-9 h-9 text-green-500" />
                                    <div>
                                        <span className="text-4xl font-extrabold text-foreground block leading-none">{passkeys.length}</span>
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Llaves Activas</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-sm">Tu cuenta está blindada con hardware criptográfico de confianza.</p>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[220px]">
                                <button onClick={handleRegisterPasskey} className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-bold transition-all border border-border">
                                    Vincular Otro Equipo
                                </button>
                                <button onClick={confirmDeletePasskeys} className="w-full py-1.5 text-destructive hover:text-destructive/80 text-[10px] font-bold uppercase tracking-widest transition-all">
                                    Desactivar Acceso Rápido
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Tarjeta 2FA */}
                    <Card className="flex-1 bg-card border border-border shadow-sm p-6 flex flex-col relative overflow-hidden group">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl ring-1 ring-blue-500/20">
                                    <Smartphone className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Autenticador 2FA</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">Verificación de dos pasos para máxima seguridad.</p>
                                </div>
                            </div>
                            {hasTotp && (
                                <div className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest ring-1 ring-blue-500/30">
                                    Activado
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center mt-4">
                            {totpUri ? (
                                <div className="flex flex-col md:flex-row items-center gap-6 animate-in zoom-in-95 duration-300">
                                    <div className="p-3 bg-white rounded-xl shadow-lg ring-4 ring-muted">
                                        <QRCode value={totpUri} size={110} />
                                    </div>
                                    <div className="space-y-3 text-center md:text-left">
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Escanea y verifica:</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={totpCode}
                                                onChange={(e) => setTotpCode(e.target.value)}
                                                maxLength={6}
                                                className="w-32 bg-muted text-foreground text-xl font-bold text-center py-2 rounded-lg border-2 border-transparent focus:border-primary outline-none tracking-widest"
                                                placeholder="000000"
                                            />
                                            <button onClick={handleVerifyTotp} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:brightness-110 transition-all shadow-md text-sm">
                                                Verificar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : hasTotp ? (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-blue-500">
                                            <ShieldCheck className="w-5 h-5" />
                                            <span className="text-lg font-bold italic uppercase">Protección Activa</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">Accesos restringidos a dispositivos verificados.</p>
                                    </div>
                                    <button onClick={confirmLostDeviceTotp} className="flex items-center gap-2 px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-bold transition-all border border-border">
                                        <RefreshCw className="w-3.5 h-3.5" /> Reconfigurar
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full py-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-center bg-muted/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aún no tienes 2FA configurado</p>
                                    <button onClick={startTotpSetup} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:brightness-110 transition-all shadow-lg active:scale-95 flex items-center gap-2 text-sm">
                                        <Smartphone className="w-4 h-4" />
                                        Iniciar Configuración
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => {
                    confirmModal.action();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="Confirmar Acción"
            />
        </div>
    );
}
