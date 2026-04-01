# Visão Geral — App Mobile Pamplona Alfaiataria

## O que é

App mobile utilizado pelos vendedores da Flavio Pamplona Alfaiataria para registrar e digitalizar fichas de atendimento em campo, acompanhar metas do período e monitorar o desempenho de comissões.

---

## O negócio por trás

A Flavio Pamplona Alfaiataria é uma referência em moda masculina de alto padrão no Paraná, com quase 50 anos de tradição. Atua com ternos sob medida, ajustes e aluguel de trajes de luxo, atendendo noivos e eventos formais nas unidades de Maringá, Londrina e Curitiba.

O atendimento segue três modalidades:

| Tipo | Descrição |
|---|---|
| **Venda** | Venda exclusiva de traje sob medida ou pronta entrega |
| **Aluguel** | Locação de trajes para festas e eventos |
| **Ajuste** | Pós-venda incluso na compra — clientes têm direito a ajustes vitalícios. Cada ajuste gera uma nova ficha independente |

Todas as fichas são enviadas para um **grupo geral de WhatsApp**. Fichas de venda também são enviadas para um **segundo grupo**, utilizado para dar baixa no estoque.

> Hoje o controle é feito inteiramente via WhatsApp. O app substitui e estrutura esse fluxo.

---

## Quem usa

Vendedores no balcão das lojas, durante atendimento consultivo e exclusivo ao cliente.

**Perfil de uso:**
- Alto conhecimento em alfaiataria, mas não necessariamente em tecnologia
- Atendimento presencial, com celular na mão
- Alguns atendimentos são agendados com hora marcada

**Implicações para o produto:**
- Interface simples e intuitiva — menos é mais
- Mobile-first em tudo
- Formulários curtos e objetivos
- Informações do cliente disponíveis antes do atendimento, para que o vendedor possa se preparar e entregar mais

---

## Relação com o pamplona-crm

O app mobile e o CRM **compartilham o mesmo banco de dados Supabase**, incluindo Edge Functions. São dois produtos distintos com públicos diferentes, mas infraestrutura comum.

| | App Mobile | CRM |
|---|---|---|
| **Público** | Vendedores | Gestão / back-office |
| **Foco** | Registro de fichas, metas, comissões | Gestão completa de clientes e operação |
| **Complexidade** | Mínima — simples e direto | Toda a complexidade fica aqui |

> ⚠️ Por compartilharem o mesmo banco, mudanças de schema, migrations e políticas de RLS impactam os dois sistemas simultaneamente. Qualquer alteração estrutural deve considerar ambos.

---

## O que o sistema NÃO faz

O app mobile tem escopo deliberadamente restrito. Tudo fora dos itens abaixo é responsabilidade do CRM.

**O app faz:**
- Registro e digitalização de fichas de atendimento
- Consulta de dados e agenda de clientes
- Consulta de agenda dos vendedores
- Acompanhamento de metas e comissões

**O app NÃO faz:**
- Gestão financeira
- Controle de estoque
- Cadastro e gestão completa de clientes
- Relatórios e dashboards gerenciais
- Configurações operacionais
- Qualquer outra função além das listadas acima

> Novas features devem ser avaliadas com critério: se adicionam complexidade de gestão, pertencem ao CRM, não ao app.

---

## Fluxo principal

```
Foto da ficha → OCR (OpenAI) → Conferência pelo vendedor → Salvar → Envio WhatsApp
```

1. Vendedor fotografa a ficha física ao final do atendimento
2. OCR via OpenAI extrai e estrutura os dados da ficha
3. Vendedor confere e corrige os dados extraídos
4. Ficha é salva no banco (Supabase)
5. Notificação enviada automaticamente para os grupos de WhatsApp correspondentes

---

## Implantação

- **Piloto:** Maringá
- **Expansão planejada:** Londrina e Curitiba
