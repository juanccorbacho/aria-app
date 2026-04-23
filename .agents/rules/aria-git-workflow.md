---
trigger: model_decision
description: Use this rule when writing commit messages, finalizing a task, or creating a Pull Request.
---

# GIT WORKFLOW AND AUTONOMOUS PR GENERATION

## 1. Commit Messages

- **Conventional Commits:** Follow the Conventional Commits specification strictly (e.g., `feat: add budget presets`, `fix: correct amount_cents calculation`).
- **Clarity:** Ensure the commit message clearly explains "what" was changed and "why".

## 2. Pull Requests (Jules)

- **Description:** When creating a Pull Request, you must include a detailed description of what was changed and why it was changed.
- **Context:** Always reference the Workspace architecture if the PR touches database or service layers.
- **Migrations:** Explicitly state if any new SQL migrations are required and included in the PR.

## 3. Self-Review (Quality Gate)

- **Tamagui Check:** Before finalizing a task or pushing code, review the code to ensure no `tamagui` imports were accidentally added.
- **Security Check:** Ensure that `workspace_id` is present in all new Supabase interactions and RLS policies.
- **Monetary Check:** Guarantee that no floating-point variables were used for money and everything is saved as `amount_cents`.
