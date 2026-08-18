import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NovaAtividadeDialog from "./NovaAtividadeDialog";

const mockCriar = vi.fn(() => Promise.resolve("g1"));
const mockCriarLote = vi.fn(() => Promise.resolve({ grupo_id: "g2", criadas: 5 }));
const mockToast = vi.fn();
const mockInvoke = vi.fn();
let recentesMock: { id: string; nome: string }[] = [];
let previaMock: { total: number } | undefined = { total: 5 };

vi.mock("@/hooks/use-toast", () => ({ toast: (...a: unknown[]) => mockToast(...a) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } },
}));
vi.mock("@/hooks/useClientes", () => ({
  useClientes: () => ({ data: { pages: [[]] }, isFetching: false }),
}));
vi.mock("@/hooks/useUltimosClientes", () => ({
  useUltimosClientes: () => ({ data: recentesMock, isLoading: false }),
}));
vi.mock("@/hooks/useTagsAtivas", () => ({
  useTagsAtivas: () => ({
    data: [
      { id: "tag-adv", nome: "Advogado", padrao: true },
      { id: "tag-med", nome: "Médico", padrao: false },
    ],
  }),
}));
vi.mock("@/hooks/useAtividades", () => ({
  useCriarAtividade: () => ({ mutateAsync: mockCriar, isPending: false }),
  useCriarLoteCarteira: () => ({ mutateAsync: mockCriarLote, isPending: false }),
  useCarteiraPrevia: () => ({ data: previaMock, isFetching: false }),
  useTiposAtividadeAtivos: () => ({
    data: [
      { id: "t-cas", slug: "casamento", nome: "Casamento", exige_cliente: true },
      { id: "t-lem", slug: "lembrete", nome: "Lembrete", exige_cliente: false },
    ],
  }),
}));

function renderDialog(props: { clienteInicial?: { id: string; nome: string } } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <NovaAtividadeDialog open onClose={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockCriar.mockClear();
  mockCriarLote.mockClear();
  mockToast.mockClear();
  mockInvoke.mockReset();
  recentesMock = [{ id: "c1", nome: "Fulano" }, { id: "c2", nome: "Beltrano" }];
  previaMock = { total: 5 };
});

describe("NovaAtividadeDialog — passo 1 (cliente)", () => {
  it("mostra os últimos clientes como botões e o Pré Cadastro", () => {
    renderDialog();
    expect(screen.getByText("Passo 1 de 2 — quem é o cliente?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fulano/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pré Cadastro/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continuar sem cliente/ })).not.toBeInTheDocument();
  });

  it("tocar num cliente avança para o passo 2 com o nome no cabeçalho", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    expect(screen.getByText("Passo 2 de 2 — tipo e data")).toBeInTheDocument();
    expect(screen.getByText("Fulano")).toBeInTheDocument();
  });
});

describe("NovaAtividadeDialog — passo 2 (pré cadastro)", () => {
  it("Pré Cadastro mostra campos de nome e telefone e todos os tipos", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Pré Cadastro/ }));
    expect(screen.getByLabelText("Nome *")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Casamento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lembrete" })).toBeInTheDocument();
  });

  it("sem telefone válido, não chama a edge nem cria", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Pré Cadastro/ }));
    await userEvent.type(screen.getByLabelText("Nome *"), "Sicrano");
    await userEvent.click(screen.getByRole("button", { name: "Lembrete" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockCriar).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Telefone inválido." }));
  });

  it("com nome e telefone, cria o cliente na edge e a atividade com o id devolvido", async () => {
    mockInvoke.mockResolvedValue({ data: { cliente_id: "novo-cliente" }, error: null });
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Pré Cadastro/ }));
    await userEvent.type(screen.getByLabelText("Nome *"), "Sicrano");
    await userEvent.type(screen.getByLabelText("Telefone *"), "44999998888");
    await userEvent.click(screen.getByRole("button", { name: "Casamento" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));

    expect(mockInvoke).toHaveBeenCalledWith("criar-cliente", {
      body: { nome: "Sicrano", telefone: "5544999998888", vendedor_id: "u1" },
    });
    expect(mockCriar).toHaveBeenCalledWith(expect.objectContaining({ clienteId: "novo-cliente" }));
  });
});

describe("NovaAtividadeDialog — passo 2 (comum)", () => {
  it("mostra os 4 atalhos de data, Outra data… e o campo de data do evento", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    for (const rotulo of ["Amanhã", "Próxima semana", "Próximo mês", "Próximo semestre"]) {
      expect(screen.getByRole("button", { name: new RegExp(rotulo) })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Outra data/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Data do evento (opcional)")).toBeInTheDocument();
  });

  it("data do evento preenchida vai no payload", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    await userEvent.click(screen.getByRole("button", { name: "Casamento" }));
    await userEvent.type(screen.getByLabelText("Data do evento (opcional)"), "2026-12-25");
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(mockCriar).toHaveBeenCalledWith(expect.objectContaining({ dataEvento: "2026-12-25" }));
  });

  it("sem tipo selecionado, não cria e avisa", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(mockCriar).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it("voltar ao passo 1 preserva o fluxo", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar para a escolha do cliente" }));
    expect(screen.getByText("Passo 1 de 2 — quem é o cliente?")).toBeInTheDocument();
  });
});

describe("NovaAtividadeDialog — clienteInicial (tela Clientes)", () => {
  it("abre direto no passo 2 com o cliente escolhido e sem seletor de modo", () => {
    renderDialog({ clienteInicial: { id: "c9", nome: "Cicrana" } });
    expect(screen.getByText("Passo 2 de 2 — tipo e data")).toBeInTheDocument();
    expect(screen.getByText("Cicrana")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Minha carteira/ })).not.toBeInTheDocument();
  });
});

describe("NovaAtividadeDialog — modo Minha carteira", () => {
  it("mostra filtros, prévia e cria o lote com os filtros escolhidos", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Minha carteira/ }));
    expect(screen.getByText("Passo 1 de 2 — filtre a sua carteira")).toBeInTheDocument();

    // tag em destaque + tipo de cliente + recência
    await userEvent.click(screen.getByRole("button", { name: "Advogado" }));
    await userEvent.click(screen.getByRole("button", { name: "Venda" }));
    await userEvent.click(screen.getByRole("button", { name: "90 dias+" }));

    // prévia mockada
    expect(screen.getByText(/clientes da sua carteira/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Passo 2 de 2 — tipo e data")).toBeInTheDocument();
    expect(screen.getByText("5 clientes selecionados")).toBeInTheDocument();
    // sem campo de data do evento no fluxo da carteira
    expect(screen.queryByLabelText("Data do evento (opcional)")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Casamento" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar atividades" }));

    expect(mockCriarLote).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoId: "t-cas",
        filtros: expect.objectContaining({
          tagIds: ["tag-adv"],
          tipos: ["venda"],
          recenciaCampo: "atendimento",
        }),
        descricao: expect.stringContaining("Minha carteira"),
      }),
    );
  });

  it("busca acha tag fora do destaque", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Minha carteira/ }));
    expect(screen.queryByRole("button", { name: "Médico" })).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("Buscar outras tags…"), "méd");
    await userEvent.click(screen.getByRole("button", { name: "Médico" }));
    // depois de escolhida, vira chip selecionado no destaque
    expect(screen.getByRole("button", { name: "Médico" })).toBeInTheDocument();
  });

  it("com prévia zerada, o Continuar fica bloqueado", async () => {
    previaMock = { total: 0 };
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: /Minha carteira/ }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });
});
