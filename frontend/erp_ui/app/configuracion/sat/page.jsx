'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, FileKey, MoreHorizontal } from 'lucide-react';

export default function CertificadosPage() {
    const [certificados, setCertificados] = useState([]);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm();
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        cargarCertificados();
    }, []);

    const cargarCertificados = async () => {
        try {
            const res = await axios.get('/api/contabilidad/certificados-digitales/');
            setCertificados(res.data.results || res.data);
        } catch (error) {
            console.error("Error al cargar certificados", error);
        }
    };

    const onSubmit = async (data) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('nombre', data.nombre);
        formData.append('rfc', data.rfc);
        formData.append('tipo', data.tipo);
        formData.append('password', data.password); // Note: Should send over HTTPS

        if (data.archivo_cer[0]) formData.append('archivo_cer', data.archivo_cer[0]);
        if (data.archivo_key[0]) formData.append('archivo_key', data.archivo_key[0]);

        try {
            await axios.post('/api/contabilidad/certificados-digitales/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Certificado subido correctamente");
            reset();
            cargarCertificados();
        } catch (error) {
            console.error(error);
            toast.error("Error al subir certificado");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Configuración Fiscal (SAT)</h1>

            {/* Upload New Certificate */}
            <Card>
                <CardHeader>
                    <CardTitle>Agregar Nuevo Certificado</CardTitle>
                    <CardDescription>Sube tus archivos .cer y .key para facturación y trámites.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre / Alias</label>
                                <Input {...register('nombre', { required: true })} placeholder="Ej. CSD Matriz" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">RFC</label>
                                <Input {...register('rfc', { required: true })} placeholder="XAXX010101000" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    {...register('tipo')}
                                >
                                    <option value="CSD">Certificado Sello Digital (CSD)</option>
                                    <option value="FIEL">Firma Electrónica (FIEL)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contraseña de Clave Privada</label>
                                <Input type="password" {...register('password', { required: true })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 border border-dashed p-4 rounded-lg bg-muted/50 text-center">
                                <label className="cursor-pointer block">
                                    <div className="mb-2"><Upload className="mx-auto h-6 w-6 text-muted-foreground" /></div>
                                    <span className="text-sm font-medium">Subir archivo .cer</span>
                                    <input type="file" accept=".cer" className="hidden" {...register('archivo_cer', { required: true })} />
                                </label>
                            </div>
                            <div className="space-y-2 border border-dashed p-4 rounded-lg bg-muted/50 text-center">
                                <label className="cursor-pointer block">
                                    <div className="mb-2"><FileKey className="mx-auto h-6 w-6 text-muted-foreground" /></div>
                                    <span className="text-sm font-medium">Subir archivo .key</span>
                                    <input type="file" accept=".key" className="hidden" {...register('archivo_key', { required: true })} />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={uploading}>
                                {uploading ? "Subiendo..." : "Guardar Certificado"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* List Certificates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {certificados.map((cert) => (
                    <Card key={cert.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant={cert.tipo === 'FIEL' ? 'default' : 'secondary'}>{cert.tipo}</Badge>
                                    <CardTitle className="mt-2 text-lg">{cert.nombre}</CardTitle>
                                    <CardDescription>{cert.rfc}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>Vence:</span>
                                    <span className={new Date(cert.fecha_fin_validez) < new Date() ? "text-red-500 font-bold" : ""}>
                                        {cert.fecha_fin_validez ? new Date(cert.fecha_fin_validez).toLocaleDateString() : 'Pendiente validar'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estado:</span>
                                    <span className={cert.activo ? "text-green-600" : "text-gray-500"}>{cert.activo ? 'Activo' : 'Inactivo'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
