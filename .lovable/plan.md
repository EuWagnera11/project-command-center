## Objetivo
Fechar 100% das specs implementando as 5 features finais do `PARTE_FINAL_MARKETING.md` (front-only, com mocks realistas seguindo o padrão atual).

## Novas rotas

### 1. `/ai-manager` — IA Campaign Manager
- Lista de campanhas Meta Ads (1 por linha) com botão **🤖 Analisar**.
- Ao analisar: card com métricas (Gasto, Impressões, Cliques, CTR) + sugestões coloridas por severity (high/info/ok).
- Regras mockadas: CTR<0.5% → novo criativo; CTR>3% → escalar budget; CPC>R$5 → refinar público; spend>R$200 low impressions → segmentação; else "saudável".
- Painel lateral **Ações Pendentes** com Aprovar / Rejeitar (com reason) / Feedback (rating 1-5 + texto).
- Tabela histórica ao final (todas as ações com status).

### 2. `/ai-chat` — Chat IA com RAG
- UI estilo WhatsApp: bolhas user/assistant, typing indicator, auto-scroll, Enter envia.
- Markdown rendering (react-markdown já no stack? senão adicionar).
- 6 suggestion chips: Contas, Campanhas, Gasto 7d, Posts, Melhor CTR, Melhorias.
- Mock: respostas baseadas em `mock-data` + skills faker; latência 800ms.
- Chip lateral mostrando "14 skills carregadas" (lista expansível com os 14 nomes de `data/skills/*.md`).

### 3. `/history` — Histórico Consolidado
- 3 colunas: Ações da IA (status colorido) · Notificações (timeline) · Posts recentes (tabela compacta).
- Filtros de período (7d/30d/tudo).

### 4. `/meta-creatives/$campaignId` — Preview de Criativos
- Header gradient da campanha.
- Cards de AdSets com border-left verde/amarelo (ativo/pausado).
- Grid de Ads aninhados: image 140×140, título+body truncados, badge status.
- Botão "voltar" para `/meta-dashboard`.

### 5. `/quick-share` — Quick Share
- Grid de contas Meta; cada card com botão **Gerar link** que cria SharedLink instantâneo e mostra URL + copy button + QR.

## Tipos & API (`src/lib/types.ts` + `api.ts` + `mock-data.ts`)
Adicionar:
- `AIAction { id, type, campaign_id, description, severity, status: pending|approved|rejected|executed, created_at, feedback? }`
- `AIAnalysis { campaign_id, metrics, suggestions: {severity, title, body}[] }`
- `ChatMessage { role, content, ts }`
- `MediaInfo { post_id, url, type, size }`
- `AdSetWithAds { adset, ads: Ad[] }` / `Ad { id, name, title, body, image_url, status }`
- Endpoints mockados: `analyzeCampaign`, `aiActions`, `approveAction`, `rejectAction`, `feedbackAction`, `aiChat`, `getHistory`, `postMedia`, `campaignAdsetsWithAds`.

## Sidebar
Novo grupo **IA & Automação**:
- 🤖 IA Manager → `/ai-manager`
- 💬 Chat IA → `/ai-chat`
- 📜 Histórico → `/history`
- 🎨 Criativos → `/meta-creatives` (redireciona para primeira campanha, ou lista)
- ⚡ Quick Share → `/quick-share`

## Dependências
- Adicionar `react-markdown` (para Chat IA) e `qrcode.react` (para Quick Share) via `bun add`.

## Detalhes técnicos
- Todas rotas seguem TanStack file-based routing com `head()` próprio, `errorComponent`, `notFoundComponent`.
- Usar `useSuspenseQuery` + `queryOptions` no padrão já estabelecido.
- Cards, tabelas e badges reutilizam shadcn existentes.
- Segue tema dark-first já configurado; sem hardcoded colors.

## Fora de escopo
- Backend real (permanece Flask no Claude Code).
- Persistência real de feedback/ações (só mock em memória com estado React Query).
