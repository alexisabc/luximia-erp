'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import nominaService from '../../../services/nomina.service';
import { NominaCard } from '../../../components/molecules/NominaCard';

export default function ControlNominaPage() {
    const router = useRouter();
    const [nominas, setNominas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNominas = async () => {
        setLoading(true);
        try {
            const response = await nominaService.getAll();
            // Verificamos estructura de paginación de DRF (response.data.results)
            const list = response.data.results ? response.data.results : response.data;
            setNominas(list);
        } catch (error) {
            toast.error("Error al cargar lista de nóminas");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNominas();
    }, []);

    const handleCalcular = async (nomina) => {
        const toastId = toast.loading(`Calculando nómina: ${nomina.descripcion}...`);
        try {
            await nominaService.calcular(nomina.id);
            toast.success("Nómina calculada y distribuida exitosamente", { id: toastId });
            fetchNominas(); // Refrescar estado
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || "Error desconocido";
            toast.error(`Error en cálculo: ${msg}`, { id: toastId });
        }
    };

    const handleCerrar = async (nomina) => {
        if (!window.confirm(`¿Estás seguro de CERRAR la nómina ${nomina.descripcion}? Esta acción es irreversible.`)) return;

        const toastId = toast.loading("Cerrando nómina...");
        try {
            await nominaService.cerrar(nomina.id);
            toast.success("Nómina cerrada correctamente", { id: toastId });
            fetchNominas();
        } catch (error) {
            toast.error("Error al cerrar nómina", { id: toastId });
        }
    };

    const handleViewDetails = (id) => {
        router.push(`/rrhh/nomina/${id}`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control de Nómina</h1>
                    <p className="text-gray-500 mt-1">Gestiona, calcula y timbra las nóminas de la organización.</p>
                </div>
                <button
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-medium transition-all hover:shadow-lg active:scale-95"
                    onClick={() => toast.info("Crear Nómina nueva (WIP)")}
                >
                    + Nueva Nómina
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nominas.map(nomina => (
                        <NominaCard
                            key={nomina.id}
                            nomina={nomina}
                            onCalcular={handleCalcular}
                            onCerrar={handleCerrar}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                    {nominas.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-lg">No hay nóminas registradas.</p>
                            <p className="text-gray-400 text-sm mt-2">Crea una nueva para comenzar.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
