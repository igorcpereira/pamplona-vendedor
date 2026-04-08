# Fluxos — App Mobile Pamplona Alfaiataria

> Este documento descreve as jornadas completas do vendedor — o que ele vê, o que o sistema faz em cada etapa e como as peças se conectam. Para os detalhes de cada edge function, consulte as specs em `docs/`.

---

## Índice

1. [Criação de ficha](#1-criação-de-ficha)
2. [Reprocessamento de ficha com erro](#2-reprocessamento-de-ficha-com-erro)
3. Busca e visualização de clientes — a documentar

> **Notificação WhatsApp** está documentada como parte do Fluxo 1 (etapa final da criação de ficha) e na `docs/specs/spec_notificar-ficha-whatsapp.md`. Não possui fluxo separado.

---

## 1. Criação de ficha

### Ator e gatilho

**Ator:** Vendedor  
**Gatilho:** Vendedor finaliza o atendimento e captura a foto da ficha manuscrita

---

### Diagrama sequencial

```
Vendedor      Front             processar-v2      Banco         OpenAI
   |             |                   |               |              |
   |--foto-->    |                   |               |              |
   |          valida                 |               |              |
   |          (formato,              |               |              |
   |           tamanho)              |               |              |
   |          preview                |               |              |
   |          confirma               |               |              |
   |             |-----FormData----> |               |              |
   |             |                   |---INSERT-----> |              |
   |             |                   | (status:       |              |
   |             |                   |  pendente)     |              |
   |             |<----ficha_id----- |               |              |
   |          redireciona            |               |              |
   |          (tela da ficha,        |               |              |
   |           campos OCR            |               |              |
   |           desativados,          |               |              |
   |           aviso: carregando)    |               |              |
   |             |            [background]           |              |
   |             |                   |---upload-----> |              |
   |             |                   |---base64---------------------->|
   |             |                   |<---JSON-----------------------|
   |             |                   |---SELECT-----> |              |
   |             |                   | (busca cliente |              |
   |             |                   |  por telefone) |              |
   |             |                   |<--resultado--- |              |
   |             |                   |---UPDATE-----> |              |
   |             |                   | (dados OCR +   |              |
   |             |                   |  ocr_tentativa |              |
   |             |                   |  cliente_      |              |
   |             |                   |  encontrado,   |              |
   |             |                   |  sugerido_id,  |              |
   |             |                   |  sugerido_nome)|              |
   |          (realtime)             |               |              |
   |          campos OCR             |               |              |
   |          preenchidos e          |               |              |
   |          ativados               |               |              |
   |          confirmação            |               |              |
   |          de cliente             |               |              |
   |          exibida                |               |              |
```

**Retry (se Tentativa 1 falhar):**
```
   |             |                   |               |              |
   |             |                   |---UPDATE-----> |              |
   |             |                   | (ocr_tentativa:|              |
   |             |                   |  2)            |              |
   |          (realtime)             |               |              |
   |          aviso muda:            |               |              |
   |          "estamos tentando      |               |              |
   |           novamente,            |               |              |
   |           aguarde..."           |               |              |
   |             |                   |---base64---------------------->|
   |             |                   |<---JSON-----------------------|
   |             |                   |---UPDATE-----> |              |
   |             |                   |               |              |
   |   [se Tentativa 2 falhar]       |               |              |
   |             |                   |---UPDATE-----> |              |
   |             |                   | (status: erro) |              |
   |          (realtime)             |               |              |
   |          tela de erro:          |               |              |
   |          "nova foto" ou         |               |              |
   |          "preencher             |               |              |
   |           manualmente"          |               |              |
```

**Após OCR concluir:**
```
Vendedor      Front             transcrever-audio    Banco    salvar-ficha   criar-cliente   notificar-wpp
   |             |                   |               |              |               |              |
   |          campos OCR             |               |              |               |              |
   |          preenchidos e          |               |              |               |              |
   |          ativados               |               |              |               |              |
   |          vendedor               |               |              |               |              |
   |          revisa e               |               |              |               |              |
   |          corrige                |               |              |               |              |
   |             |                   |               |              |               |              |
   | (opcional)  |                   |               |              |               |              |
   |--grava----> |                   |               |              |               |              |
   |   áudio     |-----FormData----> |               |              |               |              |
   |             |                   |---upload-----> |              |               |              |
   |             |                   |---Whisper--+  |              |               |              |
   |             |                   |---AI tags--+  |              |               |              |
   |             |                   |---UPDATE-----> |              |               |              |
   |             |<---{text,tags}--- |               |              |               |              |
   |          preenche               |               |              |               |              |
   |          descricao e            |               |              |               |              |
   |          seleciona tags         |               |              |               |              |
   |             |                   |               |              |               |              |
   |--confirma-->|                   |               |              |               |              |
   |             |-----JSON------------------------->|              |               |              |
   |             |                   |               |              |               |              |
   |             |                   |               | (cliente_id  |               |              |
   |             |                   |               |  ausente?)   |               |              |
   |             |                   |               |              |----INSERT----> |              |
   |             |                   |               |              | (ou SELECT     |              |
   |             |                   |               |              |  se duplicata) |              |
   |             |                   |               |              |<--cliente_id-- |              |
   |             |                   |               |<--UPDATE-----|               |              |
   |             |                   |               | (status:ativa|               |              |
   |             |                   |               |  cliente_id) |               |              |
   |             |                   |               |<--INSERT-----|               |              |
   |             |                   |               | (tags)       |               |              |
   |             |                   |               |              |-------------->|              |
   |             |                   |               |              |               |--Evolution-->|
   |             |                   |               |<-------------|               |              |
   |             |                   |               | (enviada_    |               |              |
   |             |                   |               |  whatsapp)   |               |              |
   |             |<----{ficha_id,----|               |              |               |              |
   |             |     cliente_id}   |               |              |               |              |
   |          tela de                |               |              |               |              |
   |          ficha salva            |               |              |               |              |
```

---

### Estados da ficha

```
[foto tirada]
      ↓
  pendente  ←── OCR em background
      ↓
   ativa    ←── vendedor confirma via salvar-ficha
      ↓
   baixa    ←── ciclo encerrado (fora do escopo deste fluxo)
```

| Status | O que o vendedor vê |
|---|---|
| `pendente` | Tela da ficha com campos OCR desativados e aviso "carregando" |
| `pendente` (retry) | Aviso muda para "estamos tentando novamente, por favor aguarde..." |
| `ativa` | Tela da ficha salva — campos editáveis, sem aviso |

---

### Pontos de decisão

**Cliente novo vs. existente:**
```
processar-ficha-v2 (Etapa 6) busca cliente por telefone no banco
  → resultado chega ao front via Supabase Realtime junto com os dados do OCR
    → encontrado → front exibe confirmação ao vendedor:
        "Encontramos [Nome]. É ele?"
          → Sim → usa cliente_id existente
          → Não → vendedor corrige nome/telefone → cria novo cliente ao salvar
    → não encontrado → front exibe dados do OCR para confirmação
    → telefone nulo no OCR → vendedor preenche manualmente
```

**Tipo de ficha (impacta roteamento WhatsApp):**
```
tipo = venda   → notifica GRUPO_GERAL + GRUPO_VENDA
tipo = aluguel → notifica GRUPO_GERAL
tipo = ajuste  → notifica GRUPO_GERAL
```

**Áudio (opcional):**
```
vendedor grava áudio
  → transcrever-audio salva url_audio e atualiza transcricao_audio na ficha
  → tags sugeridas aparecem para o vendedor selecionar
vendedor não grava
  → transcricao_audio fica vazio
  → vendedor pode preencher descricao_cliente manualmente (campo de texto livre)
```

---

### Campos obrigatórios para salvar

O front bloqueia o botão de salvar enquanto os seguintes campos estiverem vazios:

| Campo | Origem |
|---|---|
| `numero_ficha` | OCR ou manual |
| `nome_cliente` | OCR ou manual |
| `telefone_cliente` | OCR ou manual |
| `tipo` | OCR ou manual |

---

### Caminhos de erro

| Etapa | Erro | O que o vendedor vê | O que o sistema faz |
|---|---|---|---|
| Validação do input | Imagem ausente | Botão desabilitado | Front bloqueia envio |
| Validação do input | Formato inválido | Alerta na seleção do arquivo | Front bloqueia envio |
| Validação do input | Arquivo > 15MB | Alerta na seleção do arquivo | Front bloqueia envio |
| Criação da ficha | Falha no banco | Mensagem de erro genérica | HTTP 500 — não redireciona |
| OCR (tentativa 1) | Timeout/falha | Aviso muda para "tentando novamente..." | `ocr_tentativa: 2` no banco via realtime |
| OCR (tentativa 2) | Timeout/falha | Tela de erro — opções: nova foto ou preencher manualmente | `status: erro` no banco |
| Criação do cliente | Falha no banco | Mensagem de erro — salvamento abortado | HTTP 500 |
| Salvar tags | Falha | Ficha salva normalmente | Tags ficam pendentes — podem ser adicionadas depois |
| WhatsApp | Falha no envio | Ícone de aviso na ficha — botão de reenvio disponível | `enviada_whatsapp_geral/venda: false` |

---

### Estado final (sucesso)

**No banco:**

| Campo | Valor |
|---|---|
| `status` | `ativa` |
| `cliente_id` | UUID do cliente vinculado |
| `vendedor_id` | UUID do vendedor |
| `url_bucket` | Path relativo da imagem |
| `url_audio` | Path relativo do áudio (se gravado) |
| `transcricao_audio` | Texto transcrito (se gravado) |
| `enviada_whatsapp_geral` | `true` |
| `enviada_whatsapp_venda` | `true` (apenas fichas de venda) |
| Campos do OCR | Conforme revisado e corrigido pelo vendedor |

**Na tela:**
- Ficha exibida com todos os dados preenchidos
- Sem aviso de carregando ou erro
- Botão de reenvio WhatsApp visível (para reenvio manual se necessário)

---

## 2. Reprocessamento de ficha com erro

### Ator e gatilho

**Ator:** Vendedor  
**Gatilho:** Vendedor abre uma ficha com `status: erro` — OCR falhou nas duas tentativas

---

### Diagrama sequencial

**Opção A — Nova foto:**

> ⚠️ **Mudança de contrato planejada:** A `processar-ficha-v2` hoje sempre cria uma ficha nova via INSERT. Para o reprocessamento funcionar com o mesmo `ficha_id`, a função precisará aceitar `ficha_id` como parâmetro opcional e fazer UPDATE ao invés de INSERT quando ele for fornecido. Essa alteração precisa ser incorporada à `spec_processar-ficha-v2.md` antes da implementação.

```
Vendedor      Front             processar-v2      Banco
   |             |                   |               |
   |  abre       |                   |               |
   |  ficha      |                   |               |
   |  (erro)     |                   |               |
   |          exibe aviso            |               |
   |          de erro +              |               |
   |          botão "nova foto"      |               |
   |             |                   |               |
   |--nova-----  |                   |               |
   |  foto-->    |                   |               |
   |          valida                 |               |
   |          preview                |               |
   |          confirma               |               |
   |             |-----FormData----> |               |
   |             |   (mesmo ficha_id)|               |
   |             |                   |---UPDATE-----> |
   |             |                   | (status:       |
   |             |                   |  pendente)     |
   |             |<----ficha_id----- |               |
   |          campos OCR             |               |
   |          desativados,           |               |
   |          aviso: carregando      |               |
   |             |            [background]           |
   |             |                   | (mesmo fluxo  |
   |             |                   |  do OCR)      |
```

**Opção B — Preencher manualmente:**
```
Vendedor      Front             salvar-ficha      Banco
   |             |                   |               |
   |  abre       |                   |               |
   |  ficha      |                   |               |
   |  (erro)     |                   |               |
   |          exibe aviso            |               |
   |          de erro +              |               |
   |          campos editáveis       |               |
   |          botão "preencher       |               |
   |          manualmente"           |               |
   |             |                   |               |
   |--preenche-->|                   |               |
   |  campos     |                   |               |
   |--confirma-->|                   |               |
   |             |-----JSON--------> |               |
   |             |                   |---UPDATE-----> |
   |             |                   | (status: ativa)|
   |             |<----{ficha_id,--- |               |
   |             |     cliente_id}   |               |
   |          tela de                |               |
   |          ficha salva            |               |
```

---

### Estados da ficha

```
  erro
    ↓ (nova foto ou manual)
  pendente  ←── apenas se nova foto
    ↓
   ativa
```

| Status | O que o vendedor vê |
|---|---|
| `erro` | Aviso de erro + botão "tirar nova foto" + opção "preencher manualmente" |
| `pendente` | Campos OCR desativados, aviso "carregando" (apenas se nova foto) |
| `ativa` | Ficha salva normalmente |

---

### Pontos de decisão

```
Vendedor abre ficha com erro
  → Nova foto
      → mesmo fluxo do OCR (processar-ficha-v2 com ficha_id existente)
      → dados anteriores sobrescritos pelo novo OCR
  → Preencher manualmente
      → campos todos editáveis
      → fluxo direto para salvar-ficha
      → sem processamento OCR
```

---

### Caminhos de erro

| Etapa | Erro | O que o vendedor vê | O que o sistema faz |
|---|---|---|---|
| Nova foto — OCR falha novamente | Timeout/falha nas 2 tentativas | Tela de erro novamente | `status: erro` mantido no banco |
| Preencher manualmente — campos obrigatórios vazios | — | Botão de salvar desabilitado | Front bloqueia envio |

---

### Estado final (sucesso)

Idêntico ao fluxo de criação — ficha com `status: ativa`, cliente vinculado, WhatsApp notificado.

> A diferença é que no reprocessamento com nova foto, os dados do OCR anterior são sobrescritos pelo novo processamento.
