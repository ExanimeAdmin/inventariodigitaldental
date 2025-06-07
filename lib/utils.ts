import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatearPrecioCLP(precio: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(precio)
}

export function calcularDiasParaVencer(fechaCaducidad: string | null): number {
  if (!fechaCaducidad) return 999
  const hoy = new Date()
  const fechaVencimiento = new Date(fechaCaducidad)
  return Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}
