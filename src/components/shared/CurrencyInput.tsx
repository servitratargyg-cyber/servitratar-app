import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value:     number;
  onChange:  (value: number) => void;
  className?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const displayValue = focused
      ? String(value === 0 ? '' : value)
      : value === 0
        ? ''
        : new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      onChange(parseFloat(raw) || 0);
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={handleChange}
          className={cn(
            'flex h-9 w-full rounded-md border border-gray-300 bg-white pl-7 pr-3 py-1 text-sm shadow-sm text-right',
            'focus:outline-none focus:ring-2 focus:ring-[#e8734a] focus:border-[#e8734a]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';
