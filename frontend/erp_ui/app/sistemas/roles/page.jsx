'use client';

import { useState, useEffect } from 'react';
import adminService from '@/services/admin.service';
import {
    Shield,
    Lock,
    ChevronRight,
    Check,
    Plus,
    Save,
    Search,
    ChevronDown,
    Info,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [permisosAgrupados, setPermisosAgrupados] = useState({});
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});
    const [searchRole, setSearchRole] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [rolesRes, permisosRes] = await Promise.all([
                adminService.getRoles(),
                adminService.getPermisosAgrupados()
            ]);
            setRoles(rolesRes.data);
            setPermisosAgrupados(permisosRes);

            // Expandir el primer módulo por defecto
            const firstModule = Object.keys(permisosRes)[0];
            if (firstModule) setExpandedModules({ [firstModule]: true });

            if (rolesRes.data.length > 0) {
                handleSelectRole(rolesRes.data[0]);
            }
        } catch (error) {
            toast.error('Error al cargar la matriz de roles');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        // El backend devuelve permisos_data con objetos completos, extraemos IDs
        setSelectedPermissions(role.permissions_data?.map(p => p.id) || []);
    };

    const togglePermission = (permId) => {
        if (selectedRole?.es_sistema) {
            // Nota: Podríamos permitir editar permisos de roles de sistema si el backend lo permite,
            // pero usualmente están bloqueados. Mi backend bloquea el nombre pero no necesariamente permisos.
            // Por ahora permitimos si no es el rol de root absoluto.
        }

        setSelectedPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    const handleSave = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            await adminService.updateRole(selectedRole.id, {
                permissions: selectedPermissions
            });
            toast.success('Permisos actualizados correctamente');

            // Refrescar lista de roles para tener consistencia
            const rolesRes = await adminService.getRoles();
            setRoles(rolesRes.data);

            // Actualizar el seleccionado local
            const updated = rolesRes.data.find(r => r.id === selectedRole.id);
            if (updated) setSelectedRole(updated);

        } catch (error) {
            toast.error('No se pudieron guardar los cambios');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleModule = (module) => {
        setExpandedModules(prev => ({
            ...prev,
            [module]: !prev[module]
        }));
    };

    const filteredRoles = roles.filter(r =>
        r.nombre.toLowerCase().includes(searchRole.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Cargando matriz de seguridad...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                        Matriz de Roles y Permisos
                    </h1>
                    <p className="text-slate-500 mt-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-500" />
                        Configura el control de acceso granular (RBAC) para toda la organización.
                    </p>
                </div>

                <button className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                    <Plus className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform" />
                    <span className="font-bold text-slate-200">Nuevo Rol</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Panel: Roles List */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar rol..."
                            value={searchRole}
                            onChange={(e) => setSearchRole(e.target.value)}
                            className="w-full bg-[#0f172a]/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium text-slate-200"
                        />
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredRoles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`w-full p-5 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${selectedRole?.id === role.id
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_-10px_rgba(6,182,212,0.2)]'
                                        : 'bg-[#0f172a]/20 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl transition-all ${selectedRole?.id === role.id ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${selectedRole?.id === role.id ? 'text-white' : 'text-slate-300'}`}>
                                            {role.nombre}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                                            {role.descripcion || 'Sin descripción'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-all ${selectedRole?.id === role.id ? 'text-cyan-400 translate-x-1' : 'text-slate-600'
                                    }`} />

                                {role.es_sistema && (
                                    <div className="absolute top-3 right-8 flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                        <Shield className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">Sistema</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Permissions Editor */}
                <div className="lg:col-span-8">
                    {selectedRole ? (
                        <div className="bg-[#0f172a]/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
                            {/* Editor Header */}
                            <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                                        <Lock className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black text-white">{selectedRole.nombre}</h2>
                                            <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {selectedPermissions.length} Permisos Activos
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm mt-1">{selectedRole.descripcion}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all border border-white/10"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Guardar Cambios
                                </button>
                            </div>

                            {/* Alert for System Roles */}
                            {selectedRole.es_sistema && (
                                <div className="mx-8 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 text-amber-400/80">
                                    <AlertCircle className="w-6 h-6 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold text-amber-500">Rol Protegido</p>
                                        <p>Este es un rol clave del sistema. Algunos permisos base son obligatorios y el nombre no puede modificarse.</p>
                                    </div>
                                </div>
                            )}

                            {/* Permissions List with Accordions */}
                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {Object.entries(permisosAgrupados).map(([module, permisos]) => (
                                    <div key={module} className="group/module border border-white/5 bg-white/[0.01] rounded-[2rem] overflow-hidden transition-all hover:bg-white/[0.02]">
                                        <button
                                            onClick={() => toggleModule(module)}
                                            className="w-full p-6 flex items-center justify-between text-left group-hover/module:bg-white/[0.01] transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover/module:text-cyan-400 transition-colors">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-200 capitalize tracking-tight">{module}</h4>
                                                <span className="px-2 py-0.5 bg-slate-800/50 rounded text-[10px] text-slate-500">
                                                    {permisos.length} opciones
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${expandedModules[module] ? 'rotate-180 text-cyan-500' : ''}`} />
                                        </button>

                                        {expandedModules[module] && (
                                            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {permisos.map(perm => (
                                                        <button
                                                            key={perm.id}
                                                            onClick={() => togglePermission(perm.id)}
                                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selectedPermissions.includes(perm.id)
                                                                    ? 'bg-cyan-500/10 border-cyan-500/30'
                                                                    : 'bg-[#020617]/40 border-white/5 hover:border-white/10'
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPermissions.includes(perm.id)
                                                                    ? 'bg-cyan-500 border-cyan-500 text-white'
                                                                    : 'border-slate-700 bg-transparent'
                                                                }`}>
                                                                {selectedPermissions.includes(perm.id) && <Check className="w-4 h-4 stroke-[3]" />}
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-bold ${selectedPermissions.includes(perm.id) ? 'text-white' : 'text-slate-400'}`}>
                                                                    {perm.name}
                                                                </div>
                                                                <div className="text-[10px] font-mono text-slate-600 uppercase mt-0.5">
                                                                    {perm.codename}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[50vh] bg-[#0f172a]/20 border border-white/5 border-dashed rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                <Lock className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-300">Selecciona un Rol</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">
                                Elige un perfil de seguridad a la izquierda para comenzar a configurar sus facultades y restricciones en el sistema.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
