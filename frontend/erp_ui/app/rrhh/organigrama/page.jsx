'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getOrganigrama } from '@/services/rrhh';
import dynamic from 'next/dynamic';

const Tree = dynamic(() => import('react-d3-tree'), { ssr: false });

export default function OrganigramaPage() {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const { data } = await getOrganigrama();
                if (data && data.length > 0) {
                    let rootNode;
                    if (data.length === 1) {
                        rootNode = formatNode(data[0]);
                    } else {
                        rootNode = {
                            name: 'Empresa Central',
                            attributes: { title: 'Corporativo' },
                            children: data.map(formatNode)
                        };
                    }
                    setTreeData(rootNode);
                }
            } catch (error) {
                console.error("Error cargando organigrama", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrg();
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setTranslate({ x: width / 2, y: 150 });
        }
    }, [containerRef, loading]);

    // Función recursiva para adaptar datos
    const formatNode = (node) => ({
        name: node.label,
        attributes: {
            Cargo: node.title,
            Depto: node.department,
        },
        children: node.children ? node.children.map(formatNode) : [],
    });

    const renderCustomNode = ({ nodeDatum, toggleNode }) => (
        <g>
            {/* Tarjeta Fondo */}
            <rect
                width="280"
                height="130"
                x="-140"
                y="-65"
                rx="16"
                onClick={toggleNode}
                strokeWidth={nodeDatum.children && nodeDatum.children.length > 0 ? "3" : "1"}
                style={{ filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.08))' }}
                className="fill-white dark:fill-slate-900 stroke-gray-200 dark:stroke-slate-700 hover:stroke-blue-500 dark:hover:stroke-blue-400 transition-all duration-300 cursor-pointer"
            />

            {/* Indicador de hijos */}
            {nodeDatum.children && nodeDatum.children.length > 0 && (
                <circle cx="0" cy="65" r="8" stroke="none" className="fill-blue-500 dark:fill-blue-400" />
            )}

            {/* Nombre */}
            <text
                x="0"
                y="-25"
                textAnchor="middle"
                stroke="none"
                className="!fill-gray-900 dark:!fill-white text-xl font-extrabold pointer-events-none tracking-tight font-sans"
            >
                {nodeDatum.name}
            </text>

            {/* Cargo */}
            <text
                x="0"
                y="5"
                textAnchor="middle"
                stroke="none"
                className="!fill-gray-600 dark:!fill-gray-300 text-sm font-semibold pointer-events-none font-sans"
            >
                {nodeDatum.attributes?.Cargo || 'Sin Cargo'}
            </text>

            {/* Departamento Badge */}
            <rect
                width="200"
                height="32"
                x="-100"
                y="28"
                rx="16"
                stroke="none"
                className="fill-blue-50 dark:fill-blue-950"
            />
            <text
                x="0"
                y="49"
                textAnchor="middle"
                stroke="none"
                className="!fill-blue-700 dark:!fill-blue-200 text-xs font-bold uppercase pointer-events-none tracking-wide"
            >
                {nodeDatum.attributes?.Depto || 'General'}
            </text>
        </g>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 overflow-hidden transition-colors duration-500">
            {/* Header flotante */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-purple-400 drop-shadow-sm">
                    Organigrama
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base mt-1 font-medium">Visualización jerárquica corporativa</p>
            </div>

            <div
                ref={containerRef}
                className="flex-1 w-full h-full bg-transparent relative transition-colors duration-500"
            >
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-slate-400 animate-pulse bg-gray-50 dark:bg-slate-950 z-50">
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-xl font-bold">Cargando estructura...</span>
                        </div>
                    </div>
                )}

                {!loading && treeData && (
                    <Tree
                        data={treeData}
                        translate={translate}
                        orientation="vertical"
                        pathFunc="step"
                        renderCustomNodeElement={renderCustomNode}
                        separation={{ siblings: 2, nonSiblings: 2.5 }}
                        enableLegacyTransitions={true}
                        transitionDuration={600}
                        zoomable={true}
                        collapsible={true}
                        draggable={true}
                        scaleExtent={{ min: 0.1, max: 2.5 }}
                        nodeSize={{ x: 300, y: 250 }}
                        pathClassFunc={() => '!stroke-gray-400 dark:!stroke-white !stroke-2'}
                    />
                )}

                {!loading && !treeData && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-xl font-bold">Sin datos disponibles</p>
                        <p className="text-base">No se ha generado la estructura organizacional.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
