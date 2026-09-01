import { describe, it, expect } from "vitest";
import { podeEditarFicha, rotuloBotaoFicha } from "./utils";

const A = "00000000-0000-0000-0000-00000000aaaa";
const B = "00000000-0000-0000-0000-00000000bbbb";

describe("podeEditarFicha (requisito a)", () => {
  it("vendedor edita a PRÓPRIA ficha", () => {
    expect(podeEditarFicha("vendedor", A, A)).toBe(true);
  });

  it("vendedor NÃO edita a ficha de outro vendedor", () => {
    expect(podeEditarFicha("vendedor", A, B)).toBe(false);
  });

  it("gestor e master editam qualquer ficha", () => {
    expect(podeEditarFicha("gestor", A, B)).toBe(true);
    expect(podeEditarFicha("master", A, B)).toBe(true);
  });

  // Decisão do Igor em 01/09/2026: administrativo não edita ficha. Antes ele
  // passava, porque a regra era denylist de "vendedor" (IGO-153).
  it("administrativo NÃO edita a ficha de outro", () => {
    expect(podeEditarFicha("administrativo", A, B)).toBe(false);
  });

  it("administrativo edita a ficha que ele mesmo lançou", () => {
    expect(podeEditarFicha("administrativo", A, A)).toBe(true);
  });

  // Papel que não existe mais não ganha passe livre: a allowlist recusa por
  // omissão, ao contrário da denylist antiga.
  it("papel desconhecido não edita ficha de outro", () => {
    expect(podeEditarFicha("admin", A, B)).toBe(false);
    expect(podeEditarFicha("franqueado", A, B)).toBe(false);
  });

  it("sem usuário logado, vendedor não edita", () => {
    expect(podeEditarFicha("vendedor", null, B)).toBe(false);
    expect(podeEditarFicha("vendedor", undefined, undefined)).toBe(false);
  });
});

describe("rotuloBotaoFicha (requisito e)", () => {
  it("primeiro salvamento (não lançada) mostra 'Lançar Ficha'", () => {
    expect(rotuloBotaoFicha(false)).toBe("Lançar Ficha");
  });

  it("do segundo em diante (já lançada) mostra 'Atualizar Ficha'", () => {
    expect(rotuloBotaoFicha(true)).toBe("Atualizar Ficha");
  });
});
