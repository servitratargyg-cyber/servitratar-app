import { AlertTriangle } from 'lucide-react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';

interface ConfirmDialogProps {
  open:          boolean;
  onClose:       () => void;
  onConfirm:     () => void;
  title:         string;
  description:   string;
  confirmLabel?: string;
  cancelLabel?:  string;
  loading?:      boolean;
  variant?:      'destructive' | 'default';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  loading      = false,
  variant      = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex gap-3 mb-5">
        <div className="flex-shrink-0 text-amber-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Procesando...' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
