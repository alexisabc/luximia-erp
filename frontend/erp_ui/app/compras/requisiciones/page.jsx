'use client';
import React, { useState } from 'react';
import RequisicionKanban from '@/components/organisms/RequisicionKanban';

const RequisicionesPage = () => {
    const [requisiciones, setRequisiciones] = useState([
        {
            id: 1,
            fecha_solicitud: '2026-01-02',
            prioridad: 'Alta',
            estado: 'PENDIENTE',
            observaciones: 'Material para cimentación torre A',
            usuario_solicitante: 'Ing. Juan Perez',
            detalles: [
                { cantidad: 50, producto_texto: 'Sacos de cemento' },
                { cantidad: 200, producto_texto: 'Varilla 3/8' }
            ],
            partida_presupuestal: {
                categoria: 'MATERIALES',
                monto_estimado: 50000,
                monto_comprometido: 10000,
                monto_ejecutado: 25000
            }
        },
        {
            id: 2,
            fecha_solicitud: '2026-01-03',
            prioridad: 'Normal',
            estado: 'APROBADA',
            observaciones: 'Papelería oficinas',
            detalles: [
                { cantidad: 10, producto_texto: 'Resmas papel carta' }
            ],
            partida_presupuestal: {
                categoria: 'INDIRECTOS',
                monto_estimado: 5000,
                monto_comprometido: 500,
                monto_ejecutado: 1000
            }
        },
        {
            id: 3,
            fecha_solicitud: '2026-01-01',
            prioridad: 'Baja',
            estado: 'COMPRADA',
            observaciones: 'Compra finalizada',
            detalles: [
                { cantidad: 1, producto_texto: 'Laptop Supervisor' }
            ],
            partida_presupuestal: {
                categoria: 'MAQUINARIA',
                monto_estimado: 20000,
                monto_comprometido: 0,
                monto_ejecutado: 15000
            }
        }
    ]);

    const handleMoveStatus = (id, newStatus) => {
        setRequisiciones(prev => prev.map(r =>
            r.id === id ? { ...r, estado: newStatus } : r
        ));
        // Aquí iría la llamada al backend para actualizar estado
        console.log(`Updated Requisicion ${id} to ${newStatus}`);
    };

    return (
        <div className="p-6 h-full flex flex-col w-full">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Requisiciones de Material</h1>
                    <p className="text-gray-500">Gestión y aprobación de solicitudes de obra</p>
                </div>
                <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-lg">
                    + Nueva Requisición
                </button>
            </div>

            <div className="flex-1 h-full min-h-0">
                <RequisicionKanban requisiciones={requisiciones} onMoveStatus={handleMoveStatus} />
            </div>
        </div>
    );
};

export default RequisicionesPage;
