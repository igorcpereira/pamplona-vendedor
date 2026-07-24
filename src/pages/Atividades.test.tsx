import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Atividade } from "@/hooks/useAtividades";

const authState = {
  user: { id: "u1" } as { id: string } | null,
  activeUnidade: { role: "vendedor", unidade: { id: 1 } } as { role: string; unidade: { id: number } } | null,
};
let atividadesMock: Atividade[] = [];

vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/Logo", () => ({ default: () => null }));
vi.mock("@/components/atividades/NovaAtividadeDialog", () => ({ default: () => null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/hooks/useVendedores", () => ({ useVendedores: () => ({ data: [] }) }));
vi.mock("@/hooks/useAtividades", () => ({
  useAtividades: () => ({ data: atividadesMock, isLoading: false }),
  useConcluirAtividade: () => ({ mutate: vi.fn(), isPending: false }),
  useAdiarAtividade: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelarAtividade: () => ({ mutate: vi.fn(), isPending: false }),
}));

import Atividades from "./Atividades";

function atrasada(): Atividade {
  return {
    id: "at-1", tipo_id: "t1", tipo_nome: "Aluguel", tipo_slug: "aluguel",
    cliente_id: "c1", cliente_nome: "Fulano", cliente_telefone: null,
    responsavel_id: "u1", responsavel_nome: "Vend",
    data: "2020-01-01", status: "a_fazer", status_visivel: "atrasada", descricao: null,
    ficha_id: null, pedido_id: null, unidade_id: 1, grupo_id: "g1",
    created_by: "u1", created_at: "2020-01-01T00:00:00Z", updated_at: "2020-01-01T00:00:00Z",
  } as Atividade;
}

beforeEach(() => {
  atividadesMock = [];
  authState.activeUnidade = { role: "vendedor", unidade: { id: 1 } };
});

describe("Início — agenda de atividades", () => {
  it("vendedor NÃO vê o toggle Equipe", () => {
    render(<Atividades />);
    expect(screen.queryByRole("button", { name: "Equipe" })).not.toBeInTheDocument();
  });

  it("gestor VÊ o toggle Equipe", () => {
    authState.activeUnidade = { role: "gestor", unidade: { id: 1 } };
    render(<Atividades />);
    expect(screen.getByRole("button", { name: "Equipe" })).toBeInTheDocument();
  });

  it("atividade a_fazer no passado aparece na seção Atrasadas", () => {
    atividadesMock = [atrasada()];
    render(<Atividades />);
    expect(screen.getByText(/Atrasadas/)).toBeInTheDocument();
    expect(screen.getByText("Aluguel")).toBeInTheDocument();
  });
});
