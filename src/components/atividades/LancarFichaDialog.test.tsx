import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import LancarFichaDialog, { type ContextoDaFicha } from "./LancarFichaDialog";

/**
 * O que estes testes protegem é o motivo do modal existir: a ficha tem que
 * nascer LIGADA ao card, nos DOIS caminhos.
 *
 * · Na foto, `oportunidade_id` e `cliente_id` viajam no FormData da edge. Se
 *   alguém tirar o `cliente_id` de lá, a ficha volta a ser do cliente que o OCR
 *   inventar a partir do telefone do papel — bug de 24/08.
 * · No manual, o insert tem que sair com `oportunidade_id`, `cliente_id` e
 *   `status: 'ativa'`, senão a oportunidade fica aberta para sempre.
 *
 * E a foto é a porta de entrada: o modal ABRE nela. Preencher à mão é o desvio,
 * porque quase ninguém digita ficha.
 */
const insertMock = vi.fn();
const invokeMock = vi.fn();
const navigateMock = vi.fn();
const onCloseMock = vi.fn();

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
    functions: {
      invoke: (nome: string, opts: unknown) => {
        invokeMock(nome, opts);
        return Promise.resolve(
          nome === "processar-ficha-v3"
            ? { data: { ficha_id: "ficha-ocr" }, error: null }
            : {},
        );
      },
    },
  },
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigateMock,
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
      <LancarFichaDialog open contexto={ctx} onClose={onCloseMock} />
    </MemoryRouter>,
  );

/** O formulário agora é o segundo caminho: chega-se nele por um clique. */
const irParaManual = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Preencher manualmente" }));
};

/** Escolhe a foto pelo input escondido — `userEvent.upload` não toca em display:none. */
const escolherFoto = async (nome = "ficha.jpg", tipo = "image/jpeg") => {
  const input = document.getElementById("ficha-camera") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(["x"], nome, { type: tipo })] } });
  return screen.findByRole("button", { name: "Enviar ficha" });
};

describe("LancarFichaDialog", () => {
  beforeEach(() => {
    insertMock.mockClear();
    invokeMock.mockClear();
    navigateMock.mockClear();
    onCloseMock.mockClear();
    toastMock.mockClear();
  });

  describe("foto — o caminho padrão", () => {
    it("abre na câmera, não no formulário", () => {
      abrir();
      expect(screen.getByRole("button", { name: "Tirar foto da ficha" })).toBeInTheDocument();
      expect(screen.queryByLabelText("Código da ficha *")).not.toBeInTheDocument();
    });

    it("leva o card, o cliente e a loja para a edge do OCR", async () => {
      abrir();
      await userEvent.click(await escolherFoto());

      expect(invokeMock).toHaveBeenCalledWith(
        "processar-ficha-v3",
        expect.objectContaining({ body: expect.any(FormData) }),
      );

      const body = invokeMock.mock.calls[0][1].body as FormData;
      expect(body.get("oportunidade_id")).toBe("op-1");
      // O pedaço que faltava: sem ele o dono da ficha sairia do telefone lido
      // no papel, e telefone que não casa cria cliente novo.
      expect(body.get("cliente_id")).toBe("cli-1");
      expect(body.get("cliente_nome")).toBe("Teste 2");
      expect(body.get("cliente_telefone")).toBe("5544912341234");
      expect(body.get("unidade_id")).toBe("1");
      expect(body.get("user_id")).toBe("vend-1");
      expect(body.get("image")).toBeInstanceOf(File);
    });

    it("depois de enviar, abre a conferência da ficha criada", async () => {
      abrir();
      await userEvent.click(await escolherFoto());

      expect(onCloseMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith(
        "/editar-ficha-v3/ficha-ocr",
        expect.objectContaining({
          state: expect.objectContaining({ isNewFicha: true }),
        }),
      );
    });

    it("recusa formato que a edge não aceita, sem enviar nada", async () => {
      abrir();
      const input = document.getElementById("ficha-galeria") as HTMLInputElement;
      fireEvent.change(input, {
        target: { files: [new File(["x"], "ficha.webp", { type: "image/webp" })] },
      });

      expect(await screen.findByRole("button", { name: "Tirar foto da ficha" }))
        .toBeInTheDocument();
      expect(invokeMock).not.toHaveBeenCalled();
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Formato não aceito" }),
      );
    });
  });

  describe("manual — o desvio", () => {
    it("sem código não grava nada", async () => {
      abrir();
      await irParaManual();
      await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
      expect(insertMock).not.toHaveBeenCalled();
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Informe o código da ficha" }),
      );
    });

    it("a ficha nasce ligada ao card, com cliente do card e já elegível", async () => {
      abrir();
      await irParaManual();
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
      await irParaManual();
      await userEvent.type(screen.getByLabelText("Código da ficha *"), "999");
      await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
      expect(invokeMock).toHaveBeenCalledWith(
        "notificar-ficha-whatsapp",
        expect.objectContaining({ body: { ficha_id: "ficha-nova" } }),
      );
    });

    it("sob medida deriva do tipo do card", async () => {
      abrir({ ...contexto, tipoNegociacao: "sob_medida" });
      await irParaManual();
      await userEvent.type(screen.getByLabelText("Código da ficha *"), "777");
      await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ is_noivo: false, sob_medida: true }),
      );
    });

    it("depois de lançar, oferece abrir a ficha completa", async () => {
      abrir();
      await irParaManual();
      await userEvent.type(screen.getByLabelText("Código da ficha *"), "555");
      await userEvent.click(screen.getByRole("button", { name: "Lançar ficha" }));
      expect(await screen.findByRole("button", { name: "Abrir ficha completa" }))
        .toBeInTheDocument();
    });

    it("dá para voltar para a foto sem fechar o modal", async () => {
      abrir();
      await irParaManual();
      await userEvent.click(screen.getByRole("button", { name: "Voltar para a foto da ficha" }));
      expect(screen.getByRole("button", { name: "Tirar foto da ficha" })).toBeInTheDocument();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });
});
