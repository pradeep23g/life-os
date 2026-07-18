# LIFE OS — UI SYSTEM

This document defines the official UI/UX system for Life OS.

The interface must prioritize clarity, cognitive safety, and speed. Life OS is a daily operating system — not a decorative app.

---

## 1. UI PHILOSOPHY

Life OS is a **personal command center**.

The interface must follow these principles:

- Minimal visual noise
- Fast interaction
- Readable typography
- Cognitive protection: reflection features must never mix with execution features
- Low resource consumption — no heavy component libraries or animation frameworks

**Cognitive Boundary (Hard Constraint):**
Mind OS (reflection) and Productivity Hub (execution) must never share UI space. Showing pending tasks inside a journaling interface triggers cognitive anxiety (Zeigarnik Effect). This is not a style preference; it is an architectural invariant.

---

## 2. COLOR SYSTEM

Life OS uses a **true-black dark theme** as its only active theme.

### Dark Theme (Primary and Only Active Theme)

| Role | Value | Tailwind |
|---|---|---|
| Page background | `#000000` | `bg-black` |
| Card/surface | `#0a0a0a` | `bg-surface` (custom) |
| Border | `#222222` | `border-border` (custom) |
| Primary text | `#f1f5f9` | `text-slate-100` |
| Secondary text | `#94a3b8` | `text-slate-400` |
| Hover surface | `#111111` | `bg-[#111111]` |
| Active surface | `#222222` | `bg-[#222222]` |

Custom Tailwind tokens are defined in `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      surface: '#0a0a0a',
      border:  '#222222',
    },
  },
},
```

### Accent Usage

Accent colors are applied contextually for status indicators:
- `text-green-400` / `bg-green-400` — active/healthy states
- `text-yellow-400` / `bg-yellow-400` — warning states
- `text-red-400` / `bg-red-400` — critical/error states
- `text-blue-400` — informational highlights

Only one accent color should be active in any given UI context.

---

## 3. TYPOGRAPHY

No external font loaded. Typography uses the browser system stack:

```css
font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
```

Font scale (Tailwind):

| Context | Class |
|---|---|
| Module h1 | `text-xl` to `text-2xl font-semibold` |
| Card title | `text-base font-semibold` |
| Body | `text-sm` |
| Labels/metadata | `text-xs` |

Avoid large typography. The interface is data-dense; readability at small sizes is more important than visual hierarchy through size alone.

---

## 4. LAYOUT SYSTEM

### Standard Card Frame

All data widgets, forms, and panels use a consistent card container:

```html
<div class="rounded-xl border border-border bg-surface p-4">
  <!-- content -->
</div>
```

Cards contain:
- A clear header (usually `<h2>` or `<h3>` with appropriate Tailwind weight)
- Minimal controls
- Consistent internal spacing (`space-y-3` or `space-y-4`)

### Grid Layouts

Responsive multi-column grids use Tailwind's grid utilities:

```html
<!-- Standard 2-column on md, 1-column on mobile -->
<div class="grid gap-4 md:grid-cols-2">

<!-- 3-column on lg -->
<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

<!-- Full-width spanning card -->
<div class="col-span-full">
```

Use `col-span-full` for wide visualizations (timelines, heatmaps, charts).

### Page Spacing

Page content is wrapped in `<main class="p-3 sm:p-4 md:p-6">` by the AppShell. Inner components should use `space-y-4` for vertical rhythm between sections.

---

## 5. NAVIGATION ARCHITECTURE

### Tier 1 — Global Sidebar

The `Sidebar.tsx` component renders as:
- Desktop: fixed left rail, 80px compact (icons only) or 288px expanded (icons + labels)
- Mobile: hidden by default, shown as drawer via hamburger toggle in AppShell header

Current navigation order (from `navItems` in `Sidebar.tsx`):
1. Mission Control
2. Mind OS
3. Productivity Hub
4. Time OS
5. Finance OS
6. Data Lab
7. Fitness OS
8. Progress Hub

Desktop expand/collapse state is persisted to `sessionStorage` under key `life-os.desktop-sidebar`.

### Tier 2 — Module Sub-Navigation

Multi-page modules render a horizontal tab bar in their layout component. Tab links use `NavLink` with `end` for exact matching.

Example (Mind OS):
```
[ Dashboard ]  [ Habits ]  [ Journal ]
```

Tabs overflow horizontally on mobile with `overflow-x-auto pb-1`.

Active tab styling:
```html
<!-- Active -->
<a class="shrink-0 rounded-lg px-3 py-2 text-sm bg-[#222222] text-slate-100">

<!-- Inactive -->
<a class="shrink-0 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-[#111111]">
```

---

## 6. GLOBAL OVERLAYS

These components render inside AppShell and are always visible:

| Component | Purpose |
|---|---|
| `GlobalTimerBar` | Active/idle timer surface at the bottom of the screen |
| `SystemFeedbackToast` | Non-blocking toast notifications for mutations |
| `CommandPalette` | Keyboard-driven `Ctrl+K` navigation across all modules |
| `AppErrorBoundary` | Per-route error isolation; prevents full-app crashes |

