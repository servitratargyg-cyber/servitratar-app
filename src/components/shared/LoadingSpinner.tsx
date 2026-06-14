import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?:      'sm' | 'md' | 'lg';
  className?: string;
  label?:     string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-gray-200 border-t-[#e8734a]',
          sizeClass
        )}
        role="status"
        aria-label={label ?? 'Cargando...'}
      />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" label="Cargando..." />
    </div>
  );
}
