export default function KPICard({ title, value, trend, icon: Icon, color = 'blue' }) {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
    };

    const trendColor = trend && parseFloat(trend) >= 0 ? 'text-green-600' : 'text-red-600';

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <p className={`text-sm font-medium mt-2 ${trendColor}`}>
                            {parseFloat(trend) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(trend))}%
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`${colorClasses[color]} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}
