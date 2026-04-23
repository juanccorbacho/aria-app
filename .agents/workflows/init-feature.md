---
description: Use this to scaffold a complete feature from database migrations to UI screens.
---

# WORKFLOW: INIT-FEATURE

## 1. Context Analysis

- Read `.github/rules/source-of-truth.md` and `.github/rules/core-architecture-and-security.md`.
- Identify the domain of the new feature.

## 2. Execution Steps

- **Database:** Create a new SQL migration file in `supabase/migrations/` defining tables and RLS policies filtered by `workspace_id`.
- **Service:** Create a file in `services/` using the Supabase client to perform CRUD operations.
- **Hook:** Create a custom hook in `hooks/` to manage state, loading, and error for this service.
- **UI Component:** Create the visual components in `components/` using NativeWind and the design tokens from `design-system.md`.
- **Screen:** Create the main route in `app/` using Expo Router v5, ensuring it is a functional component.

## 3. Validation

- Verify that no `user_id` filters were used instead of `workspace_id`.
- Ensure all monetary inputs use `amount_cents`.
- Run a self-check for any remaining `tamagui` imports.
