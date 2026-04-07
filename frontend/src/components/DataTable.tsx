'use client';

import { useState } from 'react';

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onSelect?: (selected: any[]) => void;
  selectable?: boolean;
  actions?: boolean;
  draggable?: boolean;
  draggedId?: string | null;
  onDragStart?: (e: React.DragEvent, row: any) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, row: any) => void;
}

export default function DataTable({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  onSelect,
  selectable = true,
  actions = true,
  draggable = false,
  draggedId = null,
  onDragStart,
  onDragOver,
  onDrop,
}: DataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(data.map((_, i) => i));
      setSelectedRows(allIndices);
      if (onSelect) {
        onSelect(data.map((_, i) => data[i]));
      }
    } else {
      setSelectedRows(new Set());
      if (onSelect) {
        onSelect([]);
      }
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);

    const selected = Array.from(newSelected).map((i: number) => data[i]);
    if (onSelect) {
      onSelect(selected);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {selectable && (
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700"
                style={column.width ? { width: column.width } : {}}
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-24">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={
                  columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                }
                className="px-6 py-8 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                draggable={draggable}
                onDragStart={(e) => onDragStart?.(e, row)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop?.(e, row)}
                className={`border-b border-gray-200 transition-colors ${
                  draggable ? 'cursor-move' : ''
                } ${
                  draggable && draggedId === (row._id || rowIndex)
                    ? 'bg-blue-100 opacity-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                {selectable && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={(e) => handleSelectRow(rowIndex, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className="px-6 py-4 text-sm text-gray-800"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm flex gap-3">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded transition-colors"
                        title="View"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
