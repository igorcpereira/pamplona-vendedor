import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NovaAtividadeDialog from "./NovaAtividadeDialog";

const mockCriar = vi.fn(() => Promise.resolve("g1"));
const mockToast = vi.fn();
let recentesMock: { id: string; nome: string }[] = [];

vi.mock("@/hooks/use-toast", () => ({ toast: (...a: unknown[]) => mockToast(...a) }));
vi.mock("@/hooks/useClientes", () => ({
  useClientes: () => ({ data: { pages: [[]] }, isFetching: false }),
}));
vi.mock("@/hooks/useUltimosClientes", () => ({
  useUltimosClientes: () => ({ data: recentesMock, isLoading: false }),
}));
vi.mock("@/hooks/useAtividades", () => ({
  useCriarAtividade: () => ({ mutateAsync: mockCriar, isPending: false }),
  useTiposAtividadeAtivos: () => ({
    data: [
      { id: "t-cas", slug: "casamento", nome: "Casamento", exige_cliente: true },
      { id: "t-lem", slug: "lembrete", nome: "Lembrete", exige_cliente: false },
    ],
  }),
}));

beforeEach(() => {
  mockCriar.mockClear();
  mockToast.mockClear();
  recentesMock = [{ id: "c1", nome: "Fulano" }, { id: "c2", nome: "Beltrano" }];
});

describe("NovaAtividadeDialog — passo 1 (cliente)", () => {
  it("mostra os últimos clientes como botões", () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    expect(screen.getByText("Passo 1 de 2 — quem é o cliente?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fulano/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Beltrano/ })).toBeInTheDocument();
  });

  it("sem lançamentos, esconde a grade e mantém busca + sem cliente", () => {
    recentesMock = [];
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    expect(screen.queryByText("Seus últimos lançamentos")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome ou telefone…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar sem cliente/ })).toBeInTheDocument();
  });

  it("tocar num cliente avança para o passo 2 com o nome no cabeçalho", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    expect(screen.getByText("Passo 2 de 2 — tipo e data")).toBeInTheDocument();
    expect(screen.getByText("Fulano")).toBeInTheDocument();
  });
});

describe("NovaAtividadeDialog — passo 2 (tipo e data)", () => {
  it("sem cliente, só tipos que dispensam cliente", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Continuar sem cliente/ }));
    expect(screen.getByText("Sem cliente")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Lembrete" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Casamento" })).not.toBeInTheDocument();
  });

  it("com cliente, todos os tipos aparecem", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Casamento" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lembrete" })).toBeInTheDocument();
  });

  it("mostra os 4 atalhos de data e o Outra data…", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    for (const rotulo of ["Amanhã", "Próxima semana", "Próximo mês", "Próximo semestre"]) {
      expect(screen.getByRole("button", { name: new RegExp(rotulo) })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Outra data/ })).toBeInTheDocument();
  });

  it("sem tipo selecionado, não cria e avisa", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(mockCriar).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it("voltar ao passo 1 preserva o fluxo", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Fulano/ }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar para a escolha do cliente" }));
    expect(screen.getByText("Passo 1 de 2 — quem é o cliente?")).toBeInTheDocument();
  });
});
