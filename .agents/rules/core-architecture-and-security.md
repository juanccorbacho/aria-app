---
trigger: always_on
---

# ARIA - ARCHITECTURE AND GOOD PRACTICES

## 1. Security and Database (CRITICAL)

- **Multi-user & Isolation:** The system does not filter data solely by `user_id`. All queries, inserts, and Row Level Security (RLS) policies must be governed by a `workspace_id`. Couples share the same workspace, while beta testers will be isolated in their own workspaces.
- **Monetary Values:** It is strictly forbidden to save financial values in decimal formats. All money in the database must be manipulated and saved in cents (`amount_cents`) to prevent floating-point calculation errors.

## 2. Frontend Architecture

- **Service Isolation:** Direct calls to the Supabase API within visual components are strictly prohibited. All Supabase interactions must reside in the `services/` folder.
- **Hook Pattern:** Components must consume data exclusively via Custom Hooks (e.g., `useTransactions`). These hooks interact with the `services/` layer and manage state using the Workspace ID. The standard return for a hook should be a structured object: `{ data, loading, error, actions }`.
- **Forms:** Every form must manage an `isSubmitting` state and wrap form submissions in `try/catch/finally` blocks for reliable error handling.

## 3. Code Quality (Clean Code)

- **Strict Typing:** Mandatory use of TypeScript with strict configuration. All Supabase domain models (Profile, Transaction, Bill, Workspace) must have an explicit `interface`.
- **Language and Naming:** Source code (variables, functions, comments) must be 100% in English. Use `camelCase` for functions and variables, and `PascalCase` for Components and Interfaces.
