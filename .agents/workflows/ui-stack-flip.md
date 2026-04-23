---
description: Use this to handle the heavy lifting of removing Tamagui and setting up NativeWind.
---

# WORKFLOW: UI-STACK-FLIP

## 1. Cleanup

- Remove all `@tamagui/*` packages from `package.json`.
- Delete `tamagui.config.ts` and remove its provider from the root `_layout.tsx`.
- Clean `babel.config.js` and `app.json` from Tamagui plugins.

## 2. Setup NativeWind

- Install `nativewind` and `tailwindcss` as dev dependencies.
- Run `npx tailwindcss init`.
- Configure `tailwind.config.js` with the Linear/Notion tokens from `design-system.md`.

## 3. Refactor Baseline

- Identify the 3 most important components (Button, Input, Card).
- Rewrite them using `styled` from NativeWind or standard Tailwind classes.
- Ensure the project compiles with `npx expo start`.
