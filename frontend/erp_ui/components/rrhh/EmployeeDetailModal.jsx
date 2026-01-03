import { X, User, Briefcase, DollarSign, Activity, CreditCard, FileText, Calendar, History, ClipboardList, Building2, Calculator, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { simularNomina } from '@/services/rrhh';
import { toast } from 'sonner';
import Image from 'next/image';

const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-all ${active
            ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span className="whitespace-nowrap">{label}</span>
    </button>
);

const SectionTitle = ({ title }) => (
    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
        {title}
    </h3>
);

const InfoField = ({ label, value, icon: Icon }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </label>
        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm break-words">
            {value || <span className="text-gray-400 italic">No registrado</span>}
        </div>
    </div>
);

export default function EmployeeDetailModal({ employee, onClose }) {
    const [activeTab, setActiveTab] = useState('generales');
    const [simLoading, setSimLoading] = useState(false);
    const [simResult, setSimResult] = useState(null);
    const [diasSim, setDiasSim] = useState(15);

    if (!employee) return null;

    const tabs = [
        { id: 'generales', label: 'Generales', icon: User },
        { id: 'laborales', label: 'C. Laborales', icon: Briefcase },
        { id: 'salariales', label: 'Cond. Salariales', icon: DollarSign },
        { id: 'medica', label: 'Ficha Médica', icon: Activity },
        { id: 'bancarios', label: 'D. Bancarios', icon: CreditCard },
        { id: 'simulacion', label: 'Simular Nómina', icon: Calculator },
        { id: 'expediente', label: 'Expediente', icon: FileText },
    ];

    const dp = employee.detalle_personal || {};
    const dl = employee.datos_laborales || {};
    const dof = employee.documentacion_oficial || {};
    const nb = employee.nomina_bancaria || {};
    // const ce = employee.contactos_emergencia || []; // Array

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">

                {/* Header Profile Summary */}
                <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-950 p-6 flex flex-col md:flex-row items-center gap-6 border-b shrink-0 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>

                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                            {/* Placeholder for now */}
                            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-3xl font-bold">
                                {employee.nombres?.[0]}{employee.apellido_paterno?.[0]}
                            </div>
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
                            {employee.nombres} {employee.apellido_paterno} {employee.apellido_materno}
                        </h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm font-medium text-gray-500">
                            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {employee.puesto_nombre}</span>
                            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {employee.departamento_nombre}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                                ID: {employee.no_empleado || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs Header */}
                <div className="flex overflow-x-auto border-b bg-gray-50/50 px-4 pt-2 gap-1 shrink-0">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            {...tab}
                            active={activeTab === tab.id}
                            onClick={setActiveTab}
                        />
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">

                    {activeTab === 'generales' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InfoField label="Nombre(s)" value={employee.nombres} />
                                <InfoField label="Apellido Paterno" value={employee.apellido_paterno} />
                                <InfoField label="Apellido Materno" value={employee.apellido_materno} />
                                <InfoField label="No. Colaborador" value={employee.no_empleado} />

                                <InfoField label="Correo Laboral" value={employee.correo_laboral} />
                                <InfoField label="Correo Personal" value={dp.correo_personal} />
                                <InfoField label="Teléfono" value={employee.telefono} />
                                <InfoField label="Estado Civil" value={dp.estado_civil} />

                                <InfoField label="Nacionalidad" value={dp.nacionalidad} />
                                <InfoField label="Género" value={employee.genero} />
                                <InfoField label="CURP" value={dof.curp} />
                                <InfoField label="RFC" value={dof.rfc} />

                                <InfoField label="Fecha Nacimiento" value={employee.fecha_nacimiento} />
                                <InfoField label="CP" value={dp.codigo_postal} />
                                <InfoField label="Grado Estudios" value={dp.grado_estudios} />
                                <InfoField label="Estatus Educativo" value={dp.estatus_educativo} />
                            </div>
                            <div className="grid grid-cols-1">
                                <InfoField label="Domicilio Completo" value={dp.domicilio} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'laborales' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InfoField label="Centro de Trabajo" value={employee.centro_trabajo_nombre} />
                                <InfoField label="Departamento" value={employee.departamento_nombre} />
                                <InfoField label="Puesto" value={employee.puesto_nombre} />
                                <InfoField label="Razón Social" value={employee.razon_social_nombre} />

                                <InfoField label="Fecha Ingreso" value={dl.fecha_ingreso} />
                                <InfoField label="Tipo Contrato" value={dl.tipo_contrato} />
                                <InfoField label="Tipo Régimen" value={dof.tipo_regimen} />
                                <InfoField label="Tipo Trabajador" value={dl.tipo_trabajador} />

                                <InfoField label="Periodicidad Pago" value={dl.periodicidad_pago} />
                                <InfoField label="Jornada" value={dl.jornada} />
                                <InfoField label="Horario / Turno" value={dl.horario_turno} />
                                <InfoField label="Modalidad" value={dl.modalidad_trabajo} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoField label="Registro Patronal" value={dl.registro_patronal} />
                                <InfoField label="NSS" value={dof.nss} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'salariales' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InfoField label="Tipo de Nómina" value={dl.tipo_nomina} />
                                <InfoField label="Tipo de Salario" value={dl.tipo_salario} />
                                <InfoField label="Fecha Alta IMSS" value={dof.fecha_alta_imss} />

                                <InfoField label="Salario Diario (SD)" value={`$${dl.salario_diario || 0}`} icon={DollarSign} />
                                <InfoField label="Salario Diario Integrado (SDI)" value={`$${dl.salario_diario_integrado || 0}`} icon={DollarSign} />
                                <InfoField label="Ingreso Mensual Bruto" value={`$${dl.ingresos_mensuales_brutos || 0}`} icon={DollarSign} />

                                <InfoField label="Bonos y Excedentes" value={`$${dl.bonos_excedentes || 0}`} icon={DollarSign} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'medica' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <SectionTitle title="Información Médica" />
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <InfoField label="Tipo de Sangre" value={dp.tipo_sangre} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoField label="Padecimientos" value={dp.padecimientos} />
                                <InfoField label="Alergias" value={dp.alergias} />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <InfoField label="Tratamiento Actual" value={dp.tratamiento_actual} />
                            </div>

                            <SectionTitle title="Contactos de Emergencia" />
                            {employee.contactos_emergencia?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {employee.contactos_emergencia.map((c, i) => (
                                        <div key={i} className="p-4 border rounded-xl bg-white shadow-sm">
                                            <p className="font-bold text-lg">{c.nombre}</p>
                                            <p className="text-sm text-gray-500 font-bold uppercase">{c.parentesco}</p>
                                            <div className="mt-2 text-sm space-y-1">
                                                <p>📞 {c.telefono}</p>
                                                <p>🏠 {c.direccion}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic">No hay contactos de emergencia registrados.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'bancarios' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InfoField label="Banco" value={nb.banco} /> {/* Need name resolution if ID */}
                                <InfoField label="Método de Pago" value={nb.metodo_pago} />
                                <InfoField label="Tipo de Cuenta" value={nb.tipo_cuenta} />
                                <InfoField label="No. Cuenta" value={nb.numero_cuenta} />
                                <InfoField label="CLABE" value={nb.clabe} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'simulacion' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2">
                            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20">
                                <h4 className="text-xl font-bold flex items-center gap-2 mb-4">
                                    <Calculator className="w-6 h-6" />
                                    Simulador de Nómina Quincenal
                                </h4>
                                <div className="flex flex-col md:flex-row items-end gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold uppercase opacity-80 mb-2 block">Días a Pagar</label>
                                        <input
                                            type="number"
                                            value={diasSim}
                                            onChange={(e) => setDiasSim(e.target.value)}
                                            className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 font-bold"
                                        />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setSimLoading(true);
                                            try {
                                                const res = await simularNomina(employee.id, { dias: diasSim });
                                                setSimResult(res.data);
                                                toast.success('Cálculo completado');
                                            } catch (err) {
                                                console.error(err);
                                                toast.error('Error al simular nómina');
                                            } finally {
                                                setSimLoading(false);
                                            }
                                        }}
                                        disabled={simLoading}
                                        className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {simLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                                        Calcular Ahora
                                    </button>
                                </div>
                            </div>

                            {simResult && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                                    <div className="space-y-4">
                                        <SectionTitle title="Percepciones" />
                                        {simResult.percepciones.map((p, i) => (
                                            <div key={i} className="flex justify-between p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{p.nombre}</span>
                                                <span className="font-bold text-green-600">${p.monto.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-t-2 border-green-500">
                                            <span className="font-extrabold text-gray-900 dark:text-white uppercase text-xs">Total Percepciones</span>
                                            <span className="font-extrabold text-green-600">${simResult.total_percepciones.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <SectionTitle title="Deducciones" />
                                        {simResult.deducciones.map((d, i) => (
                                            <div key={i} className="flex justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{d.nombre}</span>
                                                <span className="font-bold text-red-600">-${d.monto.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-t-2 border-red-500">
                                            <span className="font-extrabold text-gray-900 dark:text-white uppercase text-xs">Total Deducciones</span>
                                            <span className="font-extrabold text-red-600">-${simResult.total_deducciones.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                                        <p className="text-gray-400 uppercase font-black tracking-widest text-sm mb-2">Neto Estimado a Pagar</p>
                                        <h3 className="text-5xl font-black text-white">
                                            ${simResult.neto_pagar.toLocaleString()}
                                            <span className="text-lg text-gray-500 ml-2 font-normal">MXN</span>
                                        </h3>
                                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs font-bold border border-white/10 uppercase">
                                            Calculado con Tabla ISR 2025 Quincenal
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'expediente' && (
                        <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>Visualización de documentos gestionada en módulo de Expedientes.</p>
                            <button className="mt-4 text-blue-600 font-bold hover:underline">Ir a Expediente Digital</button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 p-4 border-t shrink-0 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        Cerrar
                    </button>
                    {/* <button className="px-6 py-2.5 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                        Editar Información
                    </button> */}
                </div>
            </div>
        </div>
    );
}
