'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, CheckSquare, Square, ChevronDown, ChevronRight, MinusSquare, Layers, Eye, EyeOff } from 'lucide-react';

export default function RolePermissionsModal({
    isOpen,
    onClose,
    title,
    formData,
    onFormChange,
    onSubmit,
    permissionsByModule,
    submitText = 'Guardar'
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedModules, setExpandedModules] = useState({});
    const [expandedModels, setExpandedModels] = useState({});

    // Expandir todos los módulos por defecto al abrir
    React.useEffect(() => {
        if (permissionsByModule.length > 0 && Object.keys(expandedModules).length === 0) {
            const allExpanded = {};
            permissionsByModule.forEach(module => {
                allExpanded[module.moduleName] = true;
            });
            setExpandedModules(allExpanded);
        }
    }, [permissionsByModule, isOpen]);

    const selectedPermissions = formData.permissions || [];

    const toggleModule = (moduleName) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    const toggleModel = (moduleName, modelLabel) => {
        const key = `${moduleName}-${modelLabel}`;
        setExpandedModels(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const expandAll = () => {
        const allModules = {};
        const allModels = {};
        permissionsByModule.forEach(mod => {
            allModules[mod.moduleName] = true;
            mod.models.forEach(model => {
                allModels[`${mod.moduleName}-${model.label}`] = true;
            });
        });
        setExpandedModules(allModules);
        setExpandedModels(allModels);
    };

    const collapseAll = () => {
        setExpandedModules({});
        setExpandedModels({});
    };

    const handlePermissionToggle = (permissionId) => {
        const newPermissions = selectedPermissions.includes(permissionId)
            ? selectedPermissions.filter(id => id !== permissionId)
            : [...selectedPermissions, permissionId];

        onFormChange({ target: { name: 'permissions', value: newPermissions } });
    };

    const handleModuleSelectAll = (module) => {
        const modulePermissionIds = module.models.flatMap(model =>
            model.options.map(opt => opt.value)
        );

        const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));

        let newPermissions;
        if (allSelected) {
            newPermissions = selectedPermissions.filter(id => !modulePermissionIds.includes(id));
        } else {
            newPermissions = Array.from(new Set([...selectedPermissions, ...modulePermissionIds]));
        }

        onFormChange({ target: { name: 'permissions', value: newPermissions } });
    };

    const handleModelSelectAll = (model) => {
        const modelPermissionIds = model.options.map(opt => opt.value);
        const allSelected = modelPermissionIds.every(id => selectedPermissions.includes(id));

        let newPermissions;
        if (allSelected) {
            newPermissions = selectedPermissions.filter(id => !modelPermissionIds.includes(id));
        } else {
            newPermissions = Array.from(new Set([...selectedPermissions, ...modelPermissionIds]));
        }

        onFormChange({ target: { name: 'permissions', value: newPermissions } });
    };

    const filteredModules = useMemo(() => {
        if (!searchQuery.trim()) return permissionsByModule;

        const query = searchQuery.toLowerCase();
        return permissionsByModule
            .map(module => ({
                ...module,
                models: module.models
                    .map(model => ({
                        ...model,
                        options: model.options.filter(opt =>
                            opt.label.toLowerCase().includes(query) ||
                            model.label.toLowerCase().includes(query)
                        )
                    }))
                    .filter(model => model.options.length > 0)
            }))
            .filter(module => module.models.length > 0);
    }, [permissionsByModule, searchQuery]);

    const getModuleStats = (module) => {
        const totalPermissions = module.models.reduce((sum, model) => sum + model.options.length, 0);
        const selectedCount = module.models.reduce((sum, model) =>
            sum + model.options.filter(opt => selectedPermissions.includes(opt.value)).length, 0
        );
        return { total: totalPermissions, selected: selectedCount };
    };

    const getModelStats = (model) => {
        const total = model.options.length;
        const selected = model.options.filter(opt => selectedPermissions.includes(opt.value)).length;
        return { total, selected };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[98%] max-h-[96vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {title}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                                {selectedPermissions.length} seleccionados
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                de {permissionsByModule.reduce((acc, mod) => acc + mod.models.reduce((mAcc, m) => mAcc + m.options.length, 0), 0)} totales
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar & Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row gap-4 items-end justify-between sticky top-0 z-10">
                    <div className="w-full md:w-1/3">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Nombre del Rol
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={onFormChange}
                            required
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ej: Administrador..."
                        />
                    </div>

                    <div className="flex-1 w-full flex items-end gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar permisos (ej: factura, usuario...)"
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={expandAll}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg transition-all"
                                title="Expandir todo"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={collapseAll}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg transition-all"
                                title="Colapsar todo"
                            >
                                <EyeOff className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Permissions Grid */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-black/20">
                    {filteredModules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Layers className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No se encontraron permisos</p>
                            <p className="text-sm">Intenta con otra búsqueda</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                            {filteredModules.map((module) => {
                                const stats = getModuleStats(module);
                                const isExpanded = expandedModules[module.moduleName];
                                const allSelected = stats.selected === stats.total && stats.total > 0;
                                const indeterminate = stats.selected > 0 && stats.selected < stats.total;

                                return (
                                    <div
                                        key={module.moduleName}
                                        className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-fit"
                                    >
                                        {/* Module Header */}
                                        <div
                                            className={`p-2.5 transition-colors ${allSelected
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                                    : indeterminate
                                                        ? 'bg-gradient-to-r from-blue-500/90 to-indigo-500/90'
                                                        : 'bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(module.moduleName)}
                                                    className={`flex items-center gap-3 font-semibold text-lg flex-1 ${allSelected || indeterminate ? 'text-white' : 'text-gray-800 dark:text-gray-100'
                                                        }`}
                                                >
                                                    {isExpanded ? <ChevronDown className="w-5 h-5 opacity-70" /> : <ChevronRight className="w-5 h-5 opacity-70" />}
                                                    {module.moduleName}
                                                </button>

                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allSelected || indeterminate
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        {stats.selected}/{stats.total}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleModuleSelectAll(module)}
                                                        className={`p-1 rounded hover:bg-black/10 transition-colors ${allSelected || indeterminate ? 'text-white' : 'text-gray-400 hover:text-blue-600'
                                                            }`}
                                                    >
                                                        {allSelected ? (
                                                            <CheckSquare className="w-6 h-6" />
                                                        ) : indeterminate ? (
                                                            <MinusSquare className="w-6 h-6" />
                                                        ) : (
                                                            <Square className="w-6 h-6" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Models List */}
                                        {isExpanded && (
                                            <div className="p-3 space-y-3 bg-gray-50/50 dark:bg-black/20">
                                                {module.models.map((model) => {
                                                    const modelStats = getModelStats(model);
                                                    const modelKey = `${module.moduleName}-${model.label}`;
                                                    const isModelExpanded = expandedModels[modelKey] !== false;
                                                    const allModelSelected = modelStats.selected === modelStats.total;
                                                    const modelIndeterminate = modelStats.selected > 0 && modelStats.selected < modelStats.total;

                                                    return (
                                                        <div key={model.label} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50 dark:border-gray-700">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleModel(module.moduleName, model.label)}
                                                                    className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                >
                                                                    {isModelExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                                                    {model.label}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleModelSelectAll(model)}
                                                                    className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                                                                >
                                                                    {allModelSelected ? (
                                                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                                                    ) : modelIndeterminate ? (
                                                                        <MinusSquare className="w-5 h-5 text-blue-600" />
                                                                    ) : (
                                                                        <Square className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>

                                                            {isModelExpanded && (
                                                                <div className="space-y-1">
                                                                    {model.options.map((permission) => {
                                                                        const isSelected = selectedPermissions.includes(permission.value);
                                                                        return (
                                                                            <label
                                                                                key={permission.value}
                                                                                className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-all duration-200 ${isSelected
                                                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                                    }`}
                                                                            >
                                                                                <div className="relative flex items-center h-5">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isSelected}
                                                                                        onChange={() => handlePermissionToggle(permission.value)}
                                                                                        className="peer w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                                                    />
                                                                                </div>
                                                                                <span className={`text-sm select-none ${isSelected
                                                                                    ? 'text-blue-700 dark:text-blue-300 font-medium'
                                                                                    : 'text-gray-600 dark:text-gray-400'
                                                                                    }`}>
                                                                                    {permission.label}
                                                                                </span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </form>

                {/* Footer fixed at bottom */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl flex justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}
