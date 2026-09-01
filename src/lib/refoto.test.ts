import { describe, it, expect } from "vitest";
import { papelDaRefoto, diferencasDaRefoto } from "./refoto";

/**
 * O que estes testes protegem é o motivo da comparação existir: o vendedor não
 * pode corrigir ficha lançada, então a única coisa que ele leva da tela é a
 * informação do que está diferente. Comparação frouxa aqui gera dois estragos
 * opostos: acusar diferença que não existe (e mandar a gestão caçar fantasma) ou
 * esconder a diferença real (e o caso 0748 de 31/08 se repete em silêncio).
 */
describe("papelDaRefoto", () => {
  it("sem linha, devolve null", () => {
    expect(papelDaRefoto(null)).toBeNull();
    expect(papelDaRefoto(undefined)).toBeNull();
  });

  it("pega só os campos comparados, e normaliza ausente para null", () => {
    const p = papelDaRefoto({ valor: 800, data_festa: "2026-09-05", nome_cliente: "X" });
    expect(p).toEqual({
      valor: 800,
      garantia: null,
      data_festa: "2026-09-05",
      data_retirada: null,
      data_devolucao: null,
    });
    // nome não entra: comparar nome geraria ruído (o OCR varia a grafia).
    expect(p).not.toHaveProperty("nome_cliente");
  });
});

describe("diferencasDaRefoto", () => {
  it("sem papel ou sem ficha, não acusa nada", () => {
    expect(diferencasDaRefoto(null, { valor: 300 })).toEqual([]);
    expect(diferencasDaRefoto({ valor: 800 }, null)).toEqual([]);
  });

  // O caso real de 31/08: mesma ficha, valor subiu de 300 para 800.
  it("acusa o valor diferente, formatado em real", () => {
    const d = diferencasDaRefoto({ valor: 800 }, { valor: 300 });
    expect(d).toHaveLength(1);
    expect(d[0].rotulo).toBe("Valor");
    expect(d[0].noPapel).toContain("800");
    expect(d[0].naFicha).toContain("300");
  });

  it("valor igual não vira diferença, mesmo com tipo diferente", () => {
    // O banco devolve numeric como number ou string dependendo do caminho.
    expect(diferencasDaRefoto({ valor: 300 }, { valor: "300.00" })).toEqual([]);
    expect(diferencasDaRefoto({ valor: "300.00" }, { valor: 300 })).toEqual([]);
  });

  /**
   * Esta é a regra que evita o falso positivo em massa: campo que o OCR NÃO
   * conseguiu ler chega null, e null não é "está em branco no papel", é "não
   * sei". Tratar como diferença acusaria quase toda refoto.
   */
  it("campo que o OCR não leu é ignorado, não vira diferença", () => {
    expect(diferencasDaRefoto({ valor: null, garantia: null }, { valor: 300, garantia: 50 })).toEqual([]);
    expect(diferencasDaRefoto({ valor: "" }, { valor: 300 })).toEqual([]);
  });

  it("data compara só o dia, ignorando o que vier depois", () => {
    // A ficha guarda date puro, mas o mesmo campo já chegou como timestamp.
    expect(diferencasDaRefoto({ data_festa: "2026-09-05" }, { data_festa: "2026-09-05T00:00:00Z" })).toEqual([]);
  });

  it("data diferente sai como dd/mm", () => {
    const d = diferencasDaRefoto({ data_festa: "2026-09-05" }, { data_festa: "2026-10-10" });
    expect(d).toHaveLength(1);
    expect(d[0].noPapel).toBe("05/09");
    expect(d[0].naFicha).toBe("10/10");
  });

  it("ficha sem o campo aparece como 'em branco', e não some", () => {
    const d = diferencasDaRefoto({ garantia: 50 }, { garantia: null });
    expect(d).toHaveLength(1);
    expect(d[0].naFicha).toBe("em branco");
  });

  it("acusa vários campos de uma vez, na ordem declarada", () => {
    const d = diferencasDaRefoto(
      { valor: 800, garantia: 100, data_festa: "2026-09-05" },
      { valor: 300, garantia: 50, data_festa: "2026-09-05" },
    );
    expect(d.map(x => x.rotulo)).toEqual(["Valor", "Garantia"]);
  });
});
