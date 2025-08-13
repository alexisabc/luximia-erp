'use client';
import React, { useEffect, useState } from 'react';
import { getMetodosPago } from '../services/api';

export default function MetodoPagoSelect({ name = 'metodo_pago', value, onChange, className = '' }) {
    const [metodos, setMetodos] = useState([]);

    useEffect(() => {
        async function fetchMetodos() {
            try {
                const res = await getMetodosPago();
                const data = res.data.results || res.data;
                setMetodos(data);
            } catch (err) {
                console.error('Error al cargar métodos de pago', err);
            }
        }
        fetchMetodos();
    }, []);

    return (
        <select name={name} value={value} onChange={onChange} className={className}>
            <option value="">Seleccione un método</option>
            {metodos.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
        </select>
    );
}
