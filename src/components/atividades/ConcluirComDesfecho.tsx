import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { hojeISO, somaDiasISO } from "@/lib/atividades";
import { useVendedoresAtribuiveis } from "@/hooks/useVendedoresAtribuiveis";
import HoraSelect from "@/components/atividades/HoraSelect";

/**
 * Conclusão de atividade do funil. O desfecho escolhido decide quais campos
 * aparecem, e os valores viram o payload que a RPC usa para datar as atividades
 * da etapa seguinte — e, na atribuição, para definir vendedor e tipo.
 *
 * Desfecho com destino "ficha" não conclui nada: é atalho para o lançamento da
 * ficha, porque ganhar depende da ficha existir. Se o vendedor desistir no meio,
 * a atividade continua aberta e o card não se move.
 */
export type AtalhoData = "agora" | "hoje" | "amanha" | "definir";

export interface Desfecho {
  slug: string;
  rotulo: string;
  /** manter = conclui a atividade sem tocar no card (ex.: cliente confirmou). */
  destino: { tipo: "etapa" | "repetir" | "perdida" | "ficha" | "manter"; etapa?: number };
  campos?: string[];
  tipos?: string[];
  atalhos_data?: AtalhoData[];
}

const ATALHO_LABEL: Record<AtalhoData, string> = {
  agora: "Agora",
  hoje: "Hoje",
  amanha: "Amanhã",
  definir: "Escolher data",
};

const CAMPO_DATA_LABEL: Record<string, string> = {
  data: "Quando",
  data_atendimento: "Data do atendimento",
  data_evento: "Data da festa",
};

function dataDoAtalho(a: AtalhoData): string | null {
  if (a === "agora" || a === "hoje") return hojeISO();
  if (a === "amanha") return somaDiasISO(hojeISO(), 1);
  return null;
}

interface Props {
  desfechos: Desfecho[];
  /** Tipo que o card já tem: quando presente, o formulário não pergunta de novo. */
  tipoAtual?: string | null;
  /** Unidade do card — é ela que decide quem pode receber a oportunidade. */
  unidadeId?: number | null;
  isUpdating?: boolean;
  onConcluir: (args: {
    desfecho: string;
    obs: string | null;
    payload: Record<string, string>;
  }) => void;
  onLancarFicha: () => void;
  onCancelar: () => void;
}

