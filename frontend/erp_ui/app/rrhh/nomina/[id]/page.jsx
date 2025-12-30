'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import nominaService from '../../../../services/nomina.service';
import { StatusBadge } from '../../../../components/atoms/StatusBadge';
import { FileDown, ArrowLeft } from 'lucide-react';

export default function NominaDetailPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const [nomina, setNomina] = useState(null);
    const [recibos, setRecibos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Paralelizar llamadas
            const [nominaRes, recibosRes] = await Promise.all([
                nominaService.getById(id),
                nominaService.getRecibos(id)
            ]);
            setNomina(nominaRes.data);
            // DRF Pagination check
            const lista = recibosRes.data.results ? recibosRes.data.results : recibosRes.data;
            setRecibos(lista);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar detalles de la nómina.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (recibo) => {
        // En Next.js 13+ / React Server Components, window available in client component
        const toastId = toast.loading("Descargando PDF...");
        try {
            const response = await nominaService.downloadReciboPdf(recibo.id);

            // Crear Blob y Link
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Intentar obtener nombre del header o generarlo
            let fileName = `Recibo_${recibo.id}.pdf`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match.length === 2) fileName = match[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("PDF Descargado", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Error al descargar PDF", { id: toastId });
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
    );

    if (!nomina) return <div className="p-10 text-center">Nómina no encontrada.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" /> Volver al listado
            </button>

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{nomina.descripcion}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-500">Periodo:</span>
                            <span className="font-medium">{nomina.fecha_inicio} al {nomina.fecha_fin}</span>
                        </div>
                    </div>
                    <StatusBadge status={nomina.estado} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-100 pt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Percepciones</span>
                        <span className="font-bold text-lg text-gray-900">${parseFloat(nomina.total_percepciones).toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Deducciones</span>
                        <span className="font-bold text-lg text-red-600">-${parseFloat(nomina.total_deducciones).toLocaleString()}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 col-span-2 md:col-span-2">
                        <span className="block text-blue-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Neto a Pagar</span>
                        <span className="font-bold text-2xl text-blue-900">${parseFloat(nomina.total_neto).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Recibos de Nómina ({recibos.length})</h2>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retenciones</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recibos.map(recibo => (
                                <tr key={recibo.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 mr-3">
                                                {recibo.empleado}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {recibo.empleado_nombre || `Colaborador #${recibo.empleado}`}
                                                </div>
                                                <div className="text-xs text-gray-500">Recibo: {recibo.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${parseFloat(recibo.subtotal).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                        -${parseFloat(recibo.descuentos).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">
                                        ${parseFloat(recibo.neto).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDownload(recibo)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            title="Descargar PDF"
                                        >
                                            <FileDown size={14} className="mr-1.5 text-gray-500" /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {recibos.length === 0 && (
                                <tr>
                                    <td colspan="5" className="px-6 py-10 text-center text-gray-500 text-sm">
                                        No se encontraron recibos generados. Asegúrate de calcular la nómina primero.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
