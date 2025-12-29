/**
 * EJEMPLO DE USO - Página de Inventario
 * 
 * Este archivo demuestra cómo usar la nueva estructura de Atomic Design
 * con Mobile First en una página real del proyecto.
 * 
 * NOTA: Este es un archivo de ejemplo, NO reemplaza tu página actual.
 */
'use client';

import React, { useState } from 'react';
import { Plus, Download, Upload } from 'lucide-react';

// Atoms
import Button from '@/components/atoms/Button';

// Molecules
import SearchBar from '@/components/molecules/SearchBar';

// Organisms
import DataTable from '@/components/organisms/DataTable';

// Templates
import ListTemplate from '@/components/templates/ListTemplate';

export default function InventarioExamplePage() {
    const [searchQuery, setSearchQuery] = useState('');

    // Datos de ejemplo
    const inventoryData = [
        { id: 1, nombre: 'Laptop Dell', categoria: 'Electrónica', cantidad: 15, precio: 850 },
        { id: 2, nombre: 'Mouse Logitech', categoria: 'Accesorios', cantidad: 45, precio: 25 },
        { id: 3, nombre: 'Teclado Mecánico', categoria: 'Accesorios', cantidad: 30, precio: 120 },
    ];

    // Definición de columnas
    const columns = [
        {
            header: 'Nombre',
            accessorKey: 'nombre',
        },
        {
            header: 'Categoría',
            accessorKey: 'categoria',
        },
        {
            header: 'Cantidad',
            accessorKey: 'cantidad',
            cell: (row) => (
                <span className={row.cantidad < 20 ? 'text-red-500 font-bold' : ''}>
                    {row.cantidad}
                </span>
            ),
        },
        {
            header: 'Precio',
            accessorKey: 'precio',
            cell: (row) => `$${row.precio.toFixed(2)}`,
        },
    ];

    // Acciones de la tabla
    const actions = {
        onView: true,
        viewPath: '/sistemas/inventario',
        onEdit: (row) => console.log('Editar:', row),
        onDelete: (id) => console.log('Eliminar:', id),
    };

    return (
        <ListTemplate
            // Header
            title="Inventario IT"
            description="Gestiona el inventario de equipos y accesorios tecnológicos"

            // Acciones del header (Mobile First: se apilan en móvil, fila en desktop)
            actions={
                <>
                    <Button
                        variant="outline"
                        size="md"
                        icon={Download}
                        iconPosition="left"
                    >
                        <span className="hidden sm:inline">Exportar</span>
                        <span className="sm:hidden">Export</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="md"
                        icon={Upload}
                        iconPosition="left"
                    >
                        <span className="hidden sm:inline">Importar</span>
                        <span className="sm:hidden">Import</span>
                    </Button>

                    <Button
                        variant="primary"
                        size="md"
                        icon={Plus}
                        iconPosition="left"
                    >
                        <span className="hidden sm:inline">Nuevo Item</span>
                        <span className="sm:hidden">Nuevo</span>
                    </Button>
                </>
            }

            // Barra de búsqueda
            searchBar={
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en inventario..."
                />
            }

            // Filtros (opcional)
            filters={
                <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm">Todos</Button>
                    <Button variant="ghost" size="sm">Electrónica</Button>
                    <Button variant="ghost" size="sm">Accesorios</Button>
                    <Button variant="ghost" size="sm">Stock Bajo</Button>
                </div>
            }

            // Tabla de datos con vista responsive
            dataTable={
                <DataTable
                    data={inventoryData}
                    columns={columns}
                    actions={actions}
                    search={false} // Ya tenemos SearchBar en el template
                    mobileCardView={true} // Cards en móvil, tabla en desktop
                />
            }
        />
    );
}

/**
 * CÓMO MIGRAR TU PÁGINA ACTUAL:
 * 
 * 1. Identifica las secciones de tu página:
 *    - Header (título, descripción, botones)
 *    - Búsqueda y filtros
 *    - Contenido principal (tabla, cards, etc.)
 * 
 * 2. Reemplaza componentes antiguos por nuevos:
 *    - ReusableTable → DataTable
 *    - Botones custom → Button atom
 *    - Input de búsqueda → SearchBar molecule
 * 
 * 3. Envuelve todo en un Template:
 *    - Usa ListTemplate para páginas de listado
 *    - Usa DashboardTemplate para dashboards
 *    - Crea templates custom si es necesario
 * 
 * 4. Verifica Mobile First:
 *    - Prueba en 375px (móvil)
 *    - Prueba en 768px (tablet)
 *    - Prueba en 1024px+ (desktop)
 * 
 * 5. Ajusta estilos responsive:
 *    - Usa clases sm:, lg:, xl: de Tailwind
 *    - Asegura touch targets >= 44px
 *    - Oculta/muestra elementos según pantalla
 */
