import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * useResource Hook
 * 
 * Hook universal para gestión de recursos (CRUD + Paginación + Filtros).
 * Implementa Clean Code abstrayendo toda la lógica repetitiva de las páginas.
 * 
 * @param {Function} fetchPromise - Función async del servicio que obtiene los datos (ej: getEmpresas)
 * @param {Function} deletePromise - Función async opcional para eliminar (ej: deleteEmpresa)
 * @param {Object} options - Configuración inicial (pageSize, filters, autoLoad)
 */
export default function useResource(fetchPromise, deletePromise = null, options = {}) {
    const {
        pageSize: initialPageSize = 10,
        initialFilters = {},
        autoLoad = true,
        resourceName = 'Recurso'
    } = options;

    // Estados
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: initialPageSize,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState(initialFilters);
    const [version, setVersion] = useState(0); // Para forzar recargas

    /**
     * Cargar datos
     */
    const loadData = useCallback(async () => {
        if (!fetchPromise) return;

        setLoading(true);
        try {
            // Se asume que fetchPromise acepta (page, pageSize, filters)
            // O un objeto único. Adaptaremos al estándar de services/api.js actual:
            // getEmpresas(page, pageSize, filters)
            const response = await fetchPromise(pagination.page, pagination.pageSize, filters);

            // Adaptador de respuesta estandarizada Backend
            // El backend devuelve: { count, total_pages, current_page, results: [...] }
            // O a veces directamente un array (si no hay paginación, pero BaseViewSet siempre pagina ahora)

            const resultData = response.data?.results || response.data || [];
            const resultMeta = {
                total: response.data?.count || 0,
                totalPages: response.data?.total_pages || 1
            };

            setData(resultData);
            setPagination(prev => ({
                ...prev,
                total: resultMeta.total,
                totalPages: resultMeta.totalPages
            }));
        } catch (error) {
            // El interceptor ya muestra el Toast de error, no duplicamos lógica aquí.
            console.error(`Error loading ${resourceName}:`, error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPromise, pagination.page, pagination.pageSize, filters, version, resourceName]);

    // Efecto de carga
    useEffect(() => {
        if (autoLoad) {
            loadData();
        }
    }, [loadData, autoLoad]);

    /**
     * Cambiar página
     */
    const onPageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    /**
     * Búsqueda / Filtros
     */
    const onSearch = (query) => {
        // Asumimos que el backend busca por 'search'
        setFilters(prev => ({ ...prev, search: query }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset a página 1
    };

    const applyFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    /**
     * Eliminar recurso
     */
    const handleDelete = async (id) => {
        if (!deletePromise) return;

        // Aquí confirmación podría ir o ser externa. Asumimos externa o directa.
        try {
            await deletePromise(id);
            toast.success(`${resourceName} eliminado correctamente.`);
            refresh(); // Recargar datos
        } catch (error) {
            // Error manejado por interceptor
        }
    };

    /**
     * Forzar recarga
     */
    const refresh = () => setVersion(v => v + 1);

    return {
        // Datos
        data,
        loading,
        pagination, // { page, pageSize, total, totalPages }

        // Acciones
        onPageChange,
        onSearch,
        applyFilter,
        refresh,
        handleDelete,

        // Setters directos si se necesitan casos extremos
        setFilters,
        setPagination
    };
}
