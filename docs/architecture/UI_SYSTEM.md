---
title: "UI System & Visual Language"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "architecture"
---

# LIFE OS — UI SYSTEM & DESIGN TOKENS

**Status:** Authoritative UI/UX Design System  
**Last Synchronized:** September 2026 (Winter Arc 2.0 Baseline — Commit `77d1a5b`)  
**Target Repository:** `pradeep23g/life-os`

---

## 1. UI Philosophy

Life OS is a **personal command center and cognitive sanctuary**. The visual language rejects SaaS template defaults in favor of:
- **True-Black & Monospace Grounding:** Pure OLED black (`#000000`) background with brutalist `#0a0a0a` surfaces and edge-to-edge content.
- **Three-Tier Typographic Grammar:** Clear separation between contemplative editorial prose, tactical actions, and precision telemetry data.
- **Solar & Circadian Harmonics:** Dynamic OKLCH color tokens adapting across natural solar transitions (`dawn`, `day`, `dusk`, `midnight`) plus sanctuary mode (`recovery`).
- **Kinetic Astrolabe Orb Navigation:** Stripped out traditional sidebars in favor of a 3-ring orbital astrolabe with a central telemetry HUD readout (see ADR-023).
- **Tactile Inputs:** Purpose-built tactical touch numpads, batch command parsing, and zero layout shift.

---

## 2. Typographic Grammar (The 3-Tier Rule)

Life OS employs three distinct typographic voices, each assigned to an immutable semantic role:

| Font Family | CSS Variable / Class | Primary Semantic Role | Examples |
|---|---|---|---|
| **Newsreader** | `font-serif` | Contemplative reflection, seasonal vows, philosophy, broadsheet reporting. | Vow cards, Sunday field dossiers, historical chapters, mission statements. |
| **Geist Sans** | `font-sans` | Tactical actions, navigation items, structural UI labels, modal buttons. | Orb navigation labels, button text, dialog headers, table column titles. |
| **JetBrains Mono** | `font-mono` | Solar time, tabular numerals, telemetry metrics, duration timers, ASCII meters. | Chronos timer digits, mass/rep numerals, momentum sparkline tooltips, telemetry keys. |

---

## 3. Semantic OKLCH Token Architecture & Solar Themes

Colors are specified using modern `oklch()` color spaces in `src/index.css` and mapped through Tailwind CSS variables:

### 3.1 Base Semantic Tokens
- `--bg-canvas`: Deepest ground level (`oklch(0.05 0.005 260)` to `#000000`).
- `--surface-panel`: Elevated component container (`oklch(0.12 0.008 260)`).
- `--border-subtle`: Architectural bounding lines (`oklch(0.22 0.010 260)`).
- `--text-primary`: Pure legible foreground (`oklch(0.95 0.005 260)`).
- `--text-secondary`: Supporting context (`oklch(0.65 0.015 260)`).
- `--text-tertiary`: Monospace telemetry metadata (`oklch(0.45 0.015 260)`).

### 3.2 Circadian Solar Themes
The document root `<html class="theme-*">` dynamically switches based on local time or manual override:
1. **`.theme-dawn` (05:00–08:00):** Soft rose/amber horizon highlights with gentle awakening contrast.
2. **`.theme-day` (08:00–17:00):** High-contrast daylight clarity with crisp neutral surfaces.
3. **`.theme-dusk` (17:00–21:00):** Warm copper and dusk-violet undertones encouraging cognitive down-regulation.
4. **`.theme-midnight` (21:00–05:00):** True OLED obsidian black with dim neon accents to prevent melatonin suppression.
5. **`.theme-recovery` (Sanctuary Mode, ADR-027):** Low-contrast sage and sepia tones eliminating urgency signals.

---

## 4. Module Branding & Signature Accents

| Module | Signature Accent | Color Swatch | Semantic Role |
|---|---|---|---|
| **Home (The Porch)** | `#ffffff` | White | Stark executive clarity |
| **Winter Arc** | `#22d3ee` | Cyan | Glacial protocol accent |
| **Mission Control** | `#ffffff` | White | Central command horizon |
| **Profile** | `#e2e8f0` | Slate | Personal history chronicle |
| **Admin Console** | `#8b5cf6` | Violet | System control plane |
| **Field Reports** | `#f43f5e` | Rose | Editorial Sunday field dossier |
| **Mind OS** | `#a855f7` | Purple | Contemplative reflection |
| **Productivity Hub** | `#3b82f6` | Blue | Execution & backlog velocity |
| **Learning OS** | `#eab308` | Amber | Luminescent mastery & curriculum |
| **Fitness OS** | `#ef4444` | Red | Kinetic physical exertion |
| **Time OS** | `#f59e0b` | Gold | Chronos temporal focus & density |
| **Finance OS** | `#10b981` | Emerald | Capital awareness & discipline |
| **Data Lab** | `#6366f1` | Indigo | Telemetry observatory |

---

## 5. Standard Navigation & Shell Components

### 5.1 Kinetic Astrolabe Orb (`AstrolabeOrbNav.tsx`)
- Fixed viewport anchor (`fixed bottom-6 right-6 z-50`).
- 3 concentric orbital rings: Ring 1 (Horizon/Presence), Ring 2 (Core Domains), Ring 3 (Observability & Tools).
- Orbital radii: Desktop (96px, 147px, 198px), Mobile (75px, 119px, 163px).
- Central Avatar Core: In expanded state, hovering any module icon projects the module name, signature color, and back-glow directly into the central core rather than overlapping floating tooltips.
- Direct quick actions for `/profile`, `/admin`, and Supabase `signOut`.

### 5.2 Module Header
```tsx
<ModuleHeader title="Fitness OS" icon={FitnessIcon}>
  <LocalNavLink to="workouts" label="Workouts" />
  <LocalNavLink to="library" label="Library" />
  <LocalNavLink to="pr" label="PRs" />
</ModuleHeader>
```

### 5.3 Global Overlays & Floating Auxiliaries
- `AstrolabeOrbNav`: Universal spherical navigation nexus.
- `GlobalTimerBar`: Fixed floating timer bar when a focus session is actively running.
- `PiPTimer`: Document Picture-in-Picture window supporting external timer controls.
- `SystemFeedbackToast`: Micro-interaction status toast.
- `CommandPalette`: Keyboard shortcut modal (`Ctrl+K` / `Cmd+K`).
- `TactileNumpad`: Custom collapsible touch pad for workout reps/weight entry without virtual keyboard layout shift.

