// app/(operaciones)/contratos/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContratos, exportContratosExcel } from '@/services/api';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import Loader from '@/components/loaders/Overlay'; // Usamos el Overlay para la carga
import { Download, Upload } from 'lucide-react';

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

    const handleExport = async () => {
        try {
            const response = await exportContratosExcel(['id', 'abonos', 'saldo_pendiente']);
            const blob = new Blob([
                response.data,
            ], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_contratos.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('No se pudo exportar el archivo.', err);
        }
    };

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
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Contratos</h1>
                <div className="flex items-center space-x-3">
                    <Link
                        href="/importar/contratos"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg"
                        title="Importar desde Excel"
                    >
                        <Upload className="h-5 w-5" />
                    </Link>
                    <button
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg"
                        title="Exportar a Excel"
                    >
                        <Download className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <ReusableTable
                data={contratos}
                columns={CONTRATOS_COLUMNAS}
                search={true}
            />
        </div>
    );
}