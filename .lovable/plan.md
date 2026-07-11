
# Plano — completar 100% do frontend InstaBot

## Estado atual (já pronto)
Dashboard, Posts, Schedule, Bulk, Calendar, Settings, Meta Dashboard, Meta Creatives, AI Manager, AI Chat, History, Shared Links, Organizações, Client view, Quick Share, Notifications Bell, SSE hook, Dark-only.

## Faltando (dos 6 MDs)

### Rotas novas (8)
1. `/analytics` — Heatmap de engajamento + Top posts + Growth chart
2. `/rules` — Automação if-then (metric/operator/threshold/action) com CRUD
3. `/approvals` — Fila de aprovação de posts (aprovar/rejeitar com motivo)
4. `/ab-tests` — A/B test de captions com winner automático (CTR A vs B)
5. `/inbox` — DMs + comentários unificados com sugestão IA de resposta
6. `/media-library` — Biblioteca de mídia com tags, filtros, preview, upload
7. `/audit` — Logs de auditoria (quem fez o quê)
8. `/freepik-studio` — Busca/gera imagens (Freepik + IA fallback Picsum)

### Features globais (5)
9. **Command Palette (⌘K)** — busca global em posts/campanhas/contas/rotas
10. **Toast system** já existe (sonner) → padronizar helpers em `src/lib/toast.ts`
11. **Export CSV/PDF** — helpers em `src/lib/export.ts` + botões em Posts/Meta/History
12. **Preview realista Instagram** — componente `<InstagramPreview>` (feed/reel/story/carrossel) usado em Schedule/Bulk
13. **Login via Browser modal** — estados `browser_login`, `2fa_pending`, `checkpoint` com polling em Settings

### Tipos e mocks
- Estender `src/lib/types.ts`: `CaptionABTest`, `PostApproval`, `AutomationRule`, `InboxMessage`, `MediaLibraryItem`, `FreepikImage`, `AuditLog`, `EngagementHeatmap`
- Adicionar mocks correspondentes em `src/lib/mock-data.ts`
- Adicionar endpoints (stub mock) em `src/lib/api.ts`

### Sidebar
Reorganizar em 4 grupos:
- **Workspace**: Dashboard, Posts, Agendar, Em Massa, Calendário, Aprovações, Inbox
- **IA & Automação**: AI Manager, Chat IA, Regras, A/B Tests, Histórico, Freepik
- **Anúncios**: Meta Dashboard, Criativos, Analytics
- **Sistema**: Media Library, Organizações, Shared Links, Quick Share, Auditoria, Configurações

Adicionar botão ⌘K no header/sidebar.

## Fora de escopo
PWA/service worker, push notifications, offline sync, i18n PT/EN — omitidos para manter foco no core. Podem ser feitos numa segunda rodada se quiser.

## Detalhes técnicos
- Tudo frontend, sem backend. Mocks via `src/lib/api.ts` (respeita toggle `VITE_API_URL`)
- TanStack Query com `queryOptions` + `useQuery`
- shadcn/ui existente (Card, Table, Dialog, Tabs, Badge, Button)
- Recharts para heatmap/growth
- `cmdk` (já vem com shadcn) para command palette
- `jspdf` + `papaparse` para export (adicionar deps)

## Entrega
1 wave só, todas as 8 rotas + 5 features globais + sidebar reorganizada. Ao final, atualizo o prompt do Claude Code com os novos endpoints necessários.
