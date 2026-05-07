import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizarNome(nome?: string): string {
  if (!nome) return "-";
  return nome.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

// Normaliza telefone para o formato 55xx9xxxxxxxx (DDI + DDD + 9 dígitos).
// Aceita entradas com máscara, sem DDD, sem DDI ou sem o nono dígito.
// Retorna null se não conseguir normalizar.
const DEFAULT_DDD = '44'; // Maringá

export function normalizarTelefone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D+/g, '');
  if (!d) return null;

  if (d.startsWith('55')) {
    const rest = d.slice(2);
    if (rest.length < 10) return null;
    const ddd = rest.slice(0, 2);
    let local = rest.slice(2);
    if (local.length === 8) local = '9' + local;
    if (local.length > 9) local = local.slice(-9);
    return `55${ddd}${local}`;
  }

  if (d.length === 11) return `55${d}`;

  if (d.length === 10) {
    const ddd = d.slice(0, 2);
    const local = '9' + d.slice(2);
    return `55${ddd}${local}`;
  }

  if (d.length === 8) d = '9' + d;
  if (d.length === 9) return `55${DEFAULT_DDD}${d}`;

  return null;
}

// Formata telefone para exibição: (xx) 9 xxxx-xxxx (ou (xx) xxxx-xxxx para fixo).
// Retorna "-" para placeholder em listas/cards. Use formatarTelefoneInput para inputs (retorna "" quando vazio).
export function formatarTelefone(telefone?: string): string {
  if (!telefone) return "-";
  return formatarTelefoneInput(telefone) || "-";
}

// Versão para inputs: retorna "" quando vazio para não bagunçar o campo.
export function formatarTelefoneInput(telefone?: string): string {
  if (!telefone) return "";

  const numeros = telefone.replace(/\D/g, '');

  // 13 dígitos com DDI: 55 + DDD + 9 + 4 + 4 → (44) 9 9999-8888
  if (numeros.length === 13 && numeros.startsWith('55')) {
    const ddd = numeros.slice(2, 4);
    const nono = numeros.slice(4, 5);
    const parte1 = numeros.slice(5, 9);
    const parte2 = numeros.slice(9, 13);
    return `(${ddd}) ${nono} ${parte1}-${parte2}`;
  }
  // 11 dígitos sem DDI: DDD + 9 + 4 + 4 → (44) 9 9999-8888
  if (numeros.length === 11) {
    const ddd = numeros.slice(0, 2);
    const nono = numeros.slice(2, 3);
    const parte1 = numeros.slice(3, 7);
    const parte2 = numeros.slice(7, 11);
    return `(${ddd}) ${nono} ${parte1}-${parte2}`;
  }
  // 10 dígitos sem DDI (fixo): DDD + 4 + 4 → (44) 9999-8888
  if (numeros.length === 10) {
    const ddd = numeros.slice(0, 2);
    const parte1 = numeros.slice(2, 6);
    const parte2 = numeros.slice(6, 10);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  // Não bate nenhum formato — devolve como veio para o usuário poder corrigir
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
