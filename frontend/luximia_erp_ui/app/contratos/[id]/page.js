'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getContratoById, updateContrato } from '../../../services/api';

export default function ContratoDetail() {
    const params = useParams();
    const { id } = params;
    const [contrato, setContrato] = useState(null);
    const [formData, setFormData] = useState({ abonos: '', saldo_total: '' });
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchContrato() {
            try {
                const res = await getContratoById(id);
                setContrato(res.data);
                setFormData({ abonos: res.data.abonos, saldo_total: res.data.saldo_total });
            } catch (err) {
                setError('No se pudo cargar el contrato');
            }
        }
        if (id) {
            fetchContrato();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await updateContrato(id, formData);
            const res = await getContratoById(id);
            setContrato(res.data);
        } catch (err) {
            setError('No se pudo actualizar el contrato');
        }
    };

    if (!contrato) {
        return <div className="p-8">Cargando...</div>;
    }

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Contrato #{id}</h1>
            {error && <p className="text-red-600">{error}</p>}
            <p><strong>Saldo total:</strong> {contrato.saldo_total}</p>
            <p><strong>Abonos:</strong> {contrato.abonos}</p>
            <p><strong>Saldo pendiente:</strong> {contrato.saldo_pendiente}</p>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
                <div>
                    <label className="block text-sm font-medium">Abonos</label>
                    <input
                        type="number"
                        step="0.01"
                        name="abonos"
                        value={formData.abonos}
                        onChange={handleChange}
                        className="mt-1 block w-full border px-2 py-1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Saldo Total</label>
                    <input
                        type="number"
                        step="0.01"
                        name="saldo_total"
                        value={formData.saldo_total}
                        onChange={handleChange}
                        className="mt-1 block w-full border px-2 py-1"
                    />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Actualizar</button>
            </form>
        </div>
    );
}
