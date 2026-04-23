---
trigger: always_on
---

# ARIA - SOURCE OF TRUTH (Updated)

## 1. Product Vision and Philosophy

Aria has pivoted to a robust financial and budgeting platform exclusively for couples and individuals. The core of the application focuses on high predictability ("What-If Analysis"), transparent collaboration, and strict control through moldable budgeting rules.
While the current focus is 100% financial, the database architecture (Workspaces) is designed to support future modular expansions (like shopping lists and tasks) while keeping perfect isolation between personal use and commercial beta testers.

## 2. Main Scope

- **Shared Management:** Categorized income and expenses, clearly identifying who recorded the transaction, who paid (`paid_by`), and how the expense is divided (`split_type`).
- **Dynamic Budgeting:** Implementation of customizable budgeting presets (e.g., 50/30/20 rule). The app must actively alert users on the Dashboard when budget slices are nearing their limit.
- **Projection Engine:** Long-term impact simulations (e.g., "If I withdraw $1,000 from savings, what will be the future deficit?").
- **Executive Dashboard:** Unified and segmented views with quick filters (My Finances vs. Couple's Finances).

## 3. Technology Stack

- **Runtime:** React Native + Web (Unified codebase via Expo).
- **Framework:** Expo Router v5.
- **Language:** TypeScript (Strict config, interfaces for all domains).
- **Backend:** Supabase (PostgreSQL, Auth, RLS).
- **UI / Styling:** NativeWind (Tailwind CSS) - Tamagui is completely removed.
- **Design System:** Linear inspired (Dark mode, Inter typography, thin borders).

## 4. Architecture and Data Modeling

- **Multi-user Architecture (Workspaces):** The system filters strictly by `workspace_id`.
- **Service Layer:** Supabase calls are restricted to the `services/` folder. Hooks manage state using the Workspace ID.
- **Monetary Values:** Handled and saved exclusively in cents (`amount_cents`).
- **Budget Rules:** `budget_presets` and `workspace_budgets` tables validate via PostgreSQL constraints that active budget category percentages always equal 100%.
