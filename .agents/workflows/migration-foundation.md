---
description: Use this to execute the critical architectural pivot (Workspaces + RLS) for Phase 1.
---

# WORKFLOW: MIGRATION-FOUNDATION

## 1. Database Restructuring

- Create the `workspaces` table.
- Alter `profiles` to add `workspace_id` and create the foreign key relationship.
- Update `transactions` and `bills` tables with `workspace_id`, `paid_by`, and `split_type`.

## 2. Security Layer (RLS)

- Drop existing RLS policies that filter by `user_id`.
- Create new Row Level Security policies for all tables where the filter is `workspace_id = (select workspace_id from profiles where id = auth.uid())`.

## 3. Data Integrity

- Ensure all existing data is migrated to a default workspace to prevent data loss.
- Set `amount_cents` as the mandatory integer type for all currency columns.
