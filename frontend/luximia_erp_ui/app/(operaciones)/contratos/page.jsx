'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContratos } from '@/services/api';

export default function ContratosPage() {
    const [contratos, setContratos] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await getContratos(1, 100);
                setContratos(res.data.results || res.data);
            } catch (err) {
                console.error('No se pudieron cargar los contratos');
            }
        }
        fetchData();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Contratos</h1>
            <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Abonos</th>
                        <th className="px-4 py-2 text-left">Saldo Pendiente</th>
                    </tr>
                </thead>
                <tbody>
                    {contratos.map(c => (
                        <tr key={c.id} className="border-t border-gray-300">
                            <td className="px-4 py-2 text-blue-600 underline"><Link href={`/contratos/${c.id}`}>#{c.id}</Link></td>
                            <td className="px-4 py-2">{c.abonos}</td>
                            <td className="px-4 py-2">{c.saldo_pendiente}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