const ConcluirComDesfecho = ({
  desfechos, tipoAtual, unidadeId, isUpdating, onConcluir, onLancarFicha, onCancelar,
}: Props) => {
  const [slug, setSlug] = useState<string | null>(null);
  const [obs, setObs] = useState("");
  const [datas, setDatas] = useState<Record<string, string>>({});
  const [atalhos, setAtalhos] = useState<Record<string, AtalhoData>>({});
  const [hora, setHora] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [tipo, setTipo] = useState("");

  const { data: vendedores = [] } = useVendedoresAtribuiveis(unidadeId);
  const daUnidade = vendedores.filter((v) => v.escopo === "unidade");
  const daRede = vendedores.filter((v) => v.escopo === "rede");

  const escolhido = useMemo(
    () => desfechos.find((d) => d.slug === slug) ?? null,
    [desfechos, slug],
  );
  // O tipo é perguntado só quando o card ainda não tem: quem abriu a
  // oportunidade pode já ter definido, e perguntar de novo é ruído.
  const campos = (escolhido?.campos ?? [])
    .filter((c) => c !== "tipo_negociacao" || !tipoAtual);
  const camposData = campos.filter((c) => c.startsWith("data"));
  const ehFicha = escolhido?.destino.tipo === "ficha";
  const ehPerdida = escolhido?.destino.tipo === "perdida";
  /**
   * O quadro "Próxima atividade" só aparece quando há algo a datar ou decidir
   * sobre o passo seguinte. Perda e ficha não têm próximo.
   */
  const temProximo = !ehFicha && (camposData.length > 0
    || campos.includes("vendedor") || campos.includes("tipo_negociacao"));

  // Troca de desfecho: campos limpos, com o primeiro atalho já marcado.
  useEffect(() => {
    if (!escolhido) return;
    const inicial = (escolhido.atalhos_data ?? [])[0];
    const proxAtalhos: Record<string, AtalhoData> = {};
    const proxDatas: Record<string, string> = {};
    for (const campo of (escolhido.campos ?? []).filter((c) => c.startsWith("data"))) {
      proxAtalhos[campo] = inicial ?? "definir";
      const d = inicial ? dataDoAtalho(inicial) : null;
      if (d) proxDatas[campo] = d;
    }
    setAtalhos(proxAtalhos);
    setDatas(proxDatas);
    setHora("");
  }, [escolhido]);

  const faltando = useMemo(() => {
    if (!escolhido) return "Escolha como terminou";
    if (ehFicha) return null;
    for (const campo of camposData) {
      if (campo === "data_evento") continue;
      if (!datas[campo]) return `Informe a ${CAMPO_DATA_LABEL[campo]?.toLowerCase() ?? campo}`;
    }
    if (campos.includes("hora_atendimento") && !hora) return "Informe a hora";
    if (campos.includes("vendedor") && !vendedor) return "Escolha o vendedor";
    if (campos.includes("tipo_negociacao") && !tipo) return "Escolha o tipo";
    return null;
  }, [escolhido, ehFicha, campos, camposData, datas, hora, vendedor, tipo]);

  const confirmar = () => {
    if (!escolhido || faltando) return;
    const payload: Record<string, string> = {};
    for (const campo of camposData) if (datas[campo]) payload[campo] = datas[campo];
    if (hora) payload.hora_atendimento = hora;
    if (vendedor) payload.vendedor = vendedor;
    if (tipo) payload.tipo_negociacao = tipo;
    onConcluir({ desfecho: escolhido.slug, obs: obs.trim() || null, payload });
  };

  return (
    <div className="space-y-3">
      {/* Quadro 1 — o que já aconteceu. */}
      <section className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          O que você fez?
        </p>
        <div className="grid gap-1.5">
          {desfechos.map((d) => (
            <Button
              key={d.slug}
              type="button"
              variant={slug === d.slug ? "default" : "outline"}
              className="justify-start h-auto py-2 text-sm text-left whitespace-normal"
              onClick={() => setSlug(d.slug)}
            >
              {d.rotulo}
            </Button>
          ))}
        </div>

        {/* No destino ficha nada é registrado aqui: o relato vai na ficha. */}
        {!ehFicha && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Descritivo{ehPerdida ? " (vira o motivo da perda)" : ""}
            </Label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="O que aconteceu?"
              rows={3}
            />
          </div>
        )}
      </section>

      {ehFicha && (
        <p className="text-xs rounded-md border border-green-600/40 bg-green-500/10 p-2.5">
          A oportunidade fecha quando a ficha existe. Isto não conclui a atividade — leva ao
          lançamento. Se você desistir no meio, nada muda.
        </p>
      )}

      {ehPerdida && (
        <p className="text-xs rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
          A oportunidade é encerrada como perdida e sai do quadro. As atividades pendentes dela
          são canceladas — não há próxima.
        </p>
      )}

      {/* Quadro 2 — o que vem depois. */}
      {escolhido && temProximo && (
        <section className="space-y-3 rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Próxima atividade
          </p>

          {camposData.map((campo) => (
            <div key={campo} className="space-y-1.5">
              <Label className="text-xs">
                {CAMPO_DATA_LABEL[campo] ?? campo}
                {campo === "data_evento" && " (opcional)"}
              </Label>
              {(escolhido.atalhos_data?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {escolhido.atalhos_data!.map((a) => (
                    <Button
                      key={a}
                      type="button"
                      size="sm"
                      variant={atalhos[campo] === a ? "default" : "outline"}
                      onClick={() => {
                        setAtalhos((s) => ({ ...s, [campo]: a }));
                        const d = dataDoAtalho(a);
                        setDatas((s) => ({ ...s, [campo]: d ?? "" }));
                      }}
                    >
                      {ATALHO_LABEL[a]}
                    </Button>
                  ))}
                </div>
              )}
              {(atalhos[campo] === "definir" || !escolhido.atalhos_data?.length) && (
                campo === "data_atendimento" ? (
                  /**
                   * Calendário, não campo de digitar: o vendedor marca o
                   * atendimento com o cliente na frente, no celular. E o
                   * desfecho "Cliente agendou um atendimento" não tem
                   * `atalhos_data` nenhum, então este era o único jeito de
                   * preencher um campo obrigatório — digitando.
                   *
                   * Só o atendimento ganha isso. A data da festa continua no
                   * input: ela costuma cair a meses daqui, e chegar lá clicando
                   * de mês em mês é pior que digitar.
                   *
                   * A data segue trafegando como string `YYYY-MM-DD`; o objeto
                   * `Date` nasce e morre aqui dentro. É a regra do cabeçalho de
                   * `lib/atividades.ts` — converter para `Date` reintroduz o
                   * fuso do navegador, que foi o bug da coluna "Hoje" às 21h.
                   */
                  <>
                    <div className="flex justify-center border border-border rounded-md">
                      <Calendar
                        mode="single"
                        selected={datas[campo] ? parseISO(datas[campo]) : undefined}
                        onSelect={(d) => {
                          if (!d) return;
                          setDatas((s) => ({ ...s, [campo]: format(d, "yyyy-MM-dd") }));
                        }}
                        // Substitui o `min` do input, e vale mais: `min` só
                        // marcava o campo como inválido, isto impede o clique.
                        disabled={{ before: parseISO(hojeISO()) }}
                        // O day-picker abre em `defaultMonth ?? hoje` — ele NÃO
                        // segue o `selected`. Sem isto, data já escolhida em
                        // outro mês reabriria o calendário no mês errado.
                        defaultMonth={datas[campo] ? parseISO(datas[campo]) : undefined}
                        initialFocus
                        locale={ptBR}
                      />
                    </div>
                    {datas[campo] && (
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(datas[campo]), "PPP", { locale: ptBR })}
                      </p>
                    )}
                  </>
                ) : (
                  <Input
                    type="date"
                    value={datas[campo] ?? ""}
                    min={hojeISO()}
                    onChange={(e) => setDatas((s) => ({ ...s, [campo]: e.target.value }))}
                  />
                )
              )}
              {/* A hora anda junto da data a que pertence — atendimento é o
                  único compromisso do funil marcado em horário. */}
              {campo === "data_atendimento" && campos.includes("hora_atendimento") && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Hora</Label>
                  <HoraSelect value={hora} onChange={setHora} />
                </div>
              )}
            </div>
          ))}

          {campos.includes("vendedor") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Quem vai atender</Label>
              <Select value={vendedor} onValueChange={setVendedor}>
                <SelectTrigger><SelectValue placeholder="Escolha o vendedor" /></SelectTrigger>
                <SelectContent>
                  {daUnidade.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Desta unidade</SelectLabel>
                      {daUnidade.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {daRede.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Gestores da rede</SelectLabel>
                      {daRede.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Só quem atende esta unidade — pode ser você mesmo.
              </p>
            </div>
          )}

          {campos.includes("tipo_negociacao") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de negociação</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "noivo", l: "Noivo" },
                  { v: "sob_medida", l: "Sob medida" },
                  { v: "avulsa", l: "Avulsa" },
                ].map((t) => (
                  <Button
                    key={t.v}
                    type="button"
                    size="sm"
                    variant={tipo === t.v ? "default" : "outline"}
                    onClick={() => setTipo(t.v)}
                  >
                    {t.l}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!!tipoAtual && (escolhido.campos ?? []).includes("tipo_negociacao") && (
            <p className="text-xs text-muted-foreground">
              Tipo já definido na abertura da oportunidade.
            </p>
          )}
        </section>
      )}

      {/* O que falta sai do rótulo do botão e vira aviso: o botão diz o que faz. */}
      {escolhido && !ehFicha && faltando && (
        <p className="text-xs text-muted-foreground">{faltando}</p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancelar} disabled={isUpdating}>
          Cancelar
        </Button>
        {ehFicha ? (
          <Button className="flex-1" onClick={onLancarFicha}>
            <FileText className="h-4 w-4 mr-2" />
            Lançar ficha
          </Button>
        ) : (
          <Button
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
            onClick={confirmar}
            disabled={!!faltando || isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Concluir
          </Button>
        )}
      </div>
    </div>
  );
};

export default ConcluirComDesfecho;
