'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalCount, pageSize, onPageChange }) {
  const safeTotal = Number.isFinite(totalCount) ? totalCount : 0;
  const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 1;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));

  return (
    <div className="flex-shrink-0 flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        Total: <span className="text-gray-900 dark:text-gray-200 font-bold">{safeTotal}</span> registros
      </span>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </button>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Página <span className="text-gray-900 dark:text-white font-bold">{currentPage}</span> de <span className="text-gray-900 dark:text-white font-bold">{totalPages}</span>
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
