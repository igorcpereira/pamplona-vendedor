import { describe, it, expect } from "vitest";
import { addDays, format } from "date-fns";
import {
  statusVisivel,
  clienteObrigatorio,
  podeCriarParaOutro,
  podeReatribuir,
  podeVerEquipe,
  responsavelEfetivo,
  podeAcessarAtividades,
  grupoDaData,
  validarNovaAtividade,
  semErros,
  UNIDADE_PILOTO_MARINGA,
} from "./atividades";

const SELF = "00000000-0000-0000-0000-00000000aaaa";
const OUTRO = "00000000-0000-0000-0000-00000000bbbb";
const HOJE = "2026-07-24";
const ONTEM = "2026-07-23";
const AMANHA = "2026-07-25";

describe("statusVisivel (deriva 'atrasada')", () => {
  it("a_fazer com data de ontem → atrasada", () => {
    expect(statusVisivel("a_fazer", ONTEM, HOJE)).toBe("atrasada");
  });
  it("a_fazer com data de hoje → a_fazer", () => {
    expect(statusVisivel("a_fazer", HOJE, HOJE)).toBe("a_fazer");
  });
  it("a_fazer com data de amanhã → a_fazer", () => {
    expect(statusVisivel("a_fazer", AMANHA, HOJE)).toBe("a_fazer");
  });
  it("concluída com data passada → concluída (nunca atrasada)", () => {
    expect(statusVisivel("concluida", ONTEM, HOJE)).toBe("concluida");
  });
  it("cancelada → cancelada", () => {
    expect(statusVisivel("cancelada", ONTEM, HOJE)).toBe("cancelada");
  });
});

describe("clienteObrigatorio", () => {
  it("lembrete → false", () => {
    expect(clienteObrigatorio({ slug: "lembrete" })).toBe(false);
  });
  it("demais tipos → true", () => {
    for (const slug of ["casamento", "sob_medida", "aluguel", "pedido_avulso"]) {
      expect(clienteObrigatorio({ slug })).toBe(true);
    }
  });
  it("honra exige_cliente vindo do banco", () => {
    expect(clienteObrigatorio({ slug: "lembrete", exige_cliente: true })).toBe(true);
    expect(clienteObrigatorio({ slug: "aluguel", exige_cliente: false })).toBe(false);
  });
  it("tipo nulo → false", () => {
    expect(clienteObrigatorio(null)).toBe(false);
  });
});

describe("permissões por cargo", () => {
  it("gestor/admin/master podem criar p/ outro, reatribuir e ver equipe", () => {
    for (const role of ["gestor", "admin", "master"]) {
      expect(podeCriarParaOutro(role)).toBe(true);
      expect(podeReatribuir(role)).toBe(true);
      expect(podeVerEquipe(role)).toBe(true);
    }
  });
  it("vendedor/franqueado/administrativo não podem", () => {
    for (const role of ["vendedor", "franqueado", "administrativo"]) {
      expect(podeCriarParaOutro(role)).toBe(false);
      expect(podeReatribuir(role)).toBe(false);
      expect(podeVerEquipe(role)).toBe(false);
    }
  });
});

describe("responsavelEfetivo", () => {
  it("cargo global com escolhido → usa o escolhido", () => {
    expect(responsavelEfetivo("gestor", SELF, OUTRO)).toBe(OUTRO);
  });
  it("cargo global sem escolhido → self", () => {
    expect(responsavelEfetivo("gestor", SELF, null)).toBe(SELF);
  });
  it("vendedor tentando escolher outro → FORÇA self", () => {
    expect(responsavelEfetivo("vendedor", SELF, OUTRO)).toBe(SELF);
  });
});

describe("podeAcessarAtividades (gating do piloto)", () => {
  it("vendedor de Maringá → true", () => {
    expect(podeAcessarAtividades({ role: "vendedor", unidadeId: UNIDADE_PILOTO_MARINGA })).toBe(true);
  });
  it("vendedor de outra unidade → false", () => {
    expect(podeAcessarAtividades({ role: "vendedor", unidadeId: 99 })).toBe(false);
  });
  it("franqueado/administrativo de outra unidade → false", () => {
    expect(podeAcessarAtividades({ role: "franqueado", unidadeId: 99 })).toBe(false);
    expect(podeAcessarAtividades({ role: "administrativo", unidadeId: 99 })).toBe(false);
  });
  it("cargos globais → sempre true, mesmo fora de Maringá", () => {
    for (const role of ["gestor", "admin", "master"]) {
      expect(podeAcessarAtividades({ role, unidadeId: 99 })).toBe(true);
    }
  });
});

describe("grupoDaData", () => {
  it("ontem → Atrasadas", () => {
    expect(grupoDaData(ONTEM, HOJE)).toBe("Atrasadas");
  });
  it("hoje → Hoje", () => {
    expect(grupoDaData(HOJE, HOJE)).toBe("Hoje");
  });
  it("amanhã → Amanhã", () => {
    expect(grupoDaData(AMANHA, HOJE)).toBe("Amanhã");
  });
  it("dentro da mesma semana (Seg–Dom) → Esta semana", () => {
    const seg = "2026-07-20"; // segunda-feira
    const qui = "2026-07-23"; // mesma semana, +3
    expect(grupoDaData(qui, seg)).toBe("Esta semana");
  });
  it("depois do fim da semana → Mais tarde", () => {
    const seg = "2026-07-20";
    const proxSeg = format(addDays(new Date(2026, 6, 20), 7), "yyyy-MM-dd"); // +7 = próxima semana
    expect(grupoDaData(proxSeg, seg)).toBe("Mais tarde");
  });
  it("+30 dias → Mais tarde", () => {
    const daqui30 = format(addDays(new Date(2026, 6, 24), 30), "yyyy-MM-dd");
    expect(grupoDaData(daqui30, HOJE)).toBe("Mais tarde");
  });
});

describe("validarNovaAtividade", () => {
  const tipoCasamento = { slug: "casamento" };
  const tipoLembrete = { slug: "lembrete" };

  it("caso feliz (tipo com cliente) → sem erros", () => {
    const erros = validarNovaAtividade({
      tipo: tipoCasamento,
      data: HOJE,
      clienteId: "c1",
      responsavelId: SELF,
    });
    expect(semErros(erros)).toBe(true);
  });
  it("lembrete sem cliente → sem erros", () => {
    const erros = validarNovaAtividade({ tipo: tipoLembrete, data: HOJE, responsavelId: SELF });
    expect(semErros(erros)).toBe(true);
  });
  it("tipo ≠ lembrete sem cliente → erro de cliente", () => {
    const erros = validarNovaAtividade({ tipo: tipoCasamento, data: HOJE, responsavelId: SELF });
    expect(erros.cliente).toBeTruthy();
  });
  it("sem tipo → erro de tipo", () => {
    const erros = validarNovaAtividade({ data: HOJE, responsavelId: SELF });
    expect(erros.tipo).toBeTruthy();
  });
  it("sem data → erro de data", () => {
    const erros = validarNovaAtividade({ tipo: tipoLembrete, responsavelId: SELF });
    expect(erros.data).toBeTruthy();
  });
  it("sem responsável → erro de responsável", () => {
    const erros = validarNovaAtividade({ tipo: tipoLembrete, data: HOJE });
    expect(erros.responsavel).toBeTruthy();
  });
});
