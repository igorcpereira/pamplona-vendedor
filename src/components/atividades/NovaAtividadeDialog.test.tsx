import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NovaAtividadeDialog from "./NovaAtividadeDialog";

const authState = {
  user: { id: "u1" } as { id: string } | null,
  activeUnidade: { role: "vendedor", unidade: { id: 1 } } as { role: string; unidade: { id: number } } | null,
};
const mockCriar = vi.fn(() => Promise.resolve("g1"));
const mockToast = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/use-toast", () => ({ toast: (...a: unknown[]) => mockToast(...a) }));
vi.mock("@/hooks/useClientes", () => ({ useClientes: () => ({ data: { pages: [[]] }, isFetching: false }) }));
vi.mock("@/hooks/useVendedores", () => ({ useVendedores: () => ({ data: [{ id: "u2", nome: "Outro" }] }) }));
vi.mock("@/hooks/useTiposAtividade", () => ({
  useTiposAtividade: () => ({
    data: [
      { id: "t-cas", slug: "casamento", nome: "Casamento", exige_cliente: true, ativo: true, ordem: 1 },
      { id: "t-lem", slug: "lembrete", nome: "Lembrete", exige_cliente: false, ativo: true, ordem: 5 },
    ],
  }),
}));
vi.mock("@/hooks/useAtividades", () => ({
  useCriarAtividade: () => ({ mutateAsync: mockCriar, isPending: false }),
}));

beforeEach(() => {
  mockCriar.mockClear();
  mockToast.mockClear();
  authState.activeUnidade = { role: "vendedor", unidade: { id: 1 } };
});

describe("NovaAtividadeDialog", () => {
  it("vendedor NÃO vê o seletor de responsável", () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    expect(screen.queryByLabelText("Responsável")).not.toBeInTheDocument();
  });

  it("gestor VÊ o seletor de responsável", () => {
    authState.activeUnidade = { role: "gestor", unidade: { id: 1 } };
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    expect(screen.getByLabelText("Responsável")).toBeInTheDocument();
  });

  it("sem tipo selecionado, não cria e avisa", async () => {
    render(<NovaAtividadeDialog open onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(mockCriar).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });
});
