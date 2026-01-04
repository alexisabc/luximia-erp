import React from 'react';
import SemaforoPresupuestal from '../molecules/SemaforoPresupuestal';

const RequisicionKanban = ({ requisiciones = [], onMoveStatus }) => {
    const columns = {
        'PENDIENTE': [],
        'APROBADA': [],
        'COMPRADA': []
    };

    requisiciones.forEach(req => {
        // Fallback if status not in columns
        if (columns[req.estado]) {
            columns[req.estado].push(req);
        } else {
            // Handle unknown or other statuses if needed
            // columns['PENDIENTE'].push(req); 
        }
    });

    const columnTitles = {
        'PENDIENTE': 'Pendientes (Por Revisar)',
        'APROBADA': 'Aprobadas (Listas para Compra)',
        'COMPRADA': 'Compradas (Orden Generada)'
    };

    const columnColors = {
        'PENDIENTE': 'border-yellow-400',
        'APROBADA': 'border-blue-400',
        'COMPRADA': 'border-green-400'
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
            {Object.keys(columns).map(status => (
                <div key={status} className={`bg-gray-50/50 rounded-xl p-4 flex flex-col h-full border-t-4 ${columnColors[status]} shadow-sm`}>
                    <h3 className="font-bold mb-4 uppercase text-gray-500 text-xs tracking-wider flex justify-between items-center">
                        {columnTitles[status]}
                        <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-[10px]">{columns[status].length}</span>
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {columns[status].map(req => (
                            <RequisicionCard key={req.id} req={req} onAction={onMoveStatus} />
                        ))}
                        {columns[status].length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                Sin requisiciones
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const RequisicionCard = ({ req, onAction }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 group">
        <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
                <span className="font-bold text-gray-800">REQ-{req.id}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{req.prioridad}</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                {new Date(req.fecha_solicitud).toLocaleDateString()}
            </span>
        </div>

        <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">{req.observaciones || "Sin descripción detallada"}</p>
            <div className="mt-2 flex flex-wrap gap-1">
                {req.detalles && req.detalles.map((det, idx) => (
                    <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                        {det.cantidad} {det.producto_texto || det.producto?.descripcion}
                    </span>
                ))}
            </div>
        </div>

        {/* Semáforo Presupuestal Integrado (Si hay datos) */}
        {req.partida_presupuestal && (
            <div className="mt-2 mb-3">
                <SemaforoPresupuestal
                    categoria={req.partida_presupuestal.categoria}
                    estimado={req.partida_presupuestal.monto_estimado}
                    comprometido={req.partida_presupuestal.monto_comprometido}
                    gastado={req.partida_presupuestal.monto_ejecutado}
                />
            </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {req.estado === 'PENDIENTE' && (
                <>
                    <button className="text-xs text-red-600 hover:text-red-800 px-2 py-1">Rechazar</button>
                    <button
                        onClick={() => onAction(req.id, 'APROBADA')}
                        className="text-xs bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Aprobar →
                    </button>
                </>
            )}
            {req.estado === 'APROBADA' && (
                <button
                    onClick={() => onAction(req.id, 'COMPRADA')}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    Generar ODC
                </button>
            )}
        </div>
    </div>
);

export default RequisicionKanban;
