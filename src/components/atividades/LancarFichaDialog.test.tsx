import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import LancarFichaDialog, { type ContextoDaFicha } from "./LancarFichaDialog";

/**
 * O que estes testes protegem é o motivo do modal existir: a ficha tem que
 * nascer LIGADA ao card e já elegível. Se alguém "simplificar" o insert e tirar
 * `oportunidade_id`, `cliente_id` ou `status: 'ativa'`, a oportunidade volta a
 * ficar aberta para sempre — foi exatamente o bug de 24/08.
 */
const insertMock = vi.fn();
const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: (payload: unknown) => {
        insertMock(payload);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "ficha-nova" }, error: null }),
          }),
        };
      },
    }),
    functions: { invoke: (...args: unknown[]) => { invokeMock(...args); return Promise.resolve({}); } },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "vend-1" }, profile: { unidade_id: 1 } }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/hooks/useTravaSubmit", () => ({
  useTravaSubmit: () => (fn: () => Promise<void>) => fn(),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ toast: (...a: unknown[]) => toastMock(...a) }));

const contexto: ContextoDaFicha = {
  oportunidadeId: "op-1",
  clienteId: "cli-1",
  clienteNome: "Teste 2",
  clienteTelefone: "5544912341234",
  unidadeId: 1,
  tipoNegociacao: "noivo",
  dataEvento: "2030-06-15",
};

const abrir = (ctx: ContextoDaFicha = contexto) =>
  render(
    <MemoryRouter>
      <LancarFichaDialog open contexto={ctx} onClose={vi.fn()} />
    </MemoryRouter>,
  );

describe("LancarFichaDialog", () => {
  beforeEach(() => {
    insertMock.mockClear();
    invokeMock.mockClear();
    toastMock.mockClear();
  });

  it("sem código não grava nada", async () => {
    abrir();
    await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
    expect(insertMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Informe o código da ficha" }),
    );
  });

  it("a ficha nasce ligada ao card, com cliente do card e já elegível", async () => {
    abrir();
    await userEvent.type(screen.getByLabelText("Código da ficha *"), "12345");
    await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        oportunidade_id: "op-1",
        cliente_id: "cli-1",
        status: "ativa",
        codigo_ficha: "12345",
        unidade_id: 1,
        vendedor_id: "vend-1",
        // O tipo de negociação do card decide, sem perguntar de novo.
        is_noivo: true,
        sob_medida: false,
        // A data da festa vem do evento do card.
        data_festa: "2030-06-15",
      }),
    );
  });

  it("avisa o cliente pelo WhatsApp, como a tela completa faz", async () => {
    abrir();
    await userEvent.type(screen.getByLabelText("Código da ficha *"), "999");
    await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
    expect(invokeMock).toHaveBeenCalledWith(
      "notificar-ficha-whatsapp",
      expect.objectContaining({ body: { ficha_id: "ficha-nova" } }),
    );
  });

  it("sob medida deriva do tipo do card", async () => {
    abrir({ ...contexto, tipoNegociacao: "sob_medida" });
    await userEvent.type(screen.getByLabelText("Código da ficha *"), "777");
    await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_noivo: false, sob_medida: true }),
    );
  });

  it("depois de lançar, oferece abrir a ficha completa", async () => {
    abrir();
    await userEvent.type(screen.getByLabelText("Código da ficha *"), "555");
    await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
    expect(await screen.findByRole("button", { name: "Abrir ficha completa" }))
      .toBeInTheDocument();
  });
});
