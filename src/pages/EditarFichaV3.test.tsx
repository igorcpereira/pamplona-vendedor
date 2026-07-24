import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// IDs de teste
// ---------------------------------------------------------------------------
const USER_A = "00000000-0000-0000-0000-00000000aaaa";
const USER_B = "00000000-0000-0000-0000-00000000bbbb";
const FICHA_ID = "00000000-0000-0000-0000-00000000fb01";

// ---------------------------------------------------------------------------
// Estado configurável dos mocks (ajustado por teste antes de renderizar)
// ---------------------------------------------------------------------------
const authState = {
  user: { id: USER_A } as { id: string } | null,
  profile: { unidade_id: 9990 },
  activeUnidade: { role: "vendedor" } as { role: string } | null,
};

let fichaMock: Record<string, unknown> = {};
const rpcMock = vi.fn(() => Promise.resolve({ data: null, error: null }));

// ---------------------------------------------------------------------------
// Mocks de módulos
// ---------------------------------------------------------------------------
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/PedidoModal", () => ({ default: () => null }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/hooks/useTravaSubmit", () => ({
  useTravaSubmit: () => (fn: () => Promise<void>) => fn(),
}));

vi.mock("@/hooks/useProvasFicha", () => ({
  useProvasFicha: () => ({ data: [] }),
  useAdicionarProva: () => ({ mutateAsync: vi.fn() }),
  useDeletarProva: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/usePedidosFicha", () => ({
  usePedidosFicha: () => ({ data: [] }),
}));

vi.mock("@/hooks/useVendedoresUnidade", () => ({
  useVendedoresUnidade: () => ({ data: [] }),
}));

vi.mock("@/hooks/useLanificios", () => ({
  useLanificios: () => ({ data: [] }),
}));

vi.mock("@/hooks/useOpcoesFicha", () => ({
  useOpcoesFicha: () => ({ data: undefined }),
}));

vi.mock("@/hooks/useTiposItemAvulso", () => ({
  useTiposItemAvulso: () => ({ data: [] }),
}));

// Chainable mínimo do supabase-js: todo método encadeável retorna o próprio
// objeto; `.single()`/`await` resolvem para o resultado configurado.
function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  Object.assign(chain, {
    select: ret,
    eq: ret,
    order: ret,
    in: ret,
    delete: ret,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  });
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) =>
      makeChain(
        table === "fichas"
          ? { data: fichaMock, error: null }
          : { data: [], error: null }
      ),
    rpc: rpcMock,
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
  },
}));

// Importado depois dos mocks (import dinâmico dentro do render helper)
async function renderFicha() {
  const { default: EditarFichaV3 } = await import("./EditarFichaV3");
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/editar-ficha-v3/${FICHA_ID}`]}>
        <Routes>
          <Route path="/editar-ficha-v3/:id" element={<EditarFichaV3 />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function baseFicha(overrides: Record<string, unknown>) {
  return {
    id: FICHA_ID,
    tipo: "aluguel",
    status: "ativa",
    codigo_ficha: "TESTE-1",
    vendedor_id: USER_A,
    unidade_id: 9990,
    pago: false,
    nome_cliente: "Cliente Teste",
    telefone_cliente: null,
    cliente_id: null,
    valor: 100,
    ...overrides,
  };
}

beforeEach(() => {
  authState.user = { id: USER_A };
  authState.activeUnidade = { role: "vendedor" };
  rpcMock.mockClear();
});

describe("EditarFichaV3 — dono da ficha", () => {
  it("ficha pendente (1º save): botão 'Lançar Ficha' e núcleo editável", async () => {
    fichaMock = baseFicha({ vendedor_id: USER_A, status: "pendente" });
    await renderFicha();

    expect(await screen.findByRole("button", { name: "Lançar Ficha" })).toBeInTheDocument();
    const nome = screen.getByDisplayValue("Cliente Teste");
    expect(nome).not.toBeDisabled();
    expect(screen.queryByText("Ficha de outro vendedor")).not.toBeInTheDocument();
  });

  it("ficha já lançada (2º save+): botão 'Atualizar Ficha'", async () => {
    fichaMock = baseFicha({ vendedor_id: USER_A, status: "ativa" });
    await renderFicha();

    expect(await screen.findByRole("button", { name: "Atualizar Ficha" })).toBeInTheDocument();
  });
});

describe("EditarFichaV3 — ficha de OUTRO vendedor (requisitos a/b/d)", () => {
  beforeEach(() => {
    fichaMock = baseFicha({ vendedor_id: USER_B, status: "ativa", pago: false });
  });

  it("(a) mostra aviso, núcleo somente-leitura e SEM botão de salvar", async () => {
    await renderFicha();

    expect(await screen.findByText("Ficha de outro vendedor")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cliente Teste")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Atualizar Ficha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lançar Ficha" })).not.toBeInTheDocument();
  });

  it("(b) seção de provas continua disponível", async () => {
    await renderFicha();
    expect(await screen.findByRole("button", { name: /Adicionar Prova/i })).toBeEnabled();
  });

  it("(d) marcar pago chama a RPC marcar_ficha_paga com o id da ficha", async () => {
    await renderFicha();
    // espera carregar
    await screen.findByText("Ficha de outro vendedor");

    const pagoSwitch = screen.getByRole("switch");
    expect(pagoSwitch).toBeEnabled();
    await userEvent.click(pagoSwitch);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("marcar_ficha_paga", { p_ficha_id: FICHA_ID });
    });
  });
});
