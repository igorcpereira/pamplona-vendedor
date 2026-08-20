import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import AtividadeCard from "./AtividadeCard";
import type { Atividade } from "@/hooks/useAtividades";

vi.mock("@/hooks/useHistoricoCliente", () => ({
  useHistoricoCliente: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/hooks/useVendedoresUnidade", () => ({
  useVendedoresUnidade: () => ({ data: [{ id: "v-1", nome: "Davi" }] }),
}));

/** O card navega para /novo no desfecho de ficha: precisa de Router. */
const renderCard = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

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

describe("AtividadeCard — oportunidade", () => {
  const comFunil = () => makeAtividade({
    oportunidade_id: "op-1",
    oportunidade_tipo: "noivo",
    oportunidade_etapa: 1,
    oportunidade_etapa_rotulo: "Primeiro contato",
    desfechos: [
      {
        slug: "orcamento_enviado", rotulo: "Orçamento enviado",
        destino: { tipo: "etapa", etapa: 2 }, campos: [],
      },
      { slug: "desistiu", rotulo: "Desistiu", destino: { tipo: "perdida" }, campos: [] },
    ],
  } as Partial<Atividade>);

  it("mostra o selo do funil no card", () => {
    renderCard(<AtividadeCard atividade={comFunil()} onConcluir={vi.fn()} onAdiar={vi.fn()} />);
    expect(screen.getByText(/Noivo · Primeiro contato/)).toBeInTheDocument();
  });

  it("exige desfecho para concluir e repassa o slug escolhido", async () => {
    const onConcluir = vi.fn();
    renderCard(<AtividadeCard atividade={comFunil()} onConcluir={onConcluir} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));

    // Sem desfecho escolhido não há o que confirmar: o botão diz o que falta.
    expect(screen.getByRole("button", { name: "Escolha como terminou" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Orçamento enviado" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Concluir" }).at(-1)!);
    expect(onConcluir).toHaveBeenCalledWith(null, "orcamento_enviado", {});
  });

  it("atividade avulsa não oferece desfecho", async () => {
    renderCard(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.queryByText("Como terminou?")).not.toBeInTheDocument();
  });
});

describe("AtividadeCard — ações", () => {
  it("concluir abre o mini-dialog e confirma sem observação (obs = null)", async () => {
    const onConcluir = vi.fn();
    renderCard(<AtividadeCard atividade={makeAtividade()} onConcluir={onConcluir} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    // dialog aberto: nada foi concluído ainda
    expect(onConcluir).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("O que aconteceu? (opcional)")).toBeInTheDocument();
    // com o mini-modal aberto há dois botões "Concluir"; o de confirmação é o último
    const botoes = screen.getAllByRole("button", { name: "Concluir" });
    await userEvent.click(botoes[botoes.length - 1]);
    expect(onConcluir).toHaveBeenCalledWith(null);
  });

  it("concluir com observação repassa o texto", async () => {
    const onConcluir = vi.fn();
    renderCard(<AtividadeCard atividade={makeAtividade()} onConcluir={onConcluir} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await userEvent.type(
      screen.getByPlaceholderText("O que aconteceu? (opcional)"),
      "enviei o orçamento, cliente vai analisar",
    );
    const botoes = screen.getAllByRole("button", { name: "Concluir" });
    await userEvent.click(botoes[botoes.length - 1]);
    expect(onConcluir).toHaveBeenCalledWith("enviei o orçamento, cliente vai analisar");
  });

  it("adiar abre o calendário e confirma com a data pré-preenchida", async () => {
    const onAdiar = vi.fn();
    renderCard(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={onAdiar} />);
    await userEvent.click(screen.getByRole("button", { name: "Adiar" }));
    // com o mini-modal aberto há dois botões "Adiar"; o de confirmação é o último
    const botoes = screen.getAllByRole("button", { name: "Adiar" });
    await userEvent.click(botoes[botoes.length - 1]);
    expect(onAdiar).toHaveBeenCalledWith("2030-01-10");
  });

  it("NÃO existe botão de cancelar (cancelar é só pelo CRM)", () => {
    renderCard(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("encerrada (concluída) esconde as ações", () => {
    renderCard(
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
    renderCard(
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
    renderCard(
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
    renderCard(
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
    renderCard(
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
    renderCard(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Histórico do cliente" }));
    expect(screen.getByText("Histórico do cliente")).toBeInTheDocument();
    expect(screen.getByText("Nenhum histórico para este cliente.")).toBeInTheDocument();
  });
});
