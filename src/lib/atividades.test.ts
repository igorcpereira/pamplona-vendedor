import { describe, it, expect } from "vitest";
import {
  hojeISO,
  somaDiasISO,
  dataCurta,
  grupoDe,
  proximoDiaUtilISO,
  resumoCarteira,
  DATAS_RAPIDAS,
  GRUPOS,
  RECENCIA_ATALHOS,
  TIPOS_CLIENTE,
} from "./atividades";

const HOJE = "2026-07-28"; // terça-feira

describe("somaDiasISO (aritmética sem fuso)", () => {
  it("soma dias simples", () => {
    expect(somaDiasISO(HOJE, 1)).toBe("2026-07-29");
  });
  it("vira o mês", () => {
    expect(somaDiasISO(HOJE, 6)).toBe("2026-08-03");
  });
  it("vira o ano", () => {
    expect(somaDiasISO("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("subtrai", () => {
    expect(somaDiasISO("2026-08-01", -1)).toBe("2026-07-31");
  });
});

describe("proximoDiaUtilISO (sábado é dia útil; domingo → segunda)", () => {
  it("sábado fica sábado", () => {
    expect(proximoDiaUtilISO("2026-08-01")).toBe("2026-08-01"); // sáb
  });
  it("domingo rola para segunda", () => {
    expect(proximoDiaUtilISO("2026-08-02")).toBe("2026-08-03"); // dom → seg
  });
  it("dia de semana fica igual", () => {
    expect(proximoDiaUtilISO("2026-07-28")).toBe("2026-07-28"); // ter
  });
});

describe("DATAS_RAPIDAS resolvidas a partir de uma terça", () => {
  it("nenhum preset cai em domingo", () => {
    for (const a of DATAS_RAPIDAS) {
      const iso = proximoDiaUtilISO(somaDiasISO(HOJE, a.dias));
      const [ano, m, d] = iso.split("-").map(Number);
      expect(new Date(Date.UTC(ano, m - 1, d)).getUTCDay()).not.toBe(0);
    }
  });
  it("sábado + 1 dia (amanhã) rola para segunda", () => {
    // sábado 2026-08-01 + 1 = domingo → segunda 03/08
    expect(proximoDiaUtilISO(somaDiasISO("2026-08-01", 1))).toBe("2026-08-03");
  });
});

describe("grupoDe (usa status_visivel do servidor + datas ISO)", () => {
  const base = { status_visivel: "a_fazer" as const };
  it("atrasada vem do servidor, não da data", () => {
    expect(grupoDe({ data: "2099-01-01", status_visivel: "atrasada" }, HOJE)).toBe("Atrasadas");
  });
  it("hoje", () => {
    expect(grupoDe({ ...base, data: HOJE }, HOJE)).toBe("Hoje");
  });
  it("amanhã", () => {
    expect(grupoDe({ ...base, data: "2026-07-29" }, HOJE)).toBe("Amanhã");
  });
  it("dentro de 7 dias → Esta semana", () => {
    expect(grupoDe({ ...base, data: "2026-08-04" }, HOJE)).toBe("Esta semana");
  });
  it("além de 7 dias → Mais tarde", () => {
    expect(grupoDe({ ...base, data: "2026-08-05" }, HOJE)).toBe("Mais tarde");
  });
  it("GRUPOS cobre os 5 rótulos na ordem da tela", () => {
    expect(GRUPOS).toEqual(["Atrasadas", "Hoje", "Amanhã", "Esta semana", "Mais tarde"]);
  });
});

describe("formatação", () => {
  it("dataCurta", () => {
    expect(dataCurta("2026-07-28")).toBe("28/07");
  });
  it("hojeISO devolve YYYY-MM-DD", () => {
    expect(hojeISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("resumoCarteira (descrição automática do lote da carteira)", () => {
  it("sem filtro nenhum", () => {
    expect(resumoCarteira({}, [])).toBe("Minha carteira: todos os meus clientes");
  });
  it("tipos + tags + recência de atendimento", () => {
    expect(
      resumoCarteira(
        { tipos: ["venda", "aluguel"], recenciaCampo: "atendimento", recenciaAte: "2026-04-29" },
        ["Advogado"],
      ),
    ).toBe("Minha carteira: Venda/Aluguel · tags Advogado · sem atendimento desde 29/04");
  });
  it("recência de venda usa a palavra compra", () => {
    expect(resumoCarteira({ recenciaCampo: "venda", recenciaAte: "2026-01-10" }, [])).toBe(
      "Minha carteira: sem compra desde 10/01",
    );
  });
  it("constantes dos filtros existem e batem com o servidor", () => {
    expect(RECENCIA_ATALHOS.map((r) => r.dias)).toEqual([30, 90, 180, 365]);
    expect(TIPOS_CLIENTE.map((t) => t.key)).toEqual(["venda", "aluguel", "sob_medida", "ajuste", "avulso"]);
  });
});
