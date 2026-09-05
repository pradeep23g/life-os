# LIFE OS — UI SYSTEM

**Status:** Authoritative UI/UX Design System  
**Last Synchronized:** September 2026 (Phase 1 Baseline)

---

## 1. UI Philosophy

Life OS is a **personal command center**. The design system prioritizes:
- **True-Black Palette:** Pure OLED black (`#000000`) background with subtle `#0a0a0a` surfaces.
- **Fast Micro-Interactions:** Keyboard navigation (`Cmd+K` palette), immediate optimistic UI state, and lightweight CSS.
- **Cognitive Protection:** Mind OS (reflection) and Productivity Hub (execution) never share the same UI screen space.
- **Responsive Navigation:** Collapsible desktop sidebar rail and touch-friendly mobile drawer.

---

## 2. Color System

| Token | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| Page Background | `#000000` | `bg-black` | Global document background |
| Surface / Card | `#0a0a0a` | `bg-surface` | Primary container background |
| Subtle Border | `#222222` | `border-border` | Standard card and input outline |
| Primary Text | `#f1f5f9` | `text-slate-100` | Headings, active values |
| Secondary Text| `#94a3b8` | `text-slate-400` | Metadata, supporting labels |
| Hover Surface | `#111111` | `bg-[#111111]` | Hover states |
| Active Surface| `#222222` | `bg-[#222222]` | Active nav items |

---

## 3. Standard Components

### Card Container
```tsx
<div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
  {children}
</div>
```

### Module Header
```tsx
<ModuleHeader title="Mind OS">
  <LocalNavLink to="." label="Dashboard" />
  <LocalNavLink to="habits" label="Habits" />
  <LocalNavLink to="journal" label="Journal" />
</ModuleHeader>
```

### Global Overlays
- `GlobalTimerBar`: Fixed floating timer bar when a focus session is actively running.
- `PiPTimer`: Document Picture-in-Picture window supporting external timer controls.
- `SystemFeedbackToast`: Micro-interaction status toast.
- `CommandPalette`: Keyboard shortcut modal (`Ctrl+K` / `Cmd+K`).
