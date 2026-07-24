import { differenceInCalendarDays, endOfWeek, isAfter } from "date-fns";

// ---------------------------------------------------------------------------
// Sistema de Atividades — regras puras (piloto Maringá).
//
// Estas funções ESPELHAM as regras que o banco garante de fato (RPCs
// SECURITY DEFINER + RLS). Servem para UX imediata no front; a garantia real é
// sempre no servidor. Se as duas fontes divergirem, os testes acusam.
// ---------------------------------------------------------------------------

/** Unidade do piloto (Maringá). Constante — trocar exige mudança de código/migration. */
export const UNIDADE_PILOTO_MARINGA = 1;

/** Status gravado no banco. `atrasada` NÃO é gravado — é derivado (ver statusVisivel). */
export type AtividadeStatus = "a_fazer" | "concluida" | "cancelada";
export type StatusVisivel = AtividadeStatus | "atrasada";

/** Cargos globais (supervisionam): criam para outros, reatribuem, veem a equipe. */
export const ROLES_GLOBAIS = ["gestor", "admin", "master"] as const;

export function isRoleGlobal(role?: string | null): boolean {
  return !!role && (ROLES_GLOBAIS as readonly string[]).includes(role);
}

/**
 * Deriva o status visível: uma atividade `a_fazer` cuja data já passou aparece
 * como `atrasada`. Concluídas/canceladas nunca ficam atrasadas.
 * `data` e `hoje` no formato ISO `yyyy-MM-dd` (comparação lexicográfica válida).
 */
export function statusVisivel(status: AtividadeStatus, data: string, hoje: string): StatusVisivel {
  if (status === "a_fazer" && data < hoje) return "atrasada";
  return status;
}

export interface TipoAtividadeLike {
  slug: string;
  /** Fonte da verdade vinda do banco. Quando ausente, cai na regra por slug. */
  exige_cliente?: boolean;
}

/** Cliente é obrigatório em todo tipo, exceto `lembrete`. Honra `exige_cliente` do banco. */
export function clienteObrigatorio(tipo: TipoAtividadeLike | null | undefined): boolean {
  if (!tipo) return false;
  if (typeof tipo.exige_cliente === "boolean") return tipo.exige_cliente;
  return tipo.slug !== "lembrete";
}

/** Só cargos globais criam atividade para outro usuário. */
export function podeCriarParaOutro(role?: string | null): boolean {
  return isRoleGlobal(role);
}

/** Só cargos globais reatribuem uma atividade. */
export function podeReatribuir(role?: string | null): boolean {
  return isRoleGlobal(role);
}

/** Só cargos globais veem a aba "Equipe" (agenda de todos). */
export function podeVerEquipe(role?: string | null): boolean {
  return isRoleGlobal(role);
}

/**
 * Responsável efetivo (guard de UI espelhando o servidor): se o cargo pode criar
 * para outro e escolheu alguém, usa o escolhido; senão FORÇA o próprio usuário.
 */
export function responsavelEfetivo(
  role: string | null | undefined,
  selfId: string,
  escolhidoId?: string | null,
): string {
  if (podeCriarParaOutro(role) && escolhidoId) return escolhidoId;
  return selfId;
}

/**
 * Quem enxerga a feature no piloto: cargos globais sempre; demais (vendedor,
 * franqueado, administrativo) só se a unidade ativa for Maringá.
 */
export function podeAcessarAtividades(
  ctx: { role?: string | null; unidadeId?: number | null },
  maringaId: number = UNIDADE_PILOTO_MARINGA,
): boolean {
  if (isRoleGlobal(ctx.role)) return true;
  return ctx.unidadeId === maringaId;
}

export type GrupoAgenda = "Atrasadas" | "Hoje" | "Amanhã" | "Esta semana" | "Mais tarde";

function toDateLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Agrupa a atividade por data relativa a `hoje` (ambos `yyyy-MM-dd`):
 * Atrasadas (passado) · Hoje · Amanhã · Esta semana (até domingo, semana Seg–Dom) · Mais tarde.
 */
export function grupoDaData(data: string, hoje: string): GrupoAgenda {
  const d = toDateLocal(data);
  const h = toDateLocal(hoje);
  const diff = differenceInCalendarDays(d, h);
  if (diff < 0) return "Atrasadas";
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  const fimDaSemana = endOfWeek(h, { weekStartsOn: 1 });
  if (!isAfter(d, fimDaSemana)) return "Esta semana";
  return "Mais tarde";
}

export interface NovaAtividadeInput {
  tipo?: TipoAtividadeLike | null;
  data?: string | null;
  clienteId?: string | null;
  responsavelId?: string | null;
}

export interface ErrosNovaAtividade {
  tipo?: string;
  data?: string;
  cliente?: string;
  responsavel?: string;
}

/** Valida o formulário de nova atividade. Retorna {} quando está tudo certo. */
export function validarNovaAtividade(i: NovaAtividadeInput): ErrosNovaAtividade {
  const erros: ErrosNovaAtividade = {};
  if (!i.tipo || !i.tipo.slug) erros.tipo = "Selecione o tipo da atividade.";
  if (!i.data) erros.data = "Informe a data.";
  if (clienteObrigatorio(i.tipo) && !i.clienteId) erros.cliente = "Selecione o cliente.";
  if (!i.responsavelId) erros.responsavel = "Defina o responsável.";
  return erros;
}

export function semErros(erros: ErrosNovaAtividade): boolean {
  return Object.keys(erros).length === 0;
}
