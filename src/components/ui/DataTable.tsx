import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from './primitives';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, data, loading, emptyMessage = 'No data found.', rowKey }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        if (av == null || bv == null) return 0;
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      })
    : data;

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm" role="table">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={String(col.key)} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">
                {col.sortable ? (
                  <button onClick={() => handleSort(String(col.key))} className="flex items-center gap-1 hover:text-secondary focus:outline-none focus:underline">
                    {col.header}
                    {sortKey === String(col.key) ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronUp size={14} className="opacity-30" />}
                  </button>
                ) : col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">{emptyMessage}</td></tr>
          ) : sorted.map(row => (
            <tr key={rowKey(row)} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3 text-gray-700">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
