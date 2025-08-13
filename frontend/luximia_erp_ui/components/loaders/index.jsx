// components/ui/loaders/index.jsx

// Exportamos cada componente de loader desde este archivo central.
// La sintaxis `export { default as Nombre }` renombra la exportación por defecto
// para que pueda ser importada usando su nombre.

export { default as Spinner } from '@/components/loaders/Spinner'; // Tu spinner principal
export { default as Bars } from '@/components/loaders/Bars';
export { default as Dots } from '@/components/loaders/Dots';
export { default as Overlay } from '@/components/loaders/Overlay';