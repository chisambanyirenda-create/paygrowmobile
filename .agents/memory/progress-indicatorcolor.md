---
name: Progress component indicatorColor
description: The shadcn Progress component needs explicit prop extension to support custom indicator colors
---

The base radix/shadcn `Progress` component in `artifacts/mobile-biz/src/components/ui/progress.tsx` does NOT forward unknown props to the inner `Indicator` element — unknown props go to the Root via spread. Adding `indicatorColor` without extending the interface causes a TypeScript error.

**Fix applied**: Extended the component's prop interface to accept `indicatorColor?: string` and apply it as a `cn()` class on the `ProgressPrimitive.Indicator`.

**How to apply**: Any time a dashboard or other page needs a colored progress bar, use the `indicatorColor` Tailwind class prop (e.g. `indicatorColor="bg-destructive"`). Do NOT pass arbitrary HTML attributes expecting them to reach the indicator.
