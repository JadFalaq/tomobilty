'use client';

import { Search, ChevronLeft, ChevronRight, Edit, Trash2, Eye } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
}

export default function Table({
  columns,
  data = [],
  onEdit,
  onDelete,
  onView,
  pagination,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Rechercher...',
  loading = false
}: TableProps) {
  const safeData = Array.isArray(data) ? data : [];
  
  return (
    <div className="bg-white border-2 border-black rounded">
      {/* Search */}
      {onSearch && (
        <div className="p-4 border-b-2 border-black">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={20} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white border-b-2 border-black">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y-2 divide-black">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-black">
                  Chargement...
                </td>
              </tr>
            ) : safeData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-black">
                  Aucune donnée disponible
                </td>
              </tr>
            ) : (
              safeData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-1 border-2 border-black rounded hover:bg-black hover:text-white transition-colors"
                            title="Voir"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1 border-2 border-black rounded hover:bg-black hover:text-white transition-colors"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1 border-2 border-black rounded hover:bg-black hover:text-white transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t-2 border-black flex items-center justify-between">
          <div className="text-sm text-black">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border-2 border-black rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors text-black font-medium"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border-2 border-black rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors text-black font-medium"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
