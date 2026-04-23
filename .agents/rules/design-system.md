---
trigger: glob
globs: *.tsx, app/**/*.tsx, components/**/*.tsx, tailwind.config.js
---

# ARIA - UNIFIED DESIGN SYSTEM

## 1. Visual Theme & Core Philosophy

The Aria design system is a hybrid that merges the extreme precision and dark-mode engineering of **Linear** with the flexible, breathable structural layouts of **Notion**. The application must feel like a professional, high-end financial engineering tool. It is strictly **Dark-Mode First**.

## 2. Color Palette & Roles (Linear Engineering)

The color system is heavily inspired by Linear, built on a near-black canvas where elements emerge through subtle changes in surface luminance.

- **Main Background (`$background`):** `#08090a` (Marketing/Deepest canvas) and `#0f1011` (Standard app background).
- **Elevated Surfaces (`$surface`):** `#191a1b` (Cards, dropdowns, panels). Never use solid bright colors for backgrounds.
- **Primary Text:** `#f7f8f8` (Near-white, never pure `#ffffff` to avoid eye strain).
- **Secondary Text:** `#d0d6e0` (Silver-gray for descriptions and body).
- **Brand Accent:** `#5e6ad2` (Indigo) used exclusively for primary CTAs and active states.
- **Financial Semantics:**
  - Income/Success: `#10b981` (Emerald Green)
  - Expense/Error: `#ef4444` (Pure Red)
  - Warning/Pending: `#facc15` (Pure Yellow)

## 3. Typography (Linear Precision)

Typography is entirely based on **Inter Variable** with OpenType features enabled.

- **Features:** Must use `font-feature-settings: "cv01", "ss03"` globally for a geometric, clean aesthetic.
- **Weights:**
  - 400 (Standard reading)
  - 510 (Signature UI emphasis, default for buttons/navigation)
  - 590 (Strong emphasis/Headers)
- **Tracking (Letter-spacing):** Aggressive negative tracking on display sizes (e.g., `-1.056px` at 48px). Normal tracking at body sizes (16px).

## 4. Borders & Elevation (Linear Aesthetics)

- **Whisper Borders:** Instead of Notion's dark borders, use Linear's semi-transparent white borders. Default border is `1px solid rgba(255,255,255,0.08)`. For Tailwind, use extremely thin borders like `border-[0.5px] border-zinc-800`.
- **Elevation:** Shadows are nearly invisible on dark mode. Create depth by stacking background luminance (e.g., base is `#08090a`, card is `rgba(255,255,255,0.02)`, modal is `rgba(255,255,255,0.05)`).

## 5. Layout, Spacing & Structure (Notion Architecture)

While the paint is Linear, the structural bones are Notion.

- **Whitespace as Focus:** Use generous vertical rhythm. Leave 64-120px between major sections. Let the dark background act as empty space.
- **Data Tables & Lists:** Follow Notion's approach to data density. Rows should have comfortable padding, easy-to-click targets, and clear typographic hierarchy.
- **Flexible Modals:** Use Notion's deep shadow concept but adapted for dark mode. Modals should feel layered and feature a subtle dark overlay backdrop (`rgba(0,0,0,0.85)`).
- **Empty States:** Like Notion, empty workspaces must not feel dead. Use subtle line-art illustrations and clear "Create your first transaction" actions.
- **Base Grid:** 8px base spacing unit, but allowing organic adjustments (4px, 12px, 16px, 24px) to ensure optical alignment.

## 6. Components Rules

- **Buttons:** Backgrounds at near-zero opacity (e.g., `rgba(255,255,255,0.02)`) with a subtle white border, EXCEPT for the primary CTA which uses the Brand Indigo (`#5e6ad2`).
- **Pill Badges:** 9999px border-radius (full pill) for status tags (e.g., "Paid", "Pending").
- **Inputs:** Dark transparent backgrounds (`rgba(255,255,255,0.02)`) with a `rgba(255,255,255,0.08)` border. Focus states must have a clear ring.
