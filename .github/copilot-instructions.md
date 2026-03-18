# Ária — Copilot Instructions

## Produto

App de **gestão financeira pessoal** chamado Ária.

- Foco: transações, contas a pagar, tarefas e metas financeiras
- Abordagem **desktop-first** com suporte completo a mobile
- Usuário único por conta (sem compartilhamento na V1)

## Stack

- Expo Router v5 — file-based routing
- React Native + React Native Web
- TypeScript estrito — proibido `any`
- Supabase (auth + PostgreSQL)
- NativeWind ou StyleSheet nativo para estilização

## Estrutura de Pastas (real)

ria-app/
├── app/
│ ├── \_layout.tsx ← root layout
│ ├── index.tsx ← redirect inicial
│ ├── modal.tsx
│ ├── (auth)/
│ │ ├── \_layout.tsx
│ │ ├── login.tsx
│ │ └── register.tsx
│ └── (app)/
│ ├── \_layout.tsx ← layout com sidebar (desktop) ou tabs (mobile)
│ ├── dashboard.tsx
│ ├── transactions.tsx
│ ├── bills.tsx
│ ├── tasks.tsx
│ └── profile.tsx
├── components/
│ ├── navigation/
│ │ ├── SidebarLayout.tsx ← layout desktop
│ │ └── TabsLayout.tsx ← layout mobile
│ └── ui/ ← componentes genéricos reutilizáveis
├── constants/
│ └── theme.ts ← cores, espaçamentos, tipografia
├── hooks/
│ ├── useAuth.ts
│ ├── useDashboard.ts
│ ├── useIsDesktop.ts
│ ├── use-color-scheme.ts
│ └── use-theme-color.ts
├── services/
│ ├── supabase.ts ← instância do cliente Supabase
│ ├── authService.ts
│ ├── profileService.ts
│ ├── transactionService.ts
│ └── billService.ts
└── types/
└── models.ts ← todos os tipos e interfaces do domínio

> ⚠️ A pasta `app/(tabs)` é resíduo do template Expo — não usar.  
> ⚠️ Componentes `hello-wave`, `parallax-scroll-view`, `haptic-tab` são do template — não referenciar.

## Arquitetura de Navegação

- `useIsDesktop` detecta a plataforma e retorna `boolean`
- `(app)/_layout.tsx` renderiza `SidebarLayout` (desktop) ou `TabsLayout` (mobile)
- **Desktop:** sidebar lateral fixa + conteúdo à direita
- **Mobile:** bottom tabs + stack interno
- Nunca usar componentes exclusivos de mobile sem fallback web

## Autenticação

- Supabase Auth com email/senha
- Hook `useAuth` expõe: `user`, `session`, `signIn`, `signOut`, `loading`
- Pós-login → redireciona para `/dashboard`
- Não autenticado → redireciona para `/login`
- Instância do Supabase centralizada em `services/supabase.ts`

## Convenções de Código

### Domínio e Tipos

- Todos os tipos e interfaces ficam em `types/models.ts`
- Valores monetários **sempre em centavos**: `amountCents: number`
- Tipo de transação: `'entrada' | 'saida'` — nunca `income/expense`
- Urgência de contas: `'alto' | 'medio' | 'baixo'`
- Datas: string ISO `YYYY-MM-DD`
- IDs: `string` (UUID gerado pelo Supabase)

### Serviços e Hooks

- Toda chamada Supabase fica em `services/`
- Hooks em `hooks/` consomem services e gerenciam estado
- Nunca chamar Supabase diretamente dentro de componentes
- Erros do Supabase sempre relançados: `throw new Error(error.message)`
- Ao criar um novo service, criar o hook correspondente

### TypeScript

- Sem `any` — usar `unknown` + type guard quando necessário
- Interfaces para modelos de domínio, `type` para unions e utilitários
- Props de componentes sempre tipadas com interface explícita
- Preferir `const` sobre `let`, nunca `var`
- Componentes sempre como arrow functions com tipagem explícita

### UX / Componentes

- Toda tela deve tratar estados de `loading` e `error`
- Componentes genéricos ficam em `components/ui/`
- Componentes de navegação ficam em `components/navigation/`
- Não usar `console.log` — substituir por `// TODO: add logger`

## Schema do Banco (Supabase)

### `profiles`

| Campo      | Tipo                 |
| ---------- | -------------------- |
| id         | uuid (FK auth.users) |
| name       | text                 |
| email      | text                 |
| created_at | timestamptz          |

### `transactions`

| Campo        | Tipo        | Detalhe               |
| ------------ | ----------- | --------------------- |
| id           | uuid        | PK, gen_random_uuid() |
| user_id      | uuid        | FK profiles           |
| description  | text        |                       |
| amount_cents | integer     | sempre em centavos    |
| type         | text        | 'entrada' \| 'saida'  |
| category     | text        |                       |
| date         | date        | YYYY-MM-DD            |
| created_at   | timestamptz |                       |

### `bills`

| Campo        | Tipo        | Detalhe                      |
| ------------ | ----------- | ---------------------------- |
| id           | uuid        | PK                           |
| user_id      | uuid        | FK profiles                  |
| description  | text        |                              |
| amount_cents | integer     | sempre em centavos           |
| due_date     | date        |                              |
| urgency      | text        | 'alto' \| 'medio' \| 'baixo' |
| paid         | boolean     | default false                |
| recurring    | boolean     | default false                |
| created_at   | timestamptz |                              |

### `tasks`

| Campo      | Tipo        |
| ---------- | ----------- |
| id         | uuid        |
| user_id    | uuid        |
| title      | text        |
| completed  | boolean     |
| due_date   | date        |
| created_at | timestamptz |

## Features V1 (escopo atual)

- Dashboard com resumo do mês (saldo, entradas, saídas)
- CRUD de transações
- Contas a pagar com filtro de urgência e status
- Tarefas financeiras simples
- Perfil do usuário

## Fora do escopo — não implementar (V2+)

- Workspaces compartilhados / múltiplos usuários
- Relatórios avançados / exportação
- Integração bancária open finance
