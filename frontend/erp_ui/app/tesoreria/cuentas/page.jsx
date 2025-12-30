'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getCuentasClientes, abonarCuenta, getTurnoActivo
} from '@/services/pos';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/modals/Form';
import DataTable from '@/components/organisms/DataTable';
import { Button } from '@/components/ui/button';
import { Wallet, DollarSign, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
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

export default function CuentasClientesPage() {
    const { hasPermission } = useAuth();

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
        <div className="p-6 md:p-8 space-y-6 h-full flex flex-col min-h-screen bg-muted/10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Cuentas por Cobrar
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestión de saldos, créditos y anticipos de clientes.</p>
                </div>
                {activeTurno && (
                    <Badge variant="outline" className="gap-2 px-3 py-1 bg-white dark:bg-gray-800">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Turno Activo: #{activeTurno.id}
                    </Badge>
                )}
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl font-semibold">Cartera de Clientes</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <DataTable
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
                </CardContent>
            </Card>

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
