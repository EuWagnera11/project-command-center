# Fechar 100% dos MDs — Calendar V2

Após análise minuciosa dos 7 MDs, o único gap real é o **Calendar V2** (`INSTRUCOES_CALENDAR_V2.md`). Todo o resto já está implementado.

## O que será construído

### 1. Nova rota `/calendar-v2`
Arquivo: `src/routes/calendar-v2.tsx`

**Toolbar de filtros** (dropdowns, não abas):
- Período: hoje, ontem, 7d, 15d, 30d (default), 90d, semana, mês, trimestre, custom
- Quando `custom` → mostra 2 date pickers (De / Até) + botão Aplicar
- Perfil (dropdown dinâmico via `profiles`)
- Tipo (photo / reel / story / carousel)
- Label do período à direita

**5 Stats Cards**:
- Total, Pendentes, Publicados, Melhor hora, Melhor dia

**Grid 7 colunas** (Dom–Sáb):
- Células com número do dia + pills de posts
- Hoje destacado
- Dias fora do período esmaecidos
- Pills coloridas por status (pending / published / failed)
- **Drag-and-drop HTML5** entre dias → dispara `move`
- Click no dia → abre modal quick-schedule
- Click no pill → navega para `/posts?highlight=<id>` (usando `<Link>` TanStack, não `window.location`)

**Modal do dia** (Dialog shadcn):
- Título com data formatada em pt-BR
- Lista posts do dia
- Form: tipo + hora + caption + botão criar (via `quick-schedule`)

**Auto-refresh 60s** via `refetchInterval` no TanStack Query.

### 2. Types (`src/lib/types.ts`)
Adicionar: `CalendarV2Stats`, `CalendarV2Post`, `CalendarV2Period`, `CalendarV2Response`.

### 3. Mock + API (`src/lib/mock-data.ts`, `src/lib/api.ts`)
- Mock: gerar `grouped` a partir dos posts existentes filtrando pelo período; calcular stats (best_hour/best_day, by_type, by_status)
- Endpoints stub em `api.ts`:
  - `calendarV2(params)` → `GET /api/calendar/v2`
  - `calendarV2Move({post_id, new_date, new_time?})` → `POST /api/calendar/v2/move`
  - `calendarV2QuickSchedule(body)` → `POST /api/calendar/v2/quick-schedule`
- Respeita toggle `VITE_API_URL` (mock ↔ real) como as outras rotas

### 4. Sidebar + Command Palette
- Adicionar item "Calendário v2" no grupo Workspace (ícone `CalendarDays`)
- Adicionar entrada no `command-palette.tsx`

## Fora de escopo
- PWA, i18n, push notifications, service worker (não pedidos nos MDs atuais)
- Substituir `/calendar` antigo — mantido para não quebrar links existentes

## Entrega
1 wave: rota + types + mocks + api + sidebar + palette, com typecheck limpo.
