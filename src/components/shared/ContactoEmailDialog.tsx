import { useState } from 'react';
import { MessageCircle, Mail, User } from 'lucide-react';
import type { ClienteContacto } from '../../types/supabase.types';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';

interface Props {
  open:          boolean;
  onClose:       () => void;
  contactos:     ClienteContacto[];
  emailGeneral?: string | null;
  onSelect:      (email: string) => void;
}

export function ContactoEmailDialog({ open, onClose, contactos, emailGeneral, onSelect }: Props) {
  const [selected, setSelected] = useState<string>('');

  const opciones = [
    ...contactos
      .filter(c => c.email)
      .map(c => ({ label: c.nombre, sub: c.email!, tipo: 'contacto' as const })),
    ...(emailGeneral ? [{ label: 'Email general del cliente', sub: emailGeneral, tipo: 'general' as const }] : []),
  ];

  function handleConfirm() {
    onSelect(selected);
    setSelected('');
    onClose();
  }

  function handleClose() {
    setSelected('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Seleccionar destinatario" className="max-w-sm">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">
          ¿A qué contacto quieres enviar el correo?
        </p>

        <div className="flex flex-col gap-2">
          {opciones.map(op => (
            <button
              key={op.sub}
              type="button"
              onClick={() => setSelected(op.sub)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                selected === op.sub
                  ? 'border-[#e8734a] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                selected === op.sub ? 'bg-[#e8734a] text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {op.tipo === 'general'
                  ? <User className="h-4 w-4" />
                  : <Mail className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{op.label}</p>
                <p className="text-xs text-gray-500 truncate">{op.sub}</p>
              </div>
            </button>
          ))}

          {/* Opción: sin destinatario */}
          <button
            type="button"
            onClick={() => setSelected('')}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
              selected === '' && opciones.length > 0
                ? 'border-[#e8734a] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              selected === '' && opciones.length > 0 ? 'bg-[#e8734a] text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Escribir dirección manualmente</p>
              <p className="text-xs text-gray-500">Dejar el campo "Para" vacío</p>
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button size="sm" onClick={handleConfirm}>
            Abrir correo
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
