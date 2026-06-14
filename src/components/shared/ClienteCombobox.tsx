import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useClientes } from '../../hooks/useClientes';
import type { Cliente } from '../../types/supabase.types';
import { cn } from '../../lib/utils';

interface ClienteComboboxProps {
  value?:     string;
  onChange:   (cliente: Cliente) => void;
  onClear?:   () => void;
  error?:     string;
  disabled?:  boolean;
}

export function ClienteCombobox({ value, onChange, onClear, error, disabled }: ClienteComboboxProps) {
  const { data: clientes = [], isLoading } = useClientes();
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const rootRef             = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const selected = clientes.find(c => c.id === value) ?? null;

  const filtered = search.trim()
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (c.nit ?? '').includes(search)
      )
    : clientes;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSelect(cliente: Cliente) {
    onChange(cliente);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 py-1 text-sm shadow-sm transition-colors text-left',
          error  ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
          open   ? 'ring-2 ring-[#e8734a] border-[#e8734a]' : '',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <span className={cn('truncate', !selected && 'text-gray-400')}>
          {selected ? selected.nombre : isLoading ? 'Cargando clientes...' : 'Selecciona un cliente'}
        </span>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {selected && onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onClear(); }}
              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onClear?.())}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente o NIT..."
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 text-center">
                Sin resultados
              </li>
            ) : (
              filtered.map(cliente => (
                <li
                  key={cliente.id}
                  onClick={() => handleSelect(cliente)}
                  className={cn(
                    'flex flex-col px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors',
                    value === cliente.id && 'bg-orange-50'
                  )}
                >
                  <span className="text-sm font-medium text-gray-800">{cliente.nombre}</span>
                  {cliente.nit && (
                    <span className="text-xs text-gray-400">NIT: {cliente.nit}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
