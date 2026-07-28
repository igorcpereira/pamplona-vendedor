import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AtividadeCard from "./AtividadeCard";
import type { Atividade } from "@/hooks/useAtividades";

vi.mock("@/hooks/useHistoricoCliente", () => ({
  useHistoricoCliente: () => ({ data: [], isLoading: false }),
}));

function makeAtividade(over: Partial<Atividade> = {}): Atividade {
  return {
    id: "at-1",
    tipo_id: "t1",
    tipo_nome: "Casamento",
    tipo_slug: "casamento",
    cliente_id: "c1",
    cliente_nome: "Fulano",
    cliente_telefone: "5544999998888",
    responsavel_id: "u1",
    responsavel_nome: "Vend",
    data: "2030-01-10",
    status: "a_fazer",
    status_visivel: "a_fazer",
    descricao: "ligar",
    ficha_id: null,
    pedido_id: null,
    unidade_id: 1,
    grupo_id: "g1",
    created_by: "u1",
    created_at: "2030-01-01T00:00:00Z",
    updated_at: "2030-01-01T00:00:00Z",
    ...over,
  } as Atividade;
}

describe("AtividadeCard — ações", () => {
  it("concluir chama onConcluir direto", async () => {
    const onConcluir = vi.fn();
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={onConcluir} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onConcluir).toHaveBeenCalled();
  });

  it("adiar abre o calendário e confirma com a data pré-preenchida", async () => {
    const onAdiar = vi.fn();
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={onAdiar} />);
    await userEvent.click(screen.getByRole("button", { name: "Adiar" }));
    // com o mini-modal aberto há dois botões "Adiar"; o de confirmação é o último
    const botoes = screen.getAllByRole("button", { name: "Adiar" });
    await userEvent.click(botoes[botoes.length - 1]);
    expect(onAdiar).toHaveBeenCalledWith("2030-01-10");
  });

  it("NÃO existe botão de cancelar (cancelar é só pelo CRM)", () => {
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("encerrada (concluída) esconde as ações", () => {
    render(
      <AtividadeCard
        atividade={makeAtividade({ status: "concluida", status_visivel: "concluida" })}
        onConcluir={vi.fn()}
        onAdiar={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Concluir" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adiar" })).not.toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });

  it("cancelada pelo CRM renderiza em leitura com o badge", () => {
    render(
      <AtividadeCard
        atividade={makeAtividade({ status: "cancelada", status_visivel: "cancelada" })}
        onConcluir={vi.fn()}
        onAdiar={vi.fn()}
      />,
    );
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Concluir" })).not.toBeInTheDocument();
  });
});

describe("AtividadeCard — exibição", () => {
  it("título é o cliente; tipo vira subtítulo; badge de atrasada", () => {
    render(
      <AtividadeCard
        atividade={makeAtividade({ status_visivel: "atrasada" })}
        onConcluir={vi.fn()}
        onAdiar={vi.fn()}
      />,
    );
    expect(screen.getByText("Fulano")).toBeInTheDocument();
    expect(screen.getByText("Casamento")).toBeInTheDocument();
    expect(screen.getByText("Atrasada")).toBeInTheDocument();
  });

  it("sem cliente, o tipo assume o título e não há botão de histórico", () => {
    render(
      <AtividadeCard
        atividade={makeAtividade({ cliente_id: null, cliente_nome: null, cliente_telefone: null })}
        onConcluir={vi.fn()}
        onAdiar={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Casamento" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Histórico do cliente" })).not.toBeInTheDocument();
  });

  it("mostra a data do evento quando presente", () => {
    render(
      <AtividadeCard
        atividade={makeAtividade({ data_evento: "2026-12-25" } as Partial<Atividade>)}
        onConcluir={vi.fn()}
        onAdiar={vi.fn()}
      />,
    );
    expect(screen.getByText(/Evento:/)).toBeInTheDocument();
    expect(screen.getByText("25/12")).toBeInTheDocument();
  });

  it("com cliente, o histórico abre em dialog", async () => {
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Histórico do cliente" }));
    expect(screen.getByText("Histórico do cliente")).toBeInTheDocument();
    expect(screen.getByText("Nenhum histórico para este cliente.")).toBeInTheDocument();
  });
});
