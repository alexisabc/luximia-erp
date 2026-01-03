export default function ObrasDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard de Obras</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-lg">✅ El módulo de Obras está activo y funcionando.</p>
                <p className="text-gray-500 mt-2">Esta página solo es visible si MODULE_OBRAS = true.</p>
            </div>
        </div>
    );
}
