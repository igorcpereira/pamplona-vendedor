/**
 * Regras puras da agenda de Atividades (modelo v1, mesmo do kanban do CRM).
 *
 * Datas aqui são sempre string `YYYY-MM-DD` — o campo é `date` puro no banco e
 * convertê-lo para `Date` reintroduz o fuso do navegador (foi o bug da coluna
 * "Hoje" esvaziando às 21h). Comparação de string ISO é lexicográfica e
 * equivale à cronológica. Portado de pamplona-crm/src/lib/atividades.ts.
 */

import type { Atividade } from "@/hooks/useAtividades";

export type StatusVisivel = "atrasada" | "a_fazer" | "concluida" | "cancelada";

/** Data de hoje em `YYYY-MM-DD`, no fuso de São Paulo (igual ao servidor). */
export function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/** Soma dias a uma data ISO sem passar por fuso (UTC puro só para a aritmética). */
export function somaDiasISO(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const base = Date.UTC(a, m - 1, d) + dias * 86_400_000;
  return new Date(base).toISOString().slice(0, 10);
}

/** `2026-07-28` → `28/07`. */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** 0=domingo … 6=sábado, sem passar por fuso (UTC puro só para o cálculo). */
function diaSemanaISO(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/**
 * Rola para frente até cair em dia útil. As unidades abrem aos sábados, então
 * sábado É dia útil — só domingo pula para segunda.
 */
export function proximoDiaUtilISO(iso: string): string {
  return diaSemanaISO(iso) === 0 ? somaDiasISO(iso, 1) : iso;
}

/** Atalhos de data da criação de atividade. Uso: proximoDiaUtilISO(somaDiasISO(hoje, dias)). */
export const DATAS_RAPIDAS = [
  { label: "Amanhã", dias: 1 },
  { label: "Próxima semana", dias: 6 },
  { label: "Próximo mês", dias: 27 },
  { label: "Próximo semestre", dias: 150 },
] as const;

/** Seções da agenda, na ordem de exibição. */
export const GRUPOS = ["Atrasadas", "Hoje", "Amanhã", "Esta semana", "Mais tarde"] as const;
export type Grupo = (typeof GRUPOS)[number];

/**
 * Em qual seção a atividade cai. `Atrasadas` vem pronta do servidor
 * (`status_visivel`), que já calcula em America/Sao_Paulo; as demais são só
 * aritmética de dias sobre `hoje`.
 */
export function grupoDe(a: Pick<Atividade, "data" | "status_visivel">, hoje: string): Grupo {
  if (a.status_visivel === "atrasada") return "Atrasadas";
  if (a.data <= hoje) return "Hoje";
  if (a.data === somaDiasISO(hoje, 1)) return "Amanhã";
  if (a.data <= somaDiasISO(hoje, 7)) return "Esta semana";
  return "Mais tarde";
}
