import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/**
 * Horário em dois campos: hora e minuto, separados.
 *
 * Era um dropdown só, com as 60 combinações de 07:00 a 21:45 numa lista
 * rolante — achar "16:45" ali é caçar. Separado são 15 opções de hora e 4 de
 * minuto, e cada lista cabe na tela.
 *
 * A grade de 15 minutos (decisão de 21/08) continua de pé: atendimento não se
 * marca em minuto quebrado, e lista fechada evita o "14:07" digitado sem
 * intenção — que `input type="time"` aceita em boa parte dos navegadores.
 *
 * Três decisões que não se leem no código:
 *
 * 1. Escolher a hora já fixa o minuto em ":00". Meia escolha não pode virar
 *    campo vazio: a tela pediria "informe a hora" com um "14" à vista, e o
 *    vendedor não teria como saber o que falta.
 * 2. O minuto fica travado enquanto não há hora, porque minuto sem hora não é
 *    horário nenhum — e um clique que não produz nada é pior que um campo
 *    apagado.
 * 3. Valor fora da grade — compromisso marcado antes desta regra, ou vindo do
 *    CRM — entra como opção extra **no campo em que destoa**, não nos dois.
 *    Assim "06:07" não some sozinho quando alguém abrir o formulário só para
 *    trocar o dia.
 *
 * O contrato com quem chama não mudou: entra e sai `"HH:MM"`, string vazia
 * quando não há horário.
 */
const PRIMEIRA_HORA = 7;
const ULTIMA_HORA = 21;
const PASSO_MINUTOS = 15;

const HORAS: string[] = Array.from(
  { length: ULTIMA_HORA - PRIMEIRA_HORA + 1 },
  (_, i) => String(PRIMEIRA_HORA + i).padStart(2, "0"),
);

const MINUTOS: string[] = Array.from(
  { length: 60 / PASSO_MINUTOS },
  (_, i) => String(i * PASSO_MINUTOS).padStart(2, "0"),
);

const HoraSelect = ({ id, value, onChange }: {
  id?: string;
  /** "HH:MM" — vazio significa nenhum horário escolhido. */
  value: string;
  onChange: (valor: string) => void;
}) => {
  // O `time` do Postgres chega como "14:30:00" em alguns caminhos; o terceiro
  // pedaço é descartado aqui e nunca volta, porque o que sai é sempre "HH:MM".
  const [hora = "", minuto = ""] = value ? value.split(":") : [];

  const horas = hora && !HORAS.includes(hora) ? [hora, ...HORAS] : HORAS;
  const minutos = minuto && !MINUTOS.includes(minuto) ? [minuto, ...MINUTOS] : MINUTOS;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={hora}
        // Trocar a hora preserva o minuto já escolhido; sem minuto ainda, ":00".
        onValueChange={(nova) => onChange(`${nova}:${minuto || "00"}`)}
      >
        <SelectTrigger id={id} aria-label="Hora" className="flex-1 tabular-nums">
          <SelectValue placeholder="Hora" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {horas.map((h) => (
            <SelectItem key={h} value={h} className="tabular-nums">{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span aria-hidden className="text-muted-foreground">:</span>

      <Select
        value={minuto}
        onValueChange={(novo) => onChange(`${hora}:${novo}`)}
        disabled={!hora}
      >
        <SelectTrigger aria-label="Minutos" className="flex-1 tabular-nums">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {minutos.map((m) => (
            <SelectItem key={m} value={m} className="tabular-nums">{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default HoraSelect;
