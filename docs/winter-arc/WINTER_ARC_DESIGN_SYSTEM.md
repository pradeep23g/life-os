# Winter Arc Design System

This document outlines the visual identity, themes, time-of-day modes, and design language for the Winter Arc campaign in Life OS.

## Current Design System [CURRENT]

*   **True-black OLED palette:** `#000000` background, `#0a0a0a` surfaces, `#222222` borders
*   **Typography:** Slate typography tokens
*   **Desktop:** Collapsible sidebar (80px compact / 288px expanded)
*   **Mobile:** Slide-out drawer
*   **Global overlays:** GlobalTimerBar, PiPTimer, SystemFeedbackToast, CommandPalette
*   **Styling:** Tailwind CSS 3.4 with custom surface and border colors
*   **Theming:** No theme switcher currently (locked to dark mode)

## Winter Arc Design Philosophy [FUTURE]

*   **Personal command center + identity system + living dashboard**
*   **Avatar-centered experience**
*   **Individual statistics as first-class UI elements**
*   **Calm, focused, intentional**
*   **Accessible** (WCAG AA minimum)
*   **Responsive** (mobile-first consideration for shared components)

## Core System Elements [FUTURE]

### Typography
*   **Hierarchy:** Establish clear hierarchy for H1-H6, body, captions, labels.
*   **Families:** Consider Inter, JetBrains Mono (code), or system font stack.
*   **Emphasis:** Use weight hierarchy for emphasis, minimizing color reliance for hierarchy where possible.

### Spacing System
*   **Base Unit:** 4px base unit.
*   **Scale:** Consistent padding/margin scale.
*   **Application:** Standardized card spacing, section spacing, and page margins.

### Surface System
*   **Background layers:** base, surface, elevated, overlay.
*   **Border treatment:** subtle, standard, emphasized.
*   **Shadow approach:** Minimal for true-black OLED base.

## Five Curated Themes [FUTURE]

Do not lock exact hex codes; establish the design language and philosophy for each.

| Theme | Character | Use Case |
|-------|-----------|----------|
| **Winter Arc** | Sharp, focused, seasonal | Active season |
| **Dawn** | Warm, intentional | Morning energy |
| **Midnight** | Quiet, minimal | Night/calm |
| **Command** | Dense, analytical | Data-heavy work |
| **Recovery** | Low-stimulation | Low momentum |

**For each theme, the following must be defined:**
*   Primary color palette and Surface colors
*   Accent colors
*   Typography adjustments (weight, tracking)
*   Motion/animation level
*   Density level
*   Notification styling
*   Avatar environment styling

## Navigation [FUTURE]

*   **Desktop:** Enhanced sidebar with avatar, level indicator, quick stats.
*   **Mobile:** Bottom navigation bar + slide-out drawer.
*   **Keyboard:** Command palette (Cmd/Ctrl+K) for quick navigation.

## Component Placements & Behaviors [FUTURE]

### Avatar Placement
*   **Mission Control:** Hero position, large avatar with stats.
*   **Sidebar:** Small avatar with level indicator.
*   **Mobile:** Header area.
*   **Profile/Settings:** Full avatar with extensive customization.

### Stats Presentation
*   **Radial progress** for attributes.
*   **Sparklines** for trends.
*   **Progress bars** for goals/seasons.
*   **Numeric displays** for key metrics.

### Life State Presentation
*   **Visual badge/indicator**
*   **Color-coded state**
*   **Brief explanation text**
*   **Placement:** Visible on Mission Control and mobile dashboard.

## Responsive Behavior & Accessibility [FUTURE]

### Responsive Layouts
*   **Breakpoints:** mobile (<640px), tablet (640-1024px), desktop (>1024px).
*   **Mobile:** Stack layout, bottom nav, simplified cards.
*   **Tablet:** Hybrid layout, collapsible sidebar.
*   **Desktop:** Full sidebar, multi-column layouts.

### Motion
*   **Transitions:** Subtle transitions (150-300ms).
*   **Routing:** Page transitions (React Router).
*   **Loading States:** Loading skeletons (not spinners).
*   **Restraint:** No gratuitous animation.
*   **Accessibility:** Reduced motion support `prefers-reduced-motion`.

### Accessibility Basics
*   WCAG AA contrast ratios minimum.
*   Full keyboard navigation support.
*   Screen reader compatibility.
*   Clear focus indicators.

## Time-of-Day Modes [FUTURE]

Time-of-day is **NOT** just a color theme - it transforms information density and layout to match cognitive state.

| Mode | Time Range | UI Purpose | Info Density | Key Actions |
|------|-----------|------------|-------------|-------------|
| **Morning** | 5:00-12:00 IST | Intention setting | Low | Today's priority, Season objective, Important commitments, Morning thought, Intention prompt |
| **Afternoon** | 12:00-17:00 IST | Execution | High | Current mission, Tasks, Focus timers, Live progress, Quick actions |
| **Evening** | 17:00-21:00 IST | Reflection | Medium | Today's accomplishments, Gaps, Journal, Workout review, Learning log |
| **Night** | 21:00-5:00 IST | Closure | Low | Day summary, Momentum, Night reflection, Tomorrow priority, Evening Sync |

## Periodic Thoughts [FUTURE]

*   **Content:** Contextual prompts (not generic quotes). Actionable and reflective.
*   **Categories:** Discipline, Identity, Failure, Patience, Focus, Ambition, Learning, Resilience, Recovery, Mortality, Growth.
*   **Schedule:** Morning thought, Afternoon thought, Evening thought, Night reflection.
*   **Examples:** "What did you avoid today?", "What made today's execution different?", "What are you carrying into tomorrow?"
*   **Display:** Subtle card in appropriate time-of-day mode.
*   **Interaction:** Optional engagement, not forced.

---

## Related Documentation
*   [UI System](../architecture/UI_SYSTEM.md)
*   [Winter Arc Master Plan](WINTER_ARC_MASTER_PLAN.md)
*   [Winter Arc Architecture](WINTER_ARC_ARCHITECTURE.md)
