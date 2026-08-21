import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/**
 * Horário em passos de 15 minutos (decisão de 21/08). Atendimento não se marca
 * em minuto quebrado, e lista fechada evita o "14:07" digitado sem intenção —
 * que `input type="time"` aceita em boa parte dos navegadores.
 *
 * Fora da grade: se o valor que chega não é múltiplo de 15 — compromisso marcado
 * antes desta regra — ele entra como primeira opção, para não desaparecer sozinho
 * quando alguém abrir o formulário só para trocar o dia.
 */
const PRIMEIRA_HORA = 7;
const ULTIMA_HORA = 21;

const HORARIOS: string[] = Array.from(
  { length: (ULTIMA_HORA - PRIMEIRA_HORA + 1) * 4 },
  (_, i) => {
    const h = PRIMEIRA_HORA + Math.floor(i / 4);
    const m = (i % 4) * 15;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },
);

const HoraSelect = ({ id, value, onChange }: {
  id?: string;
  /** "HH:MM" — vazio significa nenhum horário escolhido. */
  value: string;
  onChange: (valor: string) => void;
}) => {
  const opcoes = value && !HORARIOS.includes(value) ? [value, ...HORARIOS] : HORARIOS;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Escolha o horário" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {opcoes.map((h) => (
          <SelectItem key={h} value={h} className="tabular-nums">{h}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default HoraSelect;
