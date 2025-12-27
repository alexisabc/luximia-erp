
import {
    Home,
    Users,
    User,
    Building,
    FileText,
    Banknote,
    Landmark,
    BarChart3,
    Settings,
    Briefcase,
    ShieldCheck,
    Menu,
    LogOut,
    Wallet,
    ChevronRight,
    Scale,
    Gavel,
    FileSearch,
    Monitor,
    LayoutDashboard,
    PieChart,
    Briefcase as BriefcaseIcon,
    HardHat,
    CircleDollarSign,
    CreditCard,
    Calendar,
    UserCheck,
    ScrollText,
    ShoppingCart,
    ShoppingBag,
} from 'lucide-react';

export const MENU_STRUCTURE = [
    {
        key: 'portal',
        label: 'Mi Portal',
        icon: User,
        items: [
            {
                label: 'Personal',
                items: [
                    { label: 'Portal del Empleado', path: '/portal' },
                ]
            }
        ]
    },
    {
        key: 'auditoria',
        label: 'Auditoría',
        icon: FileSearch,
        permission: 'auditoria.view_auditlog',
        items: [
            {
                label: 'Seguimiento',
                items: [
                    { label: 'Bitácora de Cambios', path: '/auditoria', permission: 'auditoria.view_auditlog' }
                ]
            }
        ]
    },
    {
        key: 'contabilidad',
        label: 'Contabilidad',
        icon: FileText,
        permission: 'contabilidad.view_cliente',
        items: [
            {
                label: 'Cuentas',
                items: [
                    { label: 'Clientes (CxC)', path: '/contabilidad/clientes', permission: 'contabilidad.view_cliente' },
                    { label: 'Proveedores (CxP)', path: '/compras/proveedores', permission: 'compras.view_proveedor' },
                ]
            },
            {
                label: 'Fiscal',
                items: [
                    { label: 'Facturación', path: '/contabilidad/facturacion' },
                    { label: 'Buzón Fiscal', path: '/contabilidad/facturacion/buzon' },
                    { label: 'Generador de Pólizas', path: '/contabilidad/facturacion/polizas-automaticas' },
                ]
            },
            {
                label: 'Catálogos',
                items: [
                    { label: 'Cuentas Contables', path: '/contabilidad/cuentas-contables', permission: 'contabilidad.view_cuentacontable' },
                    { label: 'Centros de Costos', path: '/contabilidad/centros-costos', permission: 'contabilidad.view_centrocostos' },
                ]
            },
            {
                label: 'Operaciones',
                items: [
                    { label: 'Pólizas', path: '/contabilidad/polizas', permission: 'contabilidad.view_poliza' },
                    { label: 'Monedas', path: '/contabilidad/monedas', permission: 'contabilidad.view_moneda' },
                    { label: 'TC Banxico (SAT)', path: '/contabilidad/tc-banxico', permission: 'contabilidad.view_tipodecambiosat' },
                    { label: 'TC Manuales', path: '/contabilidad/tc-manual', permission: 'contabilidad.view_tipocambio' },
                    { label: 'Proyectos', path: '/contabilidad/proyectos', permission: 'contabilidad.view_proyecto' },
                    { label: 'UPEs', path: '/contabilidad/upes', permission: 'contabilidad.view_upe' },
                ]
            },
            {
                label: 'Reportes',
                items: [
                    { label: 'Estados Financieros', path: '/contabilidad/reportes', permission: 'contabilidad.view_reportefinanciero' },
                ]
            },
            {
                label: 'Impuestos y SAT',
                items: [
                    { label: 'Tablero Fiscal', path: '/contabilidad/fiscal/dashboard' },
                    { label: 'Certificados (FIEL/CSD)', path: '/configuracion/sat', permission: 'contabilidad.view_certificadodigital' },
                    { label: 'Declaración DIOT', path: '/contabilidad/fiscal/diot' },
                    { label: 'Contabilidad Electrónica', path: '/contabilidad/fiscal/contabilidad-electronica' },
                ]
            },
        ]
    },
    {
        key: 'direccion',
        label: 'Dirección',
        icon: LayoutDashboard,
        permission: 'users.view_dashboard',
        items: [
            {
                label: 'Estratégico',
                items: [
                    { label: 'Dashboard', path: '/direccion/dashboard', permission: 'users.view_dashboard' },
                    { label: 'KPIs', path: '/direccion/kpis' },
                ]
            }
        ]
    },
    {
        key: 'juridico',
        label: 'Jurídico',
        icon: Scale,
        permission: 'contabilidad.view_contrato',
        items: [
            {
                label: 'Gestión Legal',
                items: [
                    { label: 'Contratos', path: '/juridico/contratos', permission: 'contabilidad.view_contrato' },
                    { label: 'Expedientes', path: '/juridico/expedientes' },
                ]
            }
        ]
    },
    {
        key: 'compras',
        label: 'Compras',
        icon: ShoppingBag,
        permission: 'compras.view_ordencompra',
        items: [
            {
                label: 'Gestión',
                items: [
                    { label: 'Dashboard', path: '/compras', permission: 'compras.view_ordencompra' },
                    { label: 'Nueva Orden', path: '/compras/nueva', permission: 'compras.add_ordencompra' },
                ]
            },
            {
                label: 'Catálogos',
                items: [
                    { label: 'Proveedores', path: '/compras/proveedores', permission: 'compras.view_proveedor' },
                    { label: 'Insumos', path: '/compras/insumos', permission: 'compras.view_insumo' },
                ]
            }
        ]
    },
    {
        key: 'rrhh',
        label: 'RRHH',
        icon: Users,
        permission: 'rrhh.view_empleado', // Base permission for module
        items: [
            {
                label: 'Administración',
                items: [
                    { label: 'Esquemas Comisión', path: '/rrhh/esquemas-comision', permission: 'contabilidad.view_esquemacomision' },
                    { label: 'Expedientes', path: '/rrhh/expedientes' },
                    { label: 'Nómina', path: '/rrhh/nominas' },
                    { label: 'Cálculo PTU', path: '/rrhh/ptu' },
                    { label: 'Buzón IMSS', path: '/rrhh/imss/buzon' },
                ]
            },
            {
                label: 'Gestión de Personal',
                items: [
                    { label: 'Ausencias', path: '/rrhh/ausencias' },
                    { label: 'Departamentos', path: '/rrhh/departamentos', permission: 'rrhh.view_departamento' },
                    { label: 'Empleados', path: '/rrhh/empleados', permission: 'rrhh.view_empleado' },
                    { label: 'Organigrama', path: '/rrhh/organigrama' },
                    { label: 'Puestos', path: '/rrhh/puestos', permission: 'rrhh.view_puesto' },
                    { label: 'Vendedores', path: '/rrhh/vendedores', permission: 'contabilidad.view_vendedor' },
                ]
            }
        ]
    },
    {
        key: 'pos',
        label: 'Punto de Venta',
        icon: ShoppingCart,
        permission: 'pos.view_venta',
        items: [
            {
                label: 'Operación',
                items: [
                    { label: 'Terminal PV', path: '/pos/terminal', permission: 'pos.add_venta' },
                    { label: 'Historial Ventas', path: '/pos/ventas', permission: 'pos.view_venta' },
                ]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Cajas y Turnos', path: '/pos/turnos', permission: 'pos.view_turno' },
                    { label: 'Productos', path: '/pos/productos', permission: 'pos.view_producto' },
                    { label: 'Cuentas Clientes', path: '/pos/cuentas', permission: 'pos.view_cuentacliente' },
                ]
            }
        ]
    },
    {
        key: 'sistemas',
        label: 'Sistemas',
        icon: Monitor,
        permission: 'users.view_customuser',
        items: [
            {
                label: 'Gestión IT',
                items: [
                    { label: 'Inventario IT', path: '/sistemas/inventario', permission: 'sistemas.view_activoit' },
                ]
            },
            {
                label: 'Herramientas',
                items: [
                    { label: 'Importar Datos', path: '/sistemas/importar', permission: 'contabilidad.add_pago' },
                    { label: 'Exportar Datos', path: '/sistemas/exportar', permission: 'contabilidad.view_contrato' },
                ]
            },
            {
                label: 'Configuración',
                items: [
                    { label: 'Empresas', path: '/sistemas/empresas', permission: 'core.view_empresa' },
                ]
            },
            {
                label: 'Seguridad y Acceso',
                items: [
                    { label: 'Bitácora de Eventos', path: '/auditoria', permission: 'auditoria.view_auditlog' },
                    { label: 'Roles y Permisos', path: '/sistemas/roles', permission: 'auth.view_group' },
                    { label: 'Usuarios', path: '/sistemas/usuarios', permission: 'users.view_customuser' },
                ]
            }
        ]
    },
    {
        key: 'tesoreria',
        label: 'Tesorería',
        icon: Wallet,
        permission: 'contabilidad.view_banco',
        items: [
            {
                label: 'Egresos',
                items: [
                    { label: 'Cajas Chicas', path: '/tesoreria/cajas' },
                ]
            },
            {
                label: 'Gestión de Fondos',
                items: [
                    { label: 'Bancos', path: '/tesoreria/bancos', permission: 'contabilidad.view_banco' },
                    { label: 'Formas de Pago', path: '/tesoreria/formas-pago', permission: 'contabilidad.view_formapago' },
                    { label: 'Pagos', path: '/tesoreria/pagos', permission: 'contabilidad.view_pago' },
                    { label: 'Planes de Pago', path: '/tesoreria/planes-pago', permission: 'contabilidad.view_planpago' },
                ]
            }
        ]
    }
];
