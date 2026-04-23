---
trigger: always_on
---

# ARIA - STYLE GUIDE AND UI

## 1. Styling Stack

- **Tamagui is Prohibited:** Remove all Tamagui dependencies and configuration remnants. The project exclusively uses NativeWind and Tailwind CSS for styling components.

## 2. Art Direction (Linear Inspired)

- **Concept:** The design must convey the feeling of a "professional financial engineering tool". Focus on extreme productivity, deep native dark mode, high contrasts, clean Inter typography, and data-dense tables.
- **Borders and Surfaces:** Use extremely thin borders (e.g., Tailwind `border-[0.5px] border-zinc-800`), very subtle shadows strictly for elevation, and moderately rounded corners (`rounded-md` or `rounded-lg`).

## 3. Design Tokens (Tailwind)

The main palette is based on dark tones and high-contrast semantic colors:

- **Main Background (`$background`):** Deep graphite tones (e.g., Tailwind `bg-zinc-950` or HEX `#050816`).
- **Surfaces/Cards (`$surface`):** Slightly lighter than the background to highlight content areas (e.g., Tailwind `bg-zinc-900` or HEX `#0B1020`).
- **Primary Action (`$primary`):** Vibrant blue, used sparingly only for main actions (e.g., Tailwind `bg-blue-500` or HEX `#3B82F6`).
- **Financial Semantics:**
  - Positive / Income: Pure Green (`text-green-500` / `#22C55E`).
  - Negative / Expense / Error: Pure Red (`text-red-500` / `#EF4444`).
  - Alert / Warning: Pure Yellow (`text-yellow-400` / `#FACC15`).
