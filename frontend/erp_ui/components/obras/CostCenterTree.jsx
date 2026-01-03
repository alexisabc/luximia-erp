'use client';
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';

const buildTree = (items) => {
    const map = {};
    const roots = [];

    // Primero mapear todos
    items.forEach(item => {
        map[item.id] = { ...item, children: [] };
    });

    // Luego asignar padres
    items.forEach(item => {
        if (item.padre && map[item.padre]) {
            map[item.padre].children.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });

    return roots;
};

const TreeNode = ({ node, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level < 1); // Expandir primeros niveles
    const hasChildren = node.children && node.children.length > 0;

    return (
        <>
            <div
                className={`flex items-center py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors
                    ${level === 0 ? 'bg-gray-50/50 font-medium' : ''}`}
                style={{ paddingLeft: `${level * 20 + 16}px` }}
            >
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`mr-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${!hasChildren ? 'invisible' : ''}`}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex items-center flex-1 mr-4">
                    {node.es_hoja ? (
                        <FileText size={16} className="text-blue-500 mr-2" />
                    ) : (
                        <Folder size={16} className="text-yellow-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                        <span className="font-mono text-gray-400 mr-2 text-xs">{node.codigo}</span>
                        {node.nombre}
                    </span>
                </div>

                <div className="flex gap-4 text-sm w-1/3 justify-end items-center">
                    {node.es_hoja && (
                        <span className="text-gray-500 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700">
                            Hoja de Costo
                        </span>
                    )}
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </>
    );
};

export default function CostCenterTree({ nodes }) {
    const treeData = useMemo(() => buildTree(nodes), [nodes]);

    if (!nodes || nodes.length === 0) {
        return <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-lg border border-dashed">No hay centros de costos definidos.</div>;
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider flex">
                <div className="flex-1 pl-4">Jerarquía de Costos</div>
                <div className="w-1/3 text-right">Detalle</div>
            </div>
            {treeData.map(root => (
                <TreeNode key={root.id} node={root} />
            ))}
        </div>
    );
}
