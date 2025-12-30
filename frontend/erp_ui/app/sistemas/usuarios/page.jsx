'use client';

import { useState, useEffect } from 'react';
import adminService from '@/services/admin.service';
import {
    User,
    Mail,
    Shield,
    MoreVertical,
    Plus,
    Search,
    Filter,
    RefreshCw,
    UserCheck,
    UserX,
    Loader2,
    Calendar,
    Smartphone,
    LogOut,
    Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [inviteData, setInviteData] = useState({ email: '', first_name: '', last_name: '', roles: [] });
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                adminService.getUsuarios(1, 50),
                adminService.getRoles()
            ]);
            setUsuarios(usersRes.data.results || usersRes.data); // Dependiendo si hay paginación activa
            setRoles(rolesRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsActionLoading(true);
        try {
            await adminService.inviteUsuario(inviteData);
            toast.success('Invitación enviada correctamente');
            setIsInviteModalOpen(false);
            setInviteData({ email: '', first_name: '', last_name: '', roles: [] });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al enviar invitación');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdateRole = async (roleName) => {
        if (!selectedUser) return;
        setIsActionLoading(true);
        try {
            await adminService.updateUsuario(selectedUser.id, {
                roles: [roleName] // Nuestro backend espera lista de nombres (slugs)
            });
            toast.success('Rol actualizado');
            setIsRoleModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Error al actualizar rol');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleResetSession = async (userId) => {
        try {
            await adminService.resetUserSession(userId);
            toast.success('Sesión invalidada. El usuario deberá loguear de nuevo.');
        } catch (error) {
            toast.error('Error al cerrar sesión remota');
        }
    };

    const getStatusBadge = (active) => (
        active ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Activo
            </span>
        ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Inactivo
            </span>
        )
    );

    const filteredUsers = Array.isArray(usuarios) ? usuarios.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 mt-2 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-500" />
                        Administra el personal, sus credenciales de seguridad y acceso multi-empresa.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-cyan-500/20 font-bold group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Invitar Usuario
                    </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                {/* Table Toolbar */}
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email, usuario..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#020617]/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={fetchData} className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-bold">Filtros</span>
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuario</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Rol de Seguridad</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Última Sesión</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">Sincronizando directorio...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No se encontraron usuarios que coincidan con la búsqueda.</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="group/row hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-xl font-black text-cyan-400 shadow-lg shrink-0">
                                                {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200 group-hover/row:text-white transition-colors">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-2">
                                            {user.roles?.length > 0 ? user.roles.map(r => (
                                                <span key={r} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[10px] font-black uppercase">
                                                    {r}
                                                </span>
                                            )) : (
                                                <span className="text-[10px] text-slate-600 font-bold uppercase italic">Sin Rol Asignado</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <Smartphone className="w-3.5 h-3.5" />
                                                <span className="max-w-[150px] truncate">{user.current_session_device || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {getStatusBadge(user.is_active)}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setSelectedUser(user); setIsRoleModalOpen(true); }}
                                                className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                                title="Asignar Rol"
                                            >
                                                <Shield className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleResetSession(user.id)}
                                                className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                title="Cerrar Sesión Remota"
                                            >
                                                <LogOut className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: INVITAR USUARIO */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-transparent">
                            <h2 className="text-2xl font-black text-white">Invitar al Equipo</h2>
                            <p className="text-slate-500 text-sm mt-1">Se enviará un correo con el token de activación.</p>
                        </div>

                        <form onSubmit={handleInvite} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                                    <input
                                        required
                                        value={inviteData.first_name}
                                        onChange={e => setInviteData({ ...inviteData, first_name: e.target.value })}
                                        className="w-full bg-[#020617]/60 border border-white/5 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50"
                                        placeholder="Ej. Juan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                                    <input
                                        required
                                        value={inviteData.last_name}
                                        onChange={e => setInviteData({ ...inviteData, last_name: e.target.value })}
                                        className="w-full bg-[#020617]/60 border border-white/5 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50"
                                        placeholder="Ej. Pérez"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteData.email}
                                    onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                    className="w-full bg-[#020617]/60 border border-white/5 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50"
                                    placeholder="juan.perez@empresa.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rol Inicial</label>
                                <select
                                    className="w-full bg-[#020617]/60 border border-white/5 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-slate-300"
                                    onChange={e => setInviteData({ ...inviteData, roles: [e.target.value] })}
                                >
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.nombre}>{r.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isActionLoading}
                                    className="flex-1 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Enviar Invitación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CAMBIAR ROL */}
            {isRoleModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsRoleModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 text-center">
                            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-4 border border-cyan-500/30">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-white">Asignar Rol</h2>
                            <p className="text-slate-500 text-sm mt-1">Cambiando permisos para <span className="text-cyan-400 font-bold">{selectedUser.first_name}</span></p>
                        </div>

                        <div className="p-8 space-y-3">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => handleUpdateRole(role.nombre)}
                                    disabled={isActionLoading}
                                    className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all ${selectedUser.roles?.includes(role.nombre)
                                            ? 'bg-cyan-500/10 border-cyan-500/50'
                                            : 'bg-white/5 border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${selectedUser.roles?.includes(role.nombre) ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                                        <span className={`font-bold ${selectedUser.roles?.includes(role.nombre) ? 'text-white' : 'text-slate-400'}`}>{role.nombre}</span>
                                    </div>
                                    {selectedUser.roles?.includes(role.nombre) && <Check className="w-5 h-5 text-cyan-400" />}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 bg-white/[0.02]">
                            <button
                                onClick={() => setIsRoleModalOpen(false)}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-2xl transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
