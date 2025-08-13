'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getClientes, getProyectos, getUPEs, createPresupuesto, updatePresupuesto, getPresupuesto } from '@/services/api';

export default function PresupuestoFormPage() {
    const searchParams = useSearchParams();
    const presupuestoId = searchParams.get('id');

    const [clientes, setClientes] = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [upes, setUpes] = useState([]);
    const [formData, setFormData] = useState({
        cliente: '',
        proyecto: '',
        upe: '',
        monto_apartado: '',
        monto_total: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientesRes, proyectosRes, upesRes] = await Promise.all([
                    getClientes(),
                    getProyectos(),
                    getUPEs()
                ]);
                setClientes(clientesRes.data.results || []);
                setProyectos(proyectosRes.data.results || []);
                setUpes(upesRes.data.results || []);
                if (presupuestoId) {
                    const res = await getPresupuesto(presupuestoId);
                    setFormData({
                        cliente: res.data.cliente,
                        proyecto: res.data.proyecto,
                        upe: res.data.upe,
                        monto_apartado: res.data.monto_apartado,
                        monto_total: res.data.monto_total
                    });
                }
            } catch (err) {
                setError('Error cargando datos iniciales');
            }
        };
        fetchData();
    }, [presupuestoId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.cliente || !formData.proyecto || !formData.upe || !formData.monto_total) {
            setError('Todos los campos son obligatorios');
            return false;
        }
        const montoApartado = parseFloat(formData.monto_apartado || '0');
        const montoTotal = parseFloat(formData.monto_total);
        if (montoTotal <= 0) {
            setError('El monto total debe ser mayor a cero');
            return false;
        }
        if (montoApartado < 0 || montoApartado > montoTotal) {
            setError('El monto apartado debe ser positivo y no mayor al total');
            return false;
        }
        const selectedUpe = upes.find(u => u.id === Number(formData.upe));
        if (selectedUpe && Number(formData.proyecto) !== selectedUpe.proyecto) {
            setError('La UPE seleccionada no pertenece al proyecto');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!validate()) return;
        try {
            if (presupuestoId) {
                await updatePresupuesto(presupuestoId, formData);
            } else {
                await createPresupuesto(formData);
            }
            setSuccess('Presupuesto guardado correctamente');
        } catch (err) {
            setError('Error al guardar el presupuesto');
        }
    };

    return (
        <div className="p-8 max-w-xl">
            <h1 className="text-2xl font-bold mb-4">{presupuestoId ? 'Editar' : 'Crear'} Presupuesto</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-600 mb-4">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Cliente</label>
                    <select name="cliente" value={formData.cliente} onChange={handleChange} className="w-full border p-2">
                        <option value="">Seleccione</option>
                        {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre_completo}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Proyecto</label>
                    <select name="proyecto" value={formData.proyecto} onChange={handleChange} className="w-full border p-2">
                        <option value="">Seleccione</option>
                        {proyectos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-1">UPE</label>
                    <select name="upe" value={formData.upe} onChange={handleChange} className="w-full border p-2">
                        <option value="">Seleccione</option>
                        {upes.map(u => (
                            <option key={u.id} value={u.id}>{u.identificador}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Monto Apartado</label>
                    <input type="number" step="0.01" name="monto_apartado" value={formData.monto_apartado} onChange={handleChange} className="w-full border p-2" />
                </div>
                <div>
                    <label className="block mb-1">Monto Total*</label>
                    <input type="number" step="0.01" name="monto_total" value={formData.monto_total} onChange={handleChange} className="w-full border p-2" />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
            </form>
        </div>
    );
}

