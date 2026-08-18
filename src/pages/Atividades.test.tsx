import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Atividade } from "@/hooks/useAtividades";

let atividadesMock: Atividade[] = [];

vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/Logo", () => ({ default: () => null }));
vi.mock("@/components/atividades/NovaAtividadeDialog", () => ({ default: () => null }));
vi.mock("@/components/atividades/AtividadeCard", () => ({
  default: ({ atividade }: { atividade: Atividade }) => <div>{atividade.tipo_nome}</div>,
}));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/hooks/useAtividades", () => ({
  useAtividades: () => ({ data: atividadesMock, isLoading: false }),
  useConcluirAtividade: () => ({ mutate: vi.fn(), isPending: false }),
  useAdiarAtividade: () => ({ mutate: vi.fn(), isPending: false }),
}));

import Atividades from "./Atividades";

function make(over: Partial<Atividade> = {}): Atividade {
  return {
    id: "at-1", tipo_id: "t1", tipo_nome: "Aluguel", tipo_slug: "aluguel",
    cliente_id: "c1", cliente_nome: "Fulano", cliente_telefone: null,
    responsavel_id: "u1", responsavel_nome: "Vend",
    data: "2020-01-01", status: "a_fazer", status_visivel: "atrasada", descricao: null,
    ficha_id: null, pedido_id: null, unidade_id: 1, grupo_id: "g1",
    created_by: "u1", created_at: "2020-01-01T00:00:00Z", updated_at: "2020-01-01T00:00:00Z",
    ...over,
  } as Atividade;
}

beforeEach(() => {
  atividadesMock = [];
});

describe("Início — agenda de atividades", () => {
  it("vazio mostra o estado 'em dia'", () => {
    render(<Atividades />);
    expect(screen.getByText("Nenhuma atividade por aqui")).toBeInTheDocument();
  });

  it("atividade atrasada (status_visivel do servidor) cai na seção Atrasadas", () => {
    atividadesMock = [make()];
    render(<Atividades />);
    expect(screen.getByText(/Atrasadas/)).toBeInTheDocument();
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
  });

  it("tem os filtros Ativas e Todas", () => {
    render(<Atividades />);
    expect(screen.getByRole("button", { name: "Ativas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
  });

  it("grupo futuro nasce recolhido e expande no toque", async () => {
    atividadesMock = [make({ data: "2099-01-01", status_visivel: "a_fazer" })];
    render(<Atividades />);
    // header do grupo visível, cards escondidos
    const cabecalho = screen.getByRole("button", { name: /Mais tarde/ });
    expect(cabecalho).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Aluguel")).not.toBeInTheDocument();
    await userEvent.click(cabecalho);
    expect(cabecalho).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
  });

  it("Atrasadas e Hoje não são recolhíveis (cards sempre visíveis)", () => {
    atividadesMock = [make()]; // atrasada
    render(<Atividades />);
    expect(screen.queryByRole("button", { name: /Atrasadas/ })).not.toBeInTheDocument();
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
  });
});
