// ─────────────────────────────────────────────────────────────────────────────
// Refoto de ficha já lançada (IGO-182)
//
// Quando o OCR lê um código que já existe, a ficha nova fica 'inativa' e o
// vendedor é mandado para a ORIGINAL. O que ele precisa saber não é "esta ficha
// já existe", e sim O QUE está diferente: a investigação de 01/09 mostrou que a
// refoto costuma ser tentativa de atualizar, e no caso real o valor no papel
// tinha subido de 300 para 800.
//
// Ele não pode corrigir (decisão da Pamplona: ficha lançada só a gestão altera),
// então o objetivo aqui é ele sair sabendo exatamente o que reportar.
// ─────────────────────────────────────────────────────────────────────────────

/** Só campos que mudam num papel e que valem uma conversa: dinheiro e datas. */
export const CAMPOS_DA_REFOTO = [
  { chave: 'valor', rotulo: 'Valor', tipo: 'dinheiro' },
  { chave: 'garantia', rotulo: 'Garantia', tipo: 'dinheiro' },
  { chave: 'data_festa', rotulo: 'Festa', tipo: 'data' },
  { chave: 'data_retirada', rotulo: 'Retirada', tipo: 'data' },
  { chave: 'data_devolucao', rotulo: 'Devolução', tipo: 'data' },
] as const;

export type PapelDaRefoto = Record<string, string | number | null>;

/** Extrai da linha inativa o que o OCR leu, para viajar no state do navigate. */
export function papelDaRefoto(linha: Record<string, unknown> | null | undefined): PapelDaRefoto | null {
  if (!linha) return null;
  const out: PapelDaRefoto = {};
  for (const c of CAMPOS_DA_REFOTO) {
    const v = linha[c.chave];
    out[c.chave] = v === undefined ? null : (v as string | number | null);
  }
  return out;
}

const moeda = (v: unknown) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
/** `2026-09-05` vira `05/09`, sem passar por Date (fuso do navegador). */
const dataCurtaISO = (v: unknown) => {
  const t = String(v ?? '').slice(0, 10);
  const [a, m, d] = t.split('-');
  return a && m && d ? `${d}/${m}` : t;
};

/**
 * Diferenças entre o papel refotografado e a ficha gravada. Devolve só o que
 * difere: campo que o OCR não leu (null) NÃO conta como diferença, senão toda
 * refoto acusaria "faltando" onde o OCR só não conseguiu ler.
 */
export function diferencasDaRefoto(
  papel: PapelDaRefoto | null | undefined,
  ficha: Record<string, unknown> | null,
): { rotulo: string; noPapel: string; naFicha: string }[] {
  if (!papel || !ficha) return [];
  const out: { rotulo: string; noPapel: string; naFicha: string }[] = [];
  for (const c of CAMPOS_DA_REFOTO) {
    const p = papel[c.chave];
    const f = ficha[c.chave] as string | number | null | undefined;
    if (p === null || p === undefined || p === '') continue;
    const igual =
      c.tipo === 'dinheiro'
        ? Number(p) === Number(f ?? NaN)
        : String(p).slice(0, 10) === String(f ?? '').slice(0, 10);
    if (igual) continue;
    const fmt = c.tipo === 'dinheiro' ? moeda : dataCurtaISO;
    out.push({
      rotulo: c.rotulo,
      noPapel: fmt(p),
      naFicha: f === null || f === undefined || f === '' ? 'em branco' : fmt(f),
    });
  }
  return out;
}

