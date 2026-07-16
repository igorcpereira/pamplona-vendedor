import { useCallback, useState } from 'react';

export interface FiltrosFichas {
  minhas: boolean;
  tipos: string[]; // subconjunto de ['aluguel','venda','ajuste']
  dataInicio: string | null; // 'YYYY-MM-DD'
  dataFim: string | null; // 'YYYY-MM-DD'
  unidadeId: number | null;
}

export const FILTROS_FICHAS_DEFAULT: FiltrosFichas = {
  minhas: false,
  tipos: [],
  dataInicio: null,
  dataFim: null,
  unidadeId: null,
};

const STORAGE_KEY = 'fichas:filtros';

const lerFiltros = (): FiltrosFichas => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FILTROS_FICHAS_DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      minhas: typeof parsed.minhas === 'boolean' ? parsed.minhas : false,
      tipos: Array.isArray(parsed.tipos) ? parsed.tipos : [],
      dataInicio: parsed.dataInicio ?? null,
      dataFim: parsed.dataFim ?? null,
      unidadeId: typeof parsed.unidadeId === 'number' ? parsed.unidadeId : null,
    };
  } catch {
    return FILTROS_FICHAS_DEFAULT;
  }
};

// "minhas" não conta: é um botão próprio fora do popover de filtros
export const contarFiltrosAtivos = (f: FiltrosFichas): number => {
  let count = 0;
  if (f.tipos.length > 0) count++;
  if (f.dataInicio || f.dataFim) count++;
  if (f.unidadeId !== null) count++;
  return count;
};

/**
 * Estado de FiltrosFichas persistido em localStorage (chave `fichas:filtros`).
 * Lê o valor inicial e salva a cada mudança.
 */
export const useFiltrosFichas = () => {
  const [filtros, setFiltrosState] = useState<FiltrosFichas>(() => lerFiltros());

  const setFiltros = useCallback((next: FiltrosFichas) => {
    setFiltrosState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignora falha de persistência (ex.: storage indisponível)
    }
  }, []);

  return { filtros, setFiltros };
};
