'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const PosContext = createContext();

export function PosProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [turnoActivo, setTurnoActivo] = useState(null);
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

    // Cargar carrito desde localStorage al montar
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error loading cart from localStorage:', e);
            }
        }
    }, []);

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, cantidad = 1, precioUnitario = null) => {
        const precio = precioUnitario || item.precio;

        // Verificar si el item ya está en el carrito
        const existingIndex = cart.findIndex(
            cartItem => cartItem.id === item.id && cartItem.tipo === item.tipo
        );

        if (existingIndex >= 0) {
            // Actualizar cantidad del item existente
            const newCart = [...cart];
            newCart[existingIndex].cantidad += cantidad;
            setCart(newCart);
        } else {
            // Agregar nuevo item
            setCart([...cart, {
                id: item.id,
                tipo: item.tipo,
                nombre: item.nombre,
                codigo: item.codigo,
                precio: precio,
                cantidad: cantidad,
                stock_actual: item.stock_actual,
                tiene_inventario: item.tiene_inventario
            }]);
        }
    };

    const updateQuantity = (index, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(index);
            return;
        }

        const newCart = [...cart];
        newCart[index].cantidad = newQuantity;
        setCart(newCart);
    };

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('pos_cart');
    };

    // Cálculos
    const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const value = {
        cart,
        turnoActivo,
        setTurnoActivo,
        almacenSeleccionado,
        setAlmacenSeleccionado,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        iva,
        total,
        itemCount: cart.reduce((sum, item) => sum + item.cantidad, 0)
    };

    return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePosContext() {
    const context = useContext(PosContext);
    if (!context) {
        throw new Error('usePosContext must be used within a PosProvider');
    }
    return context;
}
