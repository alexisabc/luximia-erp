'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { Mail } from 'lucide-react';

export default function BuzonIMSSPage() {
    const [mensajes, setMensajes] = useState([]);

    useEffect(() => {
        axios.get('/api/rrhh/buzon-imss/')
            .then(res => setMensajes(res.data.results || res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Buzón IMSS (IDSE)</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Mail className="mr-2 h-5 w-5" /> Mensajes Recibidos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Asunto</TableHead>
                                <TableHead>Contenido</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mensajes.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">Sin mensajes</TableCell></TableRow>}
                            {mensajes.map((msg) => (
                                <TableRow key={msg.id}>
                                    <TableCell>{new Date(msg.fecha_recibido).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{msg.asunto}</TableCell>
                                    <TableCell>{msg.cuerpo}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
