# LIFE OS — UI SYSTEM

**Status:** Authoritative UI/UX Design System  
**Last Synchronized:** September 2026 (Phase 1 Baseline)

---

## 1. UI Philosophy

Life OS is a **personal command center**. The design system prioritizes:
- **True-Black & Monospace Palette:** Pure OLED black (`#000000`) background with brutalist `#0a0a0a` surfaces and edge-to-edge content.
- **Fast Micro-Interactions:** Keyboard navigation (`Cmd+K` palette), immediate optimistic UI state, and lightweight CSS.
- **Cognitive Protection:** Mind OS (reflection) and Productivity Hub (execution) never share the same UI screen space.
- **Kinetic Astrolabe Orb Navigation:** Stripped out traditional sidebars in favor of a 3-ring orbital astrolabe with a central telemetry HUD readout (see ADR-023).

---

## 2. Color System & Module Branding

| Module | Signature Hex | Accent Role |
|---|---|---|
| **Home / Mission Control** | `#ffffff` | Stark white executive focus |
| **Productivity Hub** | `#3b82f6` | High-alert cognitive blue |
| **Time OS** | `#f59e0b` | Solar gold / amber temporal focus |
| **Mind OS** | `#a855f7` | Contemplative cosmic violet |
| **Winter Arc** | `#22d3ee` | Glacial cyan protocol accent |
| **Fitness OS** | `#ef4444` | Blood red physical exertion |
| **Learning OS** | `#eab308` | Luminescent amber mastery |
| **Finance OS** | `#10b981` | Emerald capital discipline |
| **Data Lab** | `#6366f1` | Deep indigo telemetry signals |
| **Reports** | `#f43f5e` | Crimson field debriefs |
| **Admin** | `#8b5cf6` | Cybernetic purple system console |

---

## 3. Standard Navigation & Components

### Kinetic Astrolabe Orb (`AstrolabeOrbNav.tsx`)
- Concentric 3-ring orbital menu anchored to the bottom/side viewport.
- Orbital radii: Desktop (96px, 147px, 198px), Mobile (75px, 119px, 163px).
- Central Avatar Core: In expanded state, hovering any module icon projects the module name, signature color, and back-glow directly into the central core rather than overlapping floating tooltips.
- Direct quick actions for `/profile`, `/admin`, and Supabase `signOut`.

### Module Header
```tsx
<ModuleHeader title="Fitness OS">
  <LocalNavLink to="workouts" label="Workouts" />
  <LocalNavLink to="library" label="Library" />
  <LocalNavLink to="pr" label="PRs" />
</ModuleHeader>
```

### Global Overlays
- `AstrolabeOrbNav`: Universal spherical navigation nexus.
- `GlobalTimerBar`: Fixed floating timer bar when a focus session is actively running.
- `PiPTimer`: Document Picture-in-Picture window supporting external timer controls.
- `SystemFeedbackToast`: Micro-interaction status toast.
- `CommandPalette`: Keyboard shortcut modal (`Ctrl+K` / `Cmd+K`).
