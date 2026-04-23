---
trigger: model_decision
description: : Use this rule only when planning next steps, defining the project roadmap, or transitioning between development phases. Do not read this for standard UI or component tasks.
---

# ARIA - STRATEGIC ROADMAP (Phase 2.0+)

_Note: MVP 0.5 established the Auth baseline and basic CRUD forms. The following phases initiate the architectural pivot._

## Phase 1: Couple Foundation (Workspace Architecture)

- **Objective:** Modify the database engine to support collaborative accounts and refactor the UI base.
- **Backend:** Create the `workspaces` table and relate `profiles` to them. Update `transactions` and `bills` to include `workspace_id`, `paid_by`, and `split_type`. Rewrite Supabase RLS policies to filter read/write operations by `workspace_id`.
- **Frontend:** Completely remove Tamagui. Install NativeWind and Tailwind CSS. Define Linear-inspired design tokens.
- **Exit Criteria:** App compiles normally in NativeWind; two different accounts can log in, join the same Workspace, and see each other's transactions instantly.

## Phase 2: Advanced Management and Budget Engine (50/30/20)

- **Objective:** Bring budgeting intelligence to expense creation.
- **Tasks:** Create UI for budget configuration using interactive sliders. Implement a dropdown with market presets (e.g., 50/30/20). Build real-time validation to ensure the percentage sum is exactly 100%.
- **Dashboard:** Build linear progress bars with semantic signaling (Green = Safe, Yellow = Warning, Red = Exceeded) based on current month expenses versus the allowed budget slice.
- **Exit Criteria:** Users can define that "Leisure" represents 30% of their income and graphically see on the dashboard how close they are to exceeding that quota.

## Phase 3: Projections Engine (What-If Analysis)

- **Objective:** Allow predictability and complex financial simulations.
- **Tasks:** Create tables for `investments` and `reserves`. Develop logic to simulate planned purchases against the fixed cash flow of the upcoming months. Calculate opportunity costs for investment withdrawals.
- **Exit Criteria:** Simulating a purchase or a withdrawal displays a clear warning panel (e.g., "This action will generate a $200 deficit in your October budget").

## Phase 4: UX Polish and Commercial Showcase

- **Objective:** Finalize the design to ensure flawless daily usage and readiness for alpha testers.
- **Tasks:** Implement desktop keyboard shortcuts, attractive Empty States, and subtle UI animations. Create a "Beta Invite" interface to isolate external testers into invisible, separate workspaces.
- **Exit Criteria:** Aria is bug-free for daily use by the primary couple and is visually mature enough to be offered to 5 initial beta testers.
