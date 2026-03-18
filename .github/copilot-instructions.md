# Ária — Copilot Instructions

## 1. Product overview

Ária is a personal finance and productivity app for a small group of users (you, your partner, and one tester).  
The primary goal is to provide **clarity and calm** around money and tasks, especially for **neurodivergent users** (ADHD, anxiety, autism spectrum).

Key principles:

- Desktop‑first experience, with full support for mobile.
- Simple, predictable flows (no surprises, no hidden magic).
- Information is always easy to scan: big numbers, clear labels, low noise.

---

## 2. Tech stack

- **Runtime**: React Native + React Native Web (single codebase).
- **Framework**: Expo + Expo Router v5 (file‑based routing).
- **Language**: TypeScript (no `any`).
- **Backend**: Supabase (Auth, PostgreSQL, RLS).
- **UI Library**: Tamagui (design system, theming, tokens).
- **Hosting**:
  - Web: Vercel.
  - Mobile: EAS Build / Expo Go.

Comments in code should be in **Portuguese**, but all identifiers and code are in English.

---

## 3. Architecture and folder structure

Project root (`aria-app/`):

```txt
aria-app/
├── app/
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Initial redirect
│   ├── modal.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/
│       ├── _layout.tsx           # Sidebar (desktop) / Tabs (mobile)
│       ├── dashboard.tsx
│       ├── transactions.tsx
│       ├── bills.tsx
│       ├── tasks.tsx
│       └── profile.tsx
├── components/
│   ├── navigation/
│   │   ├── SidebarLayout.tsx     # Desktop shell
│   │   └── TabsLayout.tsx        # Mobile shell
│   └── ui/                       # Reusable UI primitives
├── constants/
│   └── theme.ts                  # Colors, spacing, tokens
├── hooks/
│   ├── useAuth.ts
│   ├── useDashboard.ts
│   ├── useTransactions.ts
│   ├── useBills.ts
│   ├── useTasks.ts
│   ├── useIsDesktop.ts
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── services/
│   ├── supabase.ts               # Supabase client instance
│   ├── authService.ts
│   ├── profileService.ts
│   ├── transactionService.ts
│   ├── billService.ts
│   └── taskService.ts
└── types/
    └── models.ts                 # Domain types and interfaces
```

Do NOT use `app/(tabs)` (Expo template residue).  
Do NOT reference template components like `hello-wave`, `parallax-scroll-view`, `haptic-tab`.

Navigation:

- `useIsDesktop` decides between `SidebarLayout` (desktop) and `TabsLayout` (mobile).
- Desktop: sidebar on the left, content takes full remaining width.
- Mobile: bottom tabs + stack.

`useSafeAreaInsets` MUST be imported from `react-native-safe-area-context`, not from `expo-router`.

---

## 4. Design system with Tamagui

Use **Tamagui components and tokens** instead of raw `View`, `Text`, `TouchableOpacity` whenever possible.[web:293][web:296]

Preferred primitives:

- Layout: `YStack`, `XStack`, `Stack`, `ScrollView` (Tamagui versions).
- Text: `Text`, `Paragraph`.
- Inputs: `Input`, `Label`, `Checkbox`, `Switch`.
- Surfaces: `Card`, `Separator`.
- Actions: `Button`, `Touchable` from Tamagui.

Styling rules:

- Use **tokens**, never hardcoded values when you can avoid it:
  - Colors: `bg="$background"`, `color="$color"`, `borderColor="$border"`, `bg="$surface"`, `bg="$primary"`.
  - Spacing: `p="$4"`, `px="$4"`, `py="$3"`, `gap="$3"`.
  - Radius: `borderRadius="$2"` or `$3`, never magic numbers.
  - Typography: `fontFamily="$body"` / `$heading`, `fontSize="$4"` etc.
- Themes from `tamagui.config.ts`:
  - **Dark** is the primary mode; **light** is optional for later.
  - Use semantic colors (`$background`, `$surface`, `$primary`, `$positive`, `$negative`, `$warning`, `$muted`, `$accent`) instead of specific hex codes.

Responsiveness:

- Use Tamagui media queries (`$gtSm`, `$gtMd`, etc.) for desktop vs mobile layout.
- Desktop:
  - Prefer 2‑column grids: `XStack` with `flexWrap="wrap"` and cards around `width="48%"`.
- Mobile:
  - Single column: `YStack` with `width="100%"`.

Create reusable building blocks in `components/ui/`, for example:

- `ScreenContainer`
- `StatCard`
- `SectionCard`
- `EmptyState`

Use those across dashboard, tasks, transactions, bills, profile.

---

## 5. UX guidelines (neurodivergent‑friendly)

