import { useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface Column<T> {
  key:          string;
  header:       string;
  cell?:        (row: T) => ReactNode;
  accessor?:    keyof T;
  sortable?:    boolean;
  className?:   string;
  headerClass?: string;
}

interface DataTableProps<T extends { id: string }> {
  columns:          Column<T>[];
  data:             T[];
  pageSize?:        number;
  searchable?:      boolean;
  searchPlaceholder?: string;
  emptyMessage?:    string;
  loading?:         boolean;
  onRowClick?:      (row: T) => void;
  toolbar?:         ReactNode;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize        = 20,
  searchable      = false,
  searchPlaceholder = 'Buscar...',
  emptyMessage    = 'No hay datos',
  loading         = false,
  onRowClick,
  toolbar,
}: DataTableProps<T>) {
  const [search,   setSearch]   = useState('');
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<SortDir>(null);
  const [page,     setPage]     = useState(1);

  const filtered = searchable && search
    ? data.filter(row =>
        columns.some(col => {
          const val = col.accessor ? String(row[col.accessor] ?? '') : '';
          return val.toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  const sorted = sortKey && sortDir
    ? [...filtered].sort((a, b) => {
        const col = columns.find(c => c.key === sortKey);
        if (!col?.accessor) return 0;
        const av = String(a[col.accessor] ?? '');
        const bv = String(b[col.accessor] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir(null); }
    setPage(1);
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-[#e8734a]" />
      : <ChevronDown className="h-3 w-3 text-[#e8734a]" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {(searchable || toolbar) && (
        <div className="flex items-center gap-3">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="max-w-xs"
            />
          )}
          {toolbar && <div className="flex items-center gap-2 ml-auto">{toolbar}</div>}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                      col.headerClass
                    )}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paged.map(row => (
                  <tr
                    key={row.id}
                    className={cn(
                      'bg-white hover:bg-gray-50 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={cn('px-4 py-3 text-gray-700', col.className)}>
                        {col.cell
                          ? col.cell(row)
                          : col.accessor
                            ? String(row[col.accessor] ?? '—')
                            : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {sorted.length} registro{sorted.length !== 1 ? 's' : ''} •{' '}
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
