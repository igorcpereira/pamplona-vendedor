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

  it("perfis elevados editam qualquer ficha", () => {
    expect(podeEditarFicha("administrativo", A, B)).toBe(true);
    expect(podeEditarFicha("gestor", A, B)).toBe(true);
    expect(podeEditarFicha("admin", A, B)).toBe(true);
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