The app targets users with ADHD, anxiety and autism spectrum traits. UX must reduce cognitive load and ambiguity:

Readability:

- Minimum body font size equivalent to **14px**.
- Prefer short labels and bullet points instead of large paragraphs.
- Keep screens focused: one “main” number or goal per screen (e.g. “Current month balance”).

Signals & feedback:

- Always combine **color + icon + short text** for important states:
  - Success: green + check + “Salvo com sucesso”.
  - Error: red + icon + “Não foi possível salvar. Tente novamente.”.
  - Warning (bill due soon): yellow + alert icon + “Vence hoje”.
- Use clear empty states:
  - “Você ainda não tem transações neste mês. Comece adicionando uma nova transação.”

Motion:

- Avoid flashy, continuous or looping animations.
- If animations are used, keep them subtle and short.
- Never auto‑scroll or auto‑rotate content.

Validation:

- Validate inputs **inline**, near the field, not only via color.
- Keep user input on error (do not clear the form).
- Use simple messages, in Portuguese, explaining exactly what is wrong.

Colors meaning:

- **Green**: income / positive, success.
- **Red**: expense / error / dangerous.
- **Yellow**: upcoming due, warning.
- **Accent (blue/purple)**: neutral emphasis (tags, chips).

---

## 6. Data model (Supabase)

All tables live in schema `public` with **Row Level Security (RLS) enabled**.  
Every row has a `user_id` and all queries must respect it.

### `profiles`

| Field      | Type                 |
| ---------- | -------------------- |
| id         | uuid (FK auth.users) |
| name       | text                 |
| email      | text                 |
| created_at | timestamptz          |

### `transactions`

| Field        | Type        | Notes                    |
| ------------ | ----------- | ------------------------ |
| id           | uuid        | PK, `gen_random_uuid()`  |
| user_id      | uuid        | FK `profiles.id`         |
| description  | text        |                          |
| amount_cents | integer     | always in cents (>= 0)   |
| type         | text        | `'entrada'` \| `'saida'` |
| category     | text        | free text                |
| date         | date        | `YYYY-MM-DD`             |
| created_at   | timestamptz |                          |

### `bills`

| Field        | Type        | Notes                              |
| ------------ | ----------- | ---------------------------------- |
| id           | uuid        | PK                                 |
| user_id      | uuid        | FK `profiles.id`                   |
| description  | text        |                                    |
| amount_cents | integer     | always in cents                    |
| due_date     | date        |                                    |
| urgency      | text        | `'alto'` \| `'medio'` \| `'baixo'` |
| paid         | boolean     | default `false`                    |
| recurring    | boolean     | default `false`                    |
| created_at   | timestamptz |                                    |

### `tasks`

| Field      | Type        |
| ---------- | ----------- |
| id         | uuid        |
| user_id    | uuid        |
| title      | text        |
| completed  | boolean     |
| due_date   | date        |
| created_at | timestamptz |

---

## 7. Business rules

Money:

- All monetary values are stored as **integer cents** (`amountCents: number`).
- The user types values in **reais** (e.g. “123,45”), which are converted to cents before saving.
- `amount_cents` should be non‑negative; the transaction `type` encodes direction (‘entrada’ vs ‘saida’).

Transactions:

- `type` is always `'entrada'` or `'saida'` (never English strings).
- Monthly balance = sum of `amount_cents` where `type='entrada'` minus sum where `type='saida'`, restricted to the current month by `date`.

Bills:

- A bill is **pending** if `paid = false`.
- Urgency is one of `'alto' | 'medio' | 'baixo'`.
- Pending bills are typically ordered by urgency (alto → medio → baixo) and then by `due_date` ascending.
- Recurring bills (`recurring = true`) may later spawn new rows per month (V2 feature).

Tasks:

- A task is pending if `completed = false`.
- Pending tasks should be ordered by `due_date` ascending, with tasks without `due_date` last.

Dashboard:

- Should show at least:
  - Current month balance.
  - Total pending bills (sum of `amount_cents` for `paid=false`).
  - Count of pending tasks.
  - Last 5 transactions.
  - List of urgent bills (`urgency='alto'` and `paid=false`).

---

## 8. Code conventions

TypeScript:

- Absolutely no `any` (explicit or implicit).
- Use `interface` for domain models, `type` for unions and utility types.
- Component props must be explicitly typed (`type Props = {...}`).
- Use `const` by default; avoid `let`; never use `var`.

React components:

- Components are **arrow functions**:
  - `export const DashboardScreen: React.FC<Props> = (props) => { ... }`
- Keep components small and focused on rendering and simple UI logic.
- Extract complex logic to hooks or services.

Naming:

