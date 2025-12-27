'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { RefreshCw, FileText, Mail, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SATDashboardPage() {
    const [rfc, setRfc] = useState('');
    const [buzon, setBuzon] = useState([]);
    const [opiniones, setOpiniones] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial fetch if RFC known, else user inputs it

    const fetchBuzon = async () => {
        try {
            const res = await axios.get('/api/contabilidad/buzon-tributario/');
            setBuzon(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOpiniones = async () => {
        try {
            const res = await axios.get('/api/contabilidad/opinion-cumplimiento/');
            setOpiniones(res.data.results || res.data);
        } catch (error) {
            console.error(error);
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
            await axios.post('/api/contabilidad/buzon-tributario/sincronizar/', { rfc });
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
            await axios.post('/api/contabilidad/opinion-cumplimiento/consultar/', { rfc });
            toast.success("Opinión actualizada");
            fetchOpiniones();
        } catch (error) {
            toast.error("Error al consultar opinión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Tablero Fiscal (SAT)</h1>
            </div>

            <Card className="bg-slate-50 border-blue-200">
                <CardContent className="pt-6 flex gap-4 items-center">
                    <Input
                        placeholder="RFC de la Empresa"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        className="max-w-xs"
                    />
                    <Button variant="outline" onClick={sincronizarBuzon} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Sincronizar Buzón
                    </Button>
                    <Button onClick={consultarOpinion} disabled={loading}>
                        <FileText className="mr-2 h-4 w-4" />
                        Consultar Opinión 32-D
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section: Buzon Tributario */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Mail className="mr-2 h-5 w-5" /> Buzón Tributario
                        </CardTitle>
                        <CardDescription>Mensajes y notificaciones recientes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Asunto</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {buzon.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin mensajes</TableCell></TableRow>}
                                {buzon.map((msg) => (
                                    <TableRow key={msg.id}>
                                        <TableCell>{new Date(msg.fecha_recibido).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{msg.asunto}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{msg.cuerpo}</div>
                                        </TableCell>
                                        <TableCell>
                                            {msg.es_requerimiento
                                                ? <Badge variant="destructive">Requerimiento</Badge>
                                                : <Badge variant="secondary">Info</Badge>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Section: Opinion de Cumplimiento */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" /> Historial de Cumplimiento
                        </CardTitle>
                        <CardDescription>Opiniones 32-D generadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Folio</TableHead>
                                    <TableHead>Resultado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {opiniones.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin historial</TableCell></TableRow>}
                                {opiniones.map((op) => (
                                    <TableRow key={op.id}>
                                        <TableCell>{new Date(op.fecha_consulta).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono text-xs">{op.folio}</TableCell>
                                        <TableCell>
                                            {op.estado === 'POSITIVA' && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Positiva</Badge>}
                                            {op.estado === 'NEGATIVA' && <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Negativa</Badge>}
                                            {op.estado === 'SIN_OBLIGACIONES' && <Badge variant="secondary">Sin Oblig</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
