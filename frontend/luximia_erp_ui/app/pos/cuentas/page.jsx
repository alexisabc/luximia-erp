'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCuentasClientes, abonarCuenta, getTurnoActivo
} from '@/services/pos';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/modals/Form';
import ReusableTable from '@/components/tables/ReusableTable';
import { DollarSign, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ==================== CONFIG ====================
const COLUMNS = [
    { header: 'Cliente', accessorKey: 'nombre_cliente', className: 'font-medium' },
    {
        header: 'Límite Crédito',
        accessorKey: 'limite_credito',
        cell: (row) => <span className="text-muted-foreground">${Number(row.limite_credito).toFixed(2)}</span>
    },
    {
        header: 'Saldo Actual',
        accessorKey: 'saldo',
        cell: (row) => {
            const val = Number(row.saldo);
            // Saldo Positivo = Favor del Cliente (Green)
            // Saldo Negativo = Deuda (Red)
            return (
                <span className={`font-bold ${val < 0 ? 'text-red-500' : val > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                    ${val.toFixed(2)}
                </span>
            );
        }
    },
    {
        header: 'Disponible para Compras',
        accessorKey: 'credito_disponible',
        cell: (row) => <span className="font-mono">${Number(row.credito_disponible).toFixed(2)}</span>
    },
];

const ABONO_FIELDS = [
    { name: 'monto', label: 'Monto a Abonar ($)', type: 'number', required: true },
    {
        name: 'forma_pago',
        label: 'Forma de Pago',
        type: 'select',
        options: [
            { value: 'EFECTIVO', label: 'Efectivo' },
            { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' }
        ],
        required: true
    },
    { name: 'comentarios', label: 'Comentarios / Referencia', type: 'textarea' }
];

export default function PosCuentasPage() {
    const { hasPermission } = useAuth();
    const router = useRouter();

    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');

    const [isAbonoOpen, setIsAbonoOpen] = useState(false);
    const [abonoData, setAbonoData] = useState({});
    const [selectedCuenta, setSelectedCuenta] = useState(null);
    const [activeTurno, setActiveTurno] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCuentasClientes(page, pageSize, search);
            setData(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar cuentas");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        fetchData();
        // Check for active shift for cash payments
        getTurnoActivo().then(t => setActiveTurno(t));
    }, [fetchData]);

    const handleAbonoSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCuenta) return;

        // Validation for Cash
        if (abonoData.forma_pago === 'EFECTIVO' && !activeTurno) {
            toast.error("No hay un turno abierto para recibir efectivo.");
            return;
        }

        try {
            await abonarCuenta({
                cliente_id: selectedCuenta.cliente,
                monto: abonoData.monto,
                forma_pago: abonoData.forma_pago,
                comentarios: abonoData.comentarios,
                turno_id: activeTurno?.id || 0
            });
            toast.success("Abono registrado exitosamente");
            setIsAbonoOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar abono");
        }
    };

    const openAbono = (row) => {
        setSelectedCuenta(row);
        setAbonoData({
            monto: '',
            forma_pago: 'EFECTIVO',
            comentarios: ''
        });
        setIsAbonoOpen(true);
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Cuentas por Cobrar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de saldos, créditos y anticipos de clientes.</p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTurno && (
                        <Badge variant="outline" className="gap-2 px-3 py-1 bg-white dark:bg-gray-800 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Turno Activo: #{activeTurno.id}
                        </Badge>
                    )}
                    <Button
                        onClick={() => router.push('/contabilidad/clientes')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Gestionar Clientes
                    </Button>
                </div>
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={data.results}
                    columns={COLUMNS}
                    loading={loading}
                    onSearch={setSearch}
                    actions={{
                        custom: [
                            {
                                icon: DollarSign,
                                label: 'Abonar',
                                onClick: openAbono,
                                tooltip: 'Registrar Pago o Anticipo'
                            }
                        ]
                    }}
                    pagination={{
                        currentPage: page,
                        totalCount: data.count,
                        pageSize: pageSize,
                        onPageChange: setPage
                    }}
                />
            </div>

            <FormModal
                isOpen={isAbonoOpen}
                onClose={() => setIsAbonoOpen(false)}
                title={`Registrar Abono - ${selectedCuenta?.nombre_cliente}`}
                formData={abonoData}
                onFormChange={(e) => setAbonoData({ ...abonoData, [e.target.name]: e.target.value })}
                onSubmit={handleAbonoSubmit}
                fields={ABONO_FIELDS}
                submitText="Registrar Pago"
            />
        </div>
    );
}