- Components: `PascalCase` (e.g. `TransactionCard.tsx`).
- Hooks: `useXxx` (e.g. `useTransactions.ts`).
- Services: `xxxService.ts` (e.g. `transactionService.ts`).
- Domain types/interfaces live in `types/models.ts`.

Logging:

- No `console.log` in production code; use comments like `// TODO: add logger` where appropriate.

---

## 9. Services, hooks and Supabase access

Service layer:

- **All** direct Supabase calls must live in `services/`.
- Each resource gets a service file:
  - `transactionService.ts`
  - `billService.ts`
  - `taskService.ts`
  - `profileService.ts`
- Service functions:
  - Take a `userId` where relevant.
  - Always include **both** filters on update/delete:
    - `.eq('id', id).eq('user_id', userId)`
  - On Supabase error, always:
    - `throw new Error(error.message)`

Hooks:

- Hooks consume services and manage local state and side effects:
  - `useTransactions`, `useBills`, `useTasks`, `useDashboard`, `useAuth`.
- Hooks return:
  - Data: lists, aggregates, etc.
  - State: `{ loading, error }` (or similar).
  - Actions: `createX`, `updateX`, `deleteX`, `toggleX`.

Components:

- **Never** call Supabase directly from components.
- Components talk only to hooks.

Forms and submission:

- Every create/update form must:
  - Have an `isSubmitting` state.
  - Disable the submit button while `isSubmitting` is `true`.
  - Use `try/catch/finally` to ensure `isSubmitting` is reset.

---

## 10. Performance and React Native patterns

Lists:

- Use `FlatList` / `SectionList` for any non‑trivial list.
- Never use `.map()` inside a `ScrollView` for large collections.
- Provide `keyExtractor` and reasonable `initialNumToRender`/`maxToRenderPerBatch` when needed.

Functions and re‑renders:

- Avoid inline arrow functions in `renderItem` and `onPress` for big lists.
- Use `useCallback` for handlers when necessary to avoid excessive renders.

Hooks:

- Do not `await` directly in `useEffect`; define an inner async function and call it.
- Keep each hook focused on a single concern (e.g. `useDashboard` only aggregates dashboard data, does not handle navigation).

Components:

- Prefer multiple small components over one giant component.
- Keep expensive computations outside of render or memoized where needed.

---

## 11. Testing and quality

(When testing is added:)

- Use React Testing Library for components and Jest/Vitest for logic/hooks.
- Prioritize tests for:
  - Business rules: balance calculation, filters, sorting.
  - Hooks that aggregate data (`useDashboard`).
- ESLint/TS rules:
  - Do not disable rules with `// eslint-disable` unless strictly necessary and with a comment explaining why.

---

## 12. Copilot / Workspace rules

These instructions are for **GitHub Copilot / Copilot Workspace** and similar agents.[web:288][web:291]

**Do NOT:**

- Do not create a new Expo project inside this repo.
- Do not introduce new UI/state/form/mask libraries (e.g. `react-native-paper`, `react-hook-form`, `react-native-mask-input`) unless explicitly requested.
- Do not modify critical config files (`tamagui.config.ts`, `supabase.ts`, `tsconfig.json`, `app.json`) unless explicitly requested.
- Do not remove RLS or weaken `user_id` filtering in Supabase queries.
- Do not convert the project away from Tamagui or Expo Router.

**Do:**

- Follow the folder structure and patterns described above.
- Use Tamagui components and tokens instead of bare React Native components.
- Use existing hooks and services; if something is missing, propose creating it following the same patterns.
- For large or risky changes:
  - First propose a **step‑by‑step plan** (list of files and edits).
  - Only then apply the changes after the plan is confirmed.

---

## 13. Scope: V1, V1.1, V2

**V1 (implemented):**

- Auth (email/password via Supabase).
- Dashboard with monthly balance, pending bills and tasks, and latest transactions.
- Transactions CRUD.
- Bills CRUD with urgency and status filters.
- Tasks CRUD.
- Basic profile screen.

**V1.1 (polish, next steps):**

- Profile improvements (edit name, change password, logout UX).
- Better empty states and feedback messages.
- Inline editing for transactions and tasks (bills already have inline edit).
- Additional filters for transactions (by month, category, type).
- Dark/light mode switching using Tamagui themes.

**V2 (do not implement yet):**

- Goals module (financial goals, deadlines, progress bars).
- Balance projection (future cash flow).
- Recurring logic that automatically creates new bills/transactions per month.
- Shared data between couple users (e.g. `shared` flag).
- Advanced reports and exports (CSV/PDF).
- Open Finance / automatic bank sync.
- Investments module.
- Invitations and multi‑tenant workspaces.
- Push notifications.

```

***
```
