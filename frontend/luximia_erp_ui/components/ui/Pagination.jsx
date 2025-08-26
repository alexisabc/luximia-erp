'use client';

export default function Pagination({ currentPage, totalCount, pageSize, onPageChange }) {
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;
  return (
    <div className="flex-shrink-0 flex justify-between items-center p-4">
      <span className="text-sm text-gray-700 dark:text-gray-400">
        Total: {totalCount} registros
      </span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-400">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
