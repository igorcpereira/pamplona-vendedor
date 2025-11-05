import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizarNome(nome?: string): string {
  if (!nome) return "-";
  return nome.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
