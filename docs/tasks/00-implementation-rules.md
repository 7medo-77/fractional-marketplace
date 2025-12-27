# Implementation Rules & Expected Structure (Reference)

- Follow Server Components first, then Client Components.
- TypeScript strict mode; no `any`.
- Use shadcn/ui components and accessibility best-practices.
- ISR for asset data (revalidate: 60).
- Central socket event names in `src/handlers/socketEvents.ts`.
- Expected frontend structure:
  - app/, components/, lib/, hooks/, stores/, types/, styles/