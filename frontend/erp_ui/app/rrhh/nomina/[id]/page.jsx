'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import nominaService from '../../../../services/nomina.service';
import { StatusBadge } from '../../../../components/atoms/StatusBadge';
import { FileDown, ArrowLeft, Calculator, ShieldCheck, FileCode, CheckCircle2 } from 'lucide-react';

export default function NominaDetailPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const [nomina, setNomina] = useState(null);
    const [recibos, setRecibos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [nominaRes, recibosRes] = await Promise.all([
                nominaService.getById(id),
                nominaService.getRecibos(id)
            ]);
            setNomina(nominaRes.data);
            const lista = recibosRes.data.results ? recibosRes.data.results : recibosRes.data;
            setRecibos(lista);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar detalles de la nómina.");
        } finally {
            setLoading(false);
        }
    };

    const handleCalcular = async () => {
        setProcessing(true);
        const toastId = toast.loading("Calculando nómina...");
        try {
            await nominaService.calcular(id);
            toast.success("Nómina calculada exitosamente", { id: toastId });
            fetchData();
        } catch (error) {
            toast.error("Error al calcular nómina", { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const handleTimbrar = async () => {
        setProcessing(true);
        const toastId = toast.loading("Iniciando timbrado masivo ante el PAC...");
        try {
            const res = await nominaService.timbrar(id);
            toast.success(`Proceso finalizado: ${res.timbrados} recibos timbrados correctamente.`, { id: toastId });
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error durante el proceso de timbrado", { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadPdf = async (recibo) => {
        const toastId = toast.loading("Generando PDF...");
        try {
            const response = await nominaService.downloadReciboPdf(recibo.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

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
            toast.error("Error al descargar PDF", { id: toastId });
        }
    };

    const handleDownloadXml = (recibo) => {
        if (!recibo.xml_timbrado) {
            toast.error("Este recibo aún no cuenta con XML timbrado.");
            return;
        }
        const blob = new Blob([recibo.xml_timbrado], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Recibo_${recibo.uuid || recibo.id}.xml`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("XML Descargado");
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
    );

    if (!nomina) return <div className="p-10 text-center text-gray-500">Nómina no encontrada.</div>;

    const canTimbrar = (nomina.estado === 'CALCULADA' || nomina.estado === 'PARCIAL') && recibos.length > 0;
    const canCalcular = nomina.estado === 'BORRADOR' || nomina.estado === 'CALCULADA';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al listado
                </button>

                <div className="flex gap-3">
                    {canCalcular && (
                        <button
                            disabled={processing}
                            onClick={handleCalcular}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Calculator size={18} className="mr-2" /> Recalcular Todo
                        </button>
                    )}
                    {canTimbrar && (
                        <button
                            disabled={processing}
                            onClick={handleTimbrar}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            <ShieldCheck size={18} className="mr-2" /> Timbrar Nómina
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white shadow-xl shadow-gray-100 border border-gray-100 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{nomina.descripcion}</h1>
                            <StatusBadge status={nomina.estado} />
                        </div>
                        <div className="flex items-center text-gray-500 font-medium">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-3 uppercase tracking-wider">{nomina.tipo}</span>
                            <span>{new Date(nomina.fecha_inicio).toLocaleDateString()} al {new Date(nomina.fecha_fin).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total Neto a Pagar</p>
                        <p className="text-4xl font-black text-blue-600">${parseFloat(nomina.total_neto).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-50">
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                        <span className="text-gray-400 text-xs font-bold uppercase mb-2">Percepciones</span>
                        <span className="font-bold text-xl text-gray-800">${parseFloat(nomina.total_percepciones).toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                        <span className="text-gray-400 text-xs font-bold uppercase mb-2">Deducciones</span>
                        <span className="font-bold text-xl text-red-500">-${parseFloat(nomina.total_deducciones).toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                        <span className="text-gray-400 text-xs font-bold uppercase mb-2">Fecha de Pago</span>
                        <span className="font-bold text-xl text-gray-800">{new Date(nomina.fecha_pago).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    Lista de Recibos
                    <span className="ml-3 px-2 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{recibos.length}</span>
                </h2>

                <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Empleado</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Totales</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Estado Fiscal</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {recibos.map(recibo => (
                                    <tr key={recibo.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-4 shadow-sm group-hover:scale-110 transition-transform">
                                                    {recibo.empleado_nombre?.charAt(0) || recibo.empleado}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 leading-tight">
                                                        {recibo.empleado_nombre || `ID: ${recibo.empleado}`}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-medium">Recibo #{recibo.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-blue-900">${parseFloat(recibo.neto).toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-400 flex gap-2">
                                                <span>P: ${parseFloat(recibo.subtotal).toLocaleString()}</span>
                                                <span>D: ${parseFloat(recibo.descuentos).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {recibo.uuid ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-green-600 text-xs font-bold">
                                                        <CheckCircle2 size={12} className="mr-1" /> TIMBRADO
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                                        {recibo.uuid}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">Pendiente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 outline-none">
                                                <button
                                                    onClick={() => handleDownloadPdf(recibo)}
                                                    className="inline-flex items-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors border border-gray-100 shadow-sm"
                                                    title="Descargar PDF"
                                                >
                                                    <FileDown size={18} />
                                                </button>
                                                {recibo.xml_timbrado && (
                                                    <button
                                                        onClick={() => handleDownloadXml(recibo)}
                                                        className="inline-flex items-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-900 transition-colors border border-blue-100 shadow-sm"
                                                        title="Descargar XML"
                                                    >
                                                        <FileCode size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {recibos.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center space-y-3 opacity-30">
                                                <Calculator size={48} />
                                                <p className="text-lg font-bold">Sin recibos generados</p>
                                                <p className="max-w-xs text-sm">Ejecuta el cálculo de nómina para comenzar a generar los recibos individuales.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
