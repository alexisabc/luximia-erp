'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import apiClient from '@/services/api';
import { RefreshCw, FileText, Mail, ShoppingBag, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SATDashboardPage() {
    const [rfc, setRfc] = useState('');
    const [buzon, setBuzon] = useState([]);
    const [opiniones, setOpiniones] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBuzon = async () => {
        try {
            const res = await apiClient.get('/contabilidad/buzon-tributario/');
            setBuzon(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar buzón");
        }
    };

    const fetchOpiniones = async () => {
        try {
            const res = await apiClient.get('/contabilidad/opinion-cumplimiento/');
            setOpiniones(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar opiniones");
        }
    };

    useEffect(() => {
        fetchBuzon();
        fetchOpiniones();
    }, []);

    const sincronizarBuzon = async () => {
        if (!rfc) return toast.error("Ingresa un RFC");
        setLoading(true);
        try {
            await apiClient.post('/contabilidad/buzon-tributario/sincronizar/', { rfc });
            toast.success("Buzón sincronizado");
            fetchBuzon();
        } catch (error) {
            toast.error("Error al sincronizar");
        } finally {
            setLoading(false);
        }
    };

    const consultarOpinion = async () => {
        if (!rfc) return toast.error("Ingresa un RFC");
        setLoading(true);
        try {
            await apiClient.post('/contabilidad/opinion-cumplimiento/consultar/', { rfc });
            toast.success("Opinión actualizada");
            fetchOpiniones();
        } catch (error) {
            toast.error("Error al consultar opinión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-purple-600" />
                        Tablero Fiscal (SAT)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor de cumplimiento y notificaciones del Servicio de Administración Tributaria.
                    </p>
                </div>
            </div>

            <Card className="bg-slate-50 border-blue-200 dark:bg-slate-900/50 dark:border-blue-900">
                <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-center">
                    <Input
                        placeholder="RFC de la Empresa"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        className="max-w-xs bg-white dark:bg-gray-950"
                    />
                    <Button variant="outline" onClick={sincronizarBuzon} disabled={loading} className="bg-white dark:bg-gray-800">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Sincronizar Buzón
                    </Button>
                    <Button onClick={consultarOpinion} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                        <FileText className="mr-2 h-4 w-4" />
                        Consultar Opinión 32-D
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section: Buzon Tributario */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Mail className="mr-2 h-5 w-5 text-blue-500" /> Buzón Tributario
                        </CardTitle>
                        <CardDescription>Mensajes y notificaciones recientes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Asunto</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buzon.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sin mensajes recientes</TableCell></TableRow>}
                                    {buzon.map((msg) => (
                                        <TableRow key={msg.id}>
                                            <TableCell className="text-xs text-gray-500">{new Date(msg.fecha_recibido).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="font-medium text-sm">{msg.asunto}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={msg.cuerpo}>{msg.cuerpo}</div>
                                            </TableCell>
                                            <TableCell>
                                                {msg.es_requerimiento
                                                    ? <Badge variant="destructive" className="flex w-fit items-center gap-1"><AlertCircle size={12} /> Requerimiento</Badge>
                                                    : <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">Info</Badge>
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Section: Opinion de Cumplimiento */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-green-500" /> Historial de Cumplimiento
                        </CardTitle>
                        <CardDescription>Opiniones 32-D generadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Folio</TableHead>
                                        <TableHead>Resultado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opiniones.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sin historial disponible</TableCell></TableRow>}
                                    {opiniones.map((op) => (
                                        <TableRow key={op.id}>
                                            <TableCell className="text-xs text-gray-500">{new Date(op.fecha_consulta).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-mono text-xs">{op.folio}</TableCell>
                                            <TableCell>
                                                {op.estado === 'POSITIVA' && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="mr-1 h-3 w-3" /> Positiva</Badge>}
                                                {op.estado === 'NEGATIVA' && <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Negativa</Badge>}
                                                {op.estado === 'SIN_OBLIGACIONES' && <Badge variant="secondary">Sin Oblig</Badge>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
