Sim, análise completa dos 4 MDs (INSTRUCOES_LOVABLE-5, PARTE_10, PARTE_11, PROMPT_BACKEND) confrontada com o código atual. Abaixo o plano para fechar 100% da spec.

## Estado atual
8 rotas base + design system + tipos + mock API prontos. Falta a "camada viva" (SSE/realtime, drag&drop, login browser), features avançadas (backups, smart schedule, IA tom visual) e a PARTE 10 inteira (sharing + multi-agência).

## Fase 1 — Realtime & UX viva
- Hook `useSSE` conectando em `/api/events` (fallback silencioso no modo mock).
- Sino de notificações no header com drawer de histórico.
- Status bar pulsante no dashboard (scheduler live).
- `ConfirmDialog` global via hook (substitui `confirm()` nativo).
- Skeletons e Empty states padronizados.
- Sidebar drawer para mobile (< 768px).
- Polling padronizado: dashboard 30s, posts 15s, meta 60s.

## Fase 2 — Fluxo Instagram completo
- Modal "Login via Browser" com polling e estados `browser_login` / `2fa_pending` / `checkpoint`.
- Enriquecer badges e ações da lista de contas em `/settings`.

## Fase 3 — Editor e agenda inteligentes
- Seletor visual de tom (cards com emoji) no `/schedule` e `/bulk`.
- Smart Schedule: chamar `/api/schedule/suggest` e mostrar horários sugeridos como chips clicáveis.
- Drag & drop em `/bulk` (reordenar itens) e `/calendar` (mover post entre dias) chamando `/api/posts/:id/reschedule`.

## Fase 4 — Dashboards completos
- `/` — Hero Strip (5 mini-cards), Bento Grid (8 ações rápidas), tabela "Próximos Posts", coluna Atividade + Notificações conforme spec.
- `/meta-dashboard` — completar para 10 KPIs, adicionar bloco "Relatório Semanal com IA" (`/api/meta-ads/report/weekly`).
- Página/seção de Backups em `/settings` (listar, criar, restaurar).

## Fase 5 — PARTE 10 (Sharing + Multi-Agência)
- Tipos novos: `SharedLink`, `Organization`, `ClientDashboardData`.
- 14 endpoints em `api.ts` + mocks.
- `/shared-links-manager` — CRUD, gerar token, copiar URL, senha, expiração, contador de views, ativar/desativar.
- `/organizacoes` — CRUD agências + trocar agência ativa (Context global no root).
- `/client/:token` — dashboard público read-only (sem sidebar), com header gradient, KPIs, campanhas, timeseries.
- Novos itens na sidebar em grupo "Agência".

## Detalhes técnicos
- Tudo continua front-only, com mocks realistas; ativa backend real via `VITE_API_URL`.
- SSE usa `EventSource` nativo, encapsulado em hook com reconexão e no-op quando mock.
- Drag & drop com `@dnd-kit/core` (leve, acessível).
- Context de agência ativa persistido em `localStorage` e enviado como header `X-Org-Id` pelo `api.ts`.
- Rota pública `/client/$token` fica fora do layout com sidebar (usa layout próprio).

## Fora de escopo
Backend Flask, integrações reais Meta/OpenAI/Playwright — permanecem para o Claude Code no handoff.
