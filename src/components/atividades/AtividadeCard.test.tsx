import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AtividadeCard from "./AtividadeCard";
import type { Atividade } from "@/hooks/useAtividades";

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
  it("concluir chama onConcluir com a observação", async () => {
    const onConcluir = vi.fn();
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={onConcluir} onAdiar={vi.fn()} onCancelar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await userEvent.type(screen.getByLabelText("Observação"), "falei com cliente");
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onConcluir).toHaveBeenCalledWith("falei com cliente");
  });

  it("cancelar chama onCancelar com o motivo", async () => {
    const onCancelar = vi.fn();
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={vi.fn()} onCancelar={onCancelar} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await userEvent.type(screen.getByLabelText("Observação"), "desistiu");
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onCancelar).toHaveBeenCalledWith("desistiu");
  });

  it("adiar chama onAdiar com nova data", async () => {
    const onAdiar = vi.fn();
    render(<AtividadeCard atividade={makeAtividade()} onConcluir={vi.fn()} onAdiar={onAdiar} onCancelar={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Adiar" }));
    // sem mudar o calendário, confirma com a data pré-preenchida (2030-01-10)
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onAdiar).toHaveBeenCalledWith("2030-01-10", null);
  });

  it("mostra o tipo como título e o status", () => {
    render(<AtividadeCard atividade={makeAtividade({ status_visivel: "atrasada" })} onConcluir={vi.fn()} onAdiar={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Casamento")).toBeInTheDocument();
    expect(screen.getByText("Atrasada")).toBeInTheDocument();
  });
});
