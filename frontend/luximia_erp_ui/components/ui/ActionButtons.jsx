import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, Upload, Download } from 'lucide-react';

export default function ActionButtons({
  showInactive = false,
  onToggleInactive,
  canToggleInactive = false,
  onCreate,
  canCreate = false,
  onImport,
  importHref,
  canImport = false,
  onExport,
  canExport = false,
}) {
  return (
    <div className="flex items-center space-x-3">
      {canToggleInactive && (
        <button
          onClick={onToggleInactive}
          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
          title={showInactive ? 'Ver Activos' : 'Ver Inactivos'}
        >
          {showInactive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
      {canCreate && (
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-transform duration-200 hover:scale-110"
          title="Agregar"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
      {canImport && (
        importHref ? (
          <Link
            href={importHref}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-transform duration-200 hover:scale-110"
            title="Importar"
          >
            <Upload className="h-5 w-5" />
          </Link>
        ) : (
          <button
            onClick={onImport}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-transform duration-200 hover:scale-110"
            title="Importar"
          >
            <Upload className="h-5 w-5" />
          </button>
        )
      )}
      {canExport && (
        <button
          onClick={onExport}
          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-transform duration-200 hover:scale-110"
          title="Exportar"
        >
          <Download className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

