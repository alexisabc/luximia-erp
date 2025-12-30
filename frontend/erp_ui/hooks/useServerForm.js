import { useState, useCallback } from 'react';

/**
 * useServerForm Hook
 * 
 * Gestiona el estado de formularios y, crucialmente, mapea automáticamente
 * los errores de validación del backend (JSON 400) a los campos del formulario.
 * 
 * @param {Object} options
 * @param {Object} options.initialValues - Valores iniciales del formulario
 * @param {Function} options.onSubmit - Función async que realiza la petición (create/update)
 * @param {Function} [options.onSuccess] - Callback tras éxito (cerrar modal, refresh, etc.)
 */
export default function useServerForm({ initialValues = {}, onSubmit, onSuccess }) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Maneja cambios en inputs.
     * Soporta (e) => ... nativo o (name, value) => ... directo
     */
    const handleChange = useCallback((arg1, arg2) => {
        let name, value;

        if (typeof arg1 === 'string') {
            // mode: handleChange('campo', valor)
            name = arg1;
            value = arg2;
        } else if (arg1?.target) {
            // mode: handleChange(event)
            name = arg1.target.name || arg1.target.id;
            value = arg1.target.type === 'checkbox' ? arg1.target.checked : arg1.target.value;
        }

        if (!name) return;

        setValues(prev => ({ ...prev, [name]: value }));

        // Limpiar error del campo al modificarlo para dar feedback inmediato de corrección
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    /**
     * Envío del formulario
     */
    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        setIsSubmitting(true);
        setErrors({}); // Limpiar errores previos

        try {
            const result = await onSubmit(values);
            if (onSuccess) onSuccess(result);
        } catch (err) {
            // Capturar errores de validación estructurados del backend
            // Formato esperado: { errors: { field_name: ["Error msg"] } }
            const responseData = err.response?.data;

            if (responseData?.errors) {
                const backendErrors = {};
                Object.keys(responseData.errors).forEach(key => {
                    const errorVal = responseData.errors[key];
                    // Tomamos el primer mensaje si es array, o el string directo
                    backendErrors[key] = Array.isArray(errorVal) ? errorVal[0] : errorVal;
                });
                setErrors(backendErrors);
            }
            // Los errores genéricos (500, 403, o toast general) ya los maneja el interceptor Axios.
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Resetear formulario a valores iniciales o nuevos
     */
    const resetForm = (newValues = initialValues) => {
        setValues(newValues);
        setErrors({});
        setIsSubmitting(false);
    };

    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleSubmit,
        setValues,     // Para casos imperativos (ej: cargar datos de edición)
        resetForm
    };
}
