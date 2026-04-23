---
trigger: glob
globs: *.tsx, app/**/*.tsx, components/**/*.tsx
---

# ARIA - COMPONENT RULES

## 1. React Native / Expo Structure

- **Unified Codebase:** Components must be written with portability between mobile and desktop in mind, utilizing React Native + Web and Expo Router v5.
- **List Performance:** When dealing with financial data that can grow rapidly (like transaction lists or bills), it is STRICTLY MANDATORY to replace the use of `ScrollView + .map()` with `FlatList`.
- **Optimization:** Apply `useCallback` and `useMemo` in heavy calculation functions (such as financial projections and 50/30/20 budget allocations) to avoid unnecessary UI re-renders.

## 2. User Experience

- **Action Clarity:** Clickable components must not rely on long or looping animations.
- **Semantic Feedback:** Important states must always be communicated by the triad: `Color + Icon + Text` (never rely solely on color for accessibility reasons).
- **Empty States:** Screens without data (e.g., a newly created couple Workspace) cannot display an empty black screen. They must include attractive components instructing the user on the first action.
- **Validation:** Financial data input components must have inline validation, with error messages appearing immediately below the relevant text field.
