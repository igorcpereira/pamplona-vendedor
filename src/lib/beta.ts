/**
 * Interruptor do beta do funil de Oportunidades.
 *
 * Durante o teste, só conta marcada como teste alcança as portas do funil
 * (página, botão de abrir card, aba de configuração). O gate de papel continua
 * valendo por cima: is_teste habilita, papel decide o que se faz.
 *
 * Reusa `profiles.is_teste`, que hoje também significa "dados falsos, esconder
 * dos relatórios" — decisão consciente de 21/08, para um beta curto. Se o beta
 * precisar de um vendedor REAL, isto tem que virar coluna própria: marcar
 * alguém como teste apagaria as vendas dele dos relatórios.
 *
 * No lançamento, esta função passa a devolver true (ou sai dos pontos de uso) e
 * o acesso volta a ser só por papel.
 */
export function podeVerFunil(profile: { is_teste?: boolean } | null | undefined): boolean {
  return profile?.is_teste === true;
}
