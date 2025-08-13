// app/(operaciones)/contratos/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContratos } from '@/services/api';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import Loader from '@/components/loaders/Overlay'; // Usamos el Overlay para la carga

export default function ContratosPage() {
    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Definición de las columnas para ReusableTable
    const CONTRATOS_COLUMNAS = [
        {
            header: 'ID',
            render: (row) => (
                <Link href={`/contratos/${row.id}`} className="text-blue-600 dark:text-blue-400 underline">
                    #{row.id}
                </Link>
            ),
        },
        {
            header: 'Abonos',
            accessor: 'abonos', // Si el campo es directo, puedes usar accessor
        },
        {
            header: 'Saldo Pendiente',
            accessor: 'saldo_pendiente', // Usa accessor
        },
    ];

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await getContratos(1, 100);
                setContratos(res.data.results || res.data);
            } catch (err) {
                console.error('No se pudieron cargar los contratos', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Contratos</h1>
            <ReusableTable
                data={contratos}
                columns={CONTRATOS_COLUMNAS}
                search={true} // Habilitar la búsqueda
            // Puedes añadir acciones como editar o eliminar si las implementas en esta página
            />
        </div>
    );
}