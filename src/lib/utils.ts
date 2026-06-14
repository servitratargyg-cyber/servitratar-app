import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateCotizacionNumero(seq: number): string {
  const year = new Date().getFullYear();
  return `COT-${year}-${String(seq).padStart(3, '0')}`;
}

export function parseCurrencyInput(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}
