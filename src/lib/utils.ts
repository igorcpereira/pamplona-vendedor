import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizarNome(nome?: string): string {
  if (!nome) return "-";
  return nome.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatarTelefone(telefone?: string): string {
  if (!telefone) return "-";
  
  // Remove tudo que não é número
  const numeros = telefone.replace(/\D/g, '');
  
  // Formato esperado: 5544983271324 (DDI + DDD + número)
  // Extrair partes: 55 44 98327-1324
  
  if (numeros.length === 13 && numeros.startsWith('55')) {
    // Com DDI (55)
    const ddd = numeros.slice(2, 4);
    const parte1 = numeros.slice(4, 9);
    const parte2 = numeros.slice(9, 13);
    return `(${ddd}) ${parte1}-${parte2}`;
  } else if (numeros.length === 11) {
    // Sem DDI, apenas DDD + número
    const ddd = numeros.slice(0, 2);
    const parte1 = numeros.slice(2, 7);
    const parte2 = numeros.slice(7, 11);
    return `(${ddd}) ${parte1}-${parte2}`;
  } else if (numeros.length === 10) {
    // Telefone fixo (DDD + 8 dígitos)
    const ddd = numeros.slice(0, 2);
    const parte1 = numeros.slice(2, 6);
    const parte2 = numeros.slice(6, 10);
    return `(${ddd}) ${parte1}-${parte2}`;
  }
  
  // Se não bater formato esperado, retorna como está
  return telefone;
}

// Converte string de data "yyyy-MM-dd" para Date object sem problemas de timezone
// Garante que a data exibida seja exatamente a mesma salva no banco
export function parseDataSemFuso(dataString?: string): Date | undefined {
  if (!dataString) return undefined;
  
  // Se for formato yyyy-MM-dd, cria Date com hora local (não UTC)
  const [ano, mes, dia] = dataString.split('-').map(Number);
  if (ano && mes && dia) {
    return new Date(ano, mes - 1, dia); // mes-1 porque JS começa em 0
  }
  
  return undefined;
}

// Formata Date para string "yyyy-MM-dd" sem problemas de timezone
export function formatarDataParaBanco(data?: Date): string | null {
  if (!data) return null;
  
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}`;
}
