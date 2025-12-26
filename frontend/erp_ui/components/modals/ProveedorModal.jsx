import React, { useState, useEffect } from 'react';
import Modal from '@/components/modals';
import {
    Building2, Mail, Phone, MapPin,
    CreditCard, Landmark, CalendarClock, User,
    FileText, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ProveedorModal({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
}) {
    // Estado inicial del formulario
    const emptyForm = {
        razon_social: '',
        nombre_comercial: '',
        rfc: '',
        tipo_persona: 'MORAL',
        email_contacto: '',
        telefono: '',
        direccion: '',
        banco_nombre: '',
        cuenta: '',
        clabe: '',
        dias_credito: 0
    };

    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

    // Cargar datos al editar
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(emptyForm);
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value, name) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Renderizado de Secciones
    const SectionHeader = ({ icon: Icon, title, description }) => (
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Editar Proveedor" : "Nuevo Proveedor"}
            maxWidth="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Grid Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Columna Izquierda: Identidad y Contacto */}
                    <div className="space-y-6">
                        {/* Identidad */}
                        <div>
                            <SectionHeader
                                icon={Building2}
                                title="Información Fiscal"
                                description="Datos de identificación del proveedor"
                            />
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rfc">RFC *</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="rfc"
                                                name="rfc"
                                                placeholder="XAXX010101000"
                                                value={formData.rfc}
                                                onChange={handleChange}
                                                required
                                                className="pl-9 font-mono uppercase"
                                                maxLength={13}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tipo_persona">Tipo Persona</Label>
                                        <Select
                                            value={formData.tipo_persona}
                                            onValueChange={(val) => handleSelectChange(val, 'tipo_persona')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MORAL">Persona Moral</SelectItem>
                                                <SelectItem value="FISICA">Persona Física</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="razon_social">Razón Social *</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="razon_social"
                                            name="razon_social"
                                            placeholder="Ej. Acme S.A. de C.V."
                                            value={formData.razon_social}
                                            onChange={handleChange}
                                            required
                                            className="pl-9 capitalize"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
                                    <Input
                                        id="nombre_comercial"
                                        name="nombre_comercial"
                                        placeholder="Ej. Acme Corp (Opcional)"
                                        value={formData.nombre_comercial}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div>
                            <SectionHeader
                                icon={Mail}
                                title="Contacto"
                                description="Medios de comunicación principales"
                            />
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email_contacto">Correo Electrónico</Label>
                                        <Input
                                            id="email_contacto"
                                            name="email_contacto"
                                            type="email"
                                            placeholder="contacto@proveedor.com"
                                            value={formData.email_contacto}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefono">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="telefono"
                                                name="telefono"
                                                type="tel"
                                                placeholder="(55) 1234 5678"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Bancarios y Dirección */}
                    <div className="space-y-6">

                        {/* Bancarios */}
                        <div>
                            <SectionHeader
                                icon={CreditCard}
                                title="Datos Financieros"
                                description="Información bancaria y créditos"
                            />
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-800">
                                <div className="space-y-2">
                                    <Label htmlFor="banco_nombre">Banco Principal</Label>
                                    <div className="relative">
                                        <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="banco_nombre"
                                            name="banco_nombre"
                                            placeholder="Ej. BBVA, Santander"
                                            value={formData.banco_nombre}
                                            onChange={handleChange}
                                            className="pl-9 bg-white dark:bg-gray-900"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clabe">CLABE</Label>
                                        <Input
                                            id="clabe"
                                            name="clabe"
                                            placeholder="18 dígitos"
                                            value={formData.clabe}
                                            onChange={handleChange}
                                            maxLength={18}
                                            className="bg-white dark:bg-gray-900 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cuenta">No. Cuenta</Label>
                                        <Input
                                            id="cuenta"
                                            name="cuenta"
                                            placeholder="10 dígitos"
                                            value={formData.cuenta}
                                            onChange={handleChange}
                                            maxLength={12}
                                            className="bg-white dark:bg-gray-900 font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Label htmlFor="dias_credito" className="flex items-center gap-2">
                                        <CalendarClock className="w-4 h-4 text-orange-500" />
                                        Días de Crédito
                                    </Label>
                                    <Input
                                        id="dias_credito"
                                        name="dias_credito"
                                        type="number"
                                        min="0"
                                        value={formData.dias_credito}
                                        onChange={handleChange}
                                        className="bg-white dark:bg-gray-900 w-1/2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dirección */}
                        <div>
                            <SectionHeader
                                icon={MapPin}
                                title="Dirección Fiscal"
                                description="Domicilio registrado ante el SAT"
                            />
                            <div className="space-y-2">
                                <Textarea
                                    id="direccion"
                                    name="direccion"
                                    rows={3}
                                    placeholder="Calle, Número, Colonia, CP, Ciudad, Estado"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                    >
                        {loading ? 'Guardando...' : initialData ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
                    </Button>
                </div>

            </form>
        </Modal>
    );
}
