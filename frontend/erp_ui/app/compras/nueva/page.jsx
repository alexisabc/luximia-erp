'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { getProveedores, getInsumos, createOrdenCompra } from '@/services/compras';

export default function NuevaOrdenPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Catalogs
    const [proveedores, setProveedores] = useState([]);
    const [insumos, setInsumos] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        proveedor: '',
        fecha_requerida: '',
        departamento: '',
        proyecto: '', // ID
        motivo_compra: '',
        notas: '',
        moneda: 1, // Default MXN ID=1 usually, need to verify
    });

    const [items, setItems] = useState([]);

    useEffect(() => {
        // Load catalogs
        const loadCatalogs = async () => {
            try {
                const [provRes, insumosRes] = await Promise.all([
                    getProveedores(),
                    getInsumos()
                ]);
                setProveedores(provRes.data.results || provRes.data);
                setInsumos(insumosRes.data.results || insumosRes.data);
            } catch (error) {
                console.error("Error loading catalogs", error);
                toast.error("Error cargando catálogos");
            }
        };
        loadCatalogs();
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addItem = () => {
        setItems(prev => [
            ...prev,
            { insumo: '', descripcion_personalizada: '', cantidad: 1, precio_unitario: 0, descuento: 0 }
        ]);
    };

    const removeItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };

            // Auto-fill description/price if insumo changes
            if (field === 'insumo') {
                const selectedInsumo = insumos.find(i => i.id == value);
                if (selectedInsumo) {
                    // newItems[index].descripcion_personalizada = selectedInsumo.descripcion;
                    // newItems[index].precio_unitario = 0; // Or fetch default price
                }
            }
            return newItems;
        });
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((acc, item) => {
            return acc + ((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0));
        }, 0);
        const iva = subtotal * 0.16;
        return { subtotal, iva, total: subtotal + iva };
    };

    const handleSubmit = async () => {
        if (!formData.proveedor) return toast.error("Selecciona un proveedor");
        if (items.length === 0) return toast.error("Agrega al menos un insumo");

        try {
            setLoading(true);
            const payload = {
                ...formData,
                detalles: items.map(item => ({
                    insumo: item.insumo,
                    descripcion_personalizada: item.descripcion_personalizada,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento: item.descuento || 0
                }))
            };

            await createOrdenCompra(payload);
            toast.success("Orden de Compra creada exitosamente");
            router.push('/compras');
        } catch (error) {
            console.error(error);
            toast.error("Error al crear la orden");
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div className="p-8 space-y-8 min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Nueva Orden de Compra
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Capture los detalles de la solicitud de compra.
                        </p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Orden'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Info */}
                <Card className="lg:col-span-1 h-fit border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Proveedor</Label>
                            <Select onValueChange={(val) => handleChange('proveedor', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {proveedores.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.razon_social}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Fecha Requerida</Label>
                            <Input
                                type="date"
                                onChange={(e) => handleChange('fecha_requerida', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Departamento / Área</Label>
                            <Input
                                placeholder="Ej. TI, Mantenimiento"
                                onChange={(e) => handleChange('departamento', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo de Compra</Label>
                            <Input
                                placeholder="Justificación breve"
                                onChange={(e) => handleChange('motivo_compra', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card className="lg:col-span-2 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Partidas</CardTitle>
                        <Button variant="outline" size="sm" onClick={addItem}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Item
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableHead className="w-[30%]">Insumo / Concepto</TableHead>
                                        <TableHead className="w-[15%] text-right">Cantidad</TableHead>
                                        <TableHead className="w-[20%] text-right">Precio U.</TableHead>
                                        <TableHead className="w-[20%] text-right">Importe</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                                No hay items agregados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="space-y-2">
                                                    <Select
                                                        value={String(item.insumo)}
                                                        onValueChange={(val) => updateItem(idx, 'insumo', val)}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="Concepto..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {insumos.map(i => (
                                                                <SelectItem key={i.id} value={String(i.id)}>
                                                                    {i.codigo} - {i.descripcion}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        placeholder="Descripción adicional (opcional)"
                                                        className="h-7 text-xs"
                                                        value={item.descripcion_personalizada}
                                                        onChange={(e) => updateItem(idx, 'descripcion_personalizada', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-8 text-right"
                                                        value={item.cantidad}
                                                        onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="h-8 text-right"
                                                        value={item.precio_unitario}
                                                        onChange={(e) => updateItem(idx, 'precio_unitario', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeItem(idx)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totals Footer */}
                        <div className="mt-8 flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>${totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>IVA (16%):</span>
                                    <span>${totals.iva.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                                    <span>Total:</span>
                                    <span>${totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