---

## 7. MODULE UI SPECIFICATIONS

### Mission Control

- Primary grid layout: metric cards + Brain Engine hero + system status panels
- Brain Engine hero spans full width or wide columns
- Metric cards in a 2–4 column grid depending on breakpoint
- All content is read-only summaries; no data entry

### Mind OS

**Habits:**
- Habit cards are minimal: title, progress indicator, increment button
- One action button per habit (`+` / check)
- Progress bars are subtle (height 2–4px)
- Calendar modal for historical view (done/break/healed filters)

**Journal:**
- Mood selector: button-based (emoji or number scale 1–5)
- Recent entries list with truncated preview
- Calendar modal with per-day mood and multi-entry badge
- No task references visible

### Productivity Hub

**Tasks:**
- Kanban layout: `To Do`, `Doing`, `Done` columns
- Cards contain: task title, priority label, status badge
- `Start Focus` CTA per card (links to Time OS timer)
- No drag animations; click-to-move is acceptable

**Planning:**
- Weekly focus text field
- Goals list with status transitions
- Weekly plan items with completion checkbox
- Weekly review text area
- Alignment health metric (computed from goals/items completion)

### Progress Hub

- Programming skills: level badge, project count, increment CTA
- Personal skills: similar to programming skills
- Milestones: completion toggle, date tracking
- Challenges: status transitions (Active → Completed / Dropped)

### Fitness OS

- Dashboard: weekly cards per session, 90-day heatmap
- Workouts: expandable cards with exercise logs (sets/reps/weight)
- Library: exercise CRUD, muscle group categorization
- Personal Records: best lifts display

### Time OS

- Global Timer Bar always visible across all pages
- Single active timer state: bucket selector, optional task link, start/stop
- Manual log entry form
- Today totals, bucket distribution bar, 7-day trend bars

### Finance OS

- Metric cards: total spent, money left, daily safe limit, projected monthly, waste
- Quick-log FAB (floating action button) → modal
- Weekly burn card: 7 mini-bars, baseline comparison
- Transaction ledger: need/want badge, category, amount

### Data Lab

- Three tabs: Overview, Behavior, Telemetry
- Period selector: `7d | 30d | 90d | all` (filters display, not fetch)
- Data maturity guard on advanced visualizations (correlation, insights)
- Charts are hand-coded SVG/CSS — no external chart library

---

## 8. ICON SYSTEM

All icons are inline SVGs defined as React components. No icon library dependency.

Icon style convention:
- `viewBox="0 0 24 24"` standard 24px grid
- `fill="none"` with `stroke="currentColor"`
- `strokeWidth="1.8"`
- `strokeLinecap="round"` / `strokeLinejoin="round"` for soft look
- Default size class: `h-5 w-5`

---

## 9. FORMS AND INPUTS

Standard input styling:
```html
<input class="w-full rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#444444]">
```

Standard button:
```html
<!-- Primary action -->
<button class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-black hover:bg-slate-200">

<!-- Secondary action -->
<button class="rounded-lg border border-border px-4 py-2 text-sm text-slate-300 hover:bg-[#111111]">

<!-- Destructive action -->
<button class="rounded-lg px-4 py-2 text-sm text-red-400 hover:bg-red-400/10">
```

---

## 10. RESPONSIVE DESIGN

| Breakpoint | Behavior |
|---|---|
| Mobile (< 768px) | Sidebar hidden → hamburger drawer. Cards stack 1-column. Sub-nav tabs scroll horizontally. |
| Tablet / Desktop (≥ 768px) | Sidebar rail visible. Multi-column grids activate. Expanded layouts available. |

Tailwind prefix: `md:` for ≥768px changes.

Mobile-first: base styles target mobile. `md:` and `lg:` progressively enhance for larger screens.

---

## 11. PERFORMANCE RULES

Avoid:
- External UI component libraries (Material UI, Ant Design, Radix, etc.)
- Heavy animation frameworks for simple transitions
- Unnecessary React re-renders across domain boundaries
- Client-side sorting/filtering of large result sets (use SQL views instead)

Prefer:
- TailwindCSS utility classes
- Small, focused, strictly-typed components
- React Query caching to avoid loading spinners on re-navigation
- SQL aggregation for derived data

---

## 12. ACCESSIBILITY

- Adequate color contrast for readable text (slate-100 on black/surface backgrounds)
- `aria-label` on icon-only buttons (e.g., sidebar toggle, close buttons)
- `aria-hidden="true"` on all decorative SVG icons
- `aria-expanded` on toggleable containers
- `aria-label` or descriptive text on all interactive elements
- Keyboard navigation: all interactive elements reachable via Tab

---

## 13. DESIGN RESTRICTIONS FOR AGENTS

Do NOT introduce:
- New color values not in the established system
- CSS gradient backgrounds
- Complex hover animations or transitions
- External UI libraries
- Flat routing that bypasses the nested layout system
- Execution items (tasks) inside reflection interfaces (journal/habits)
- Reflection items (journal) inside execution interfaces (tasks/planning)

The UI must feel calm, structured, and functional at all times.