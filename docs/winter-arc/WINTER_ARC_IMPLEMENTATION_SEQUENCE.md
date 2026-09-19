---
title: "Winter Arc — Implementation Sequence"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc Implementation Sequence & Multi-Agent Model

This document outlines the authoritative implementation sequence and agent responsibilities for the Winter Arc evolution of Life OS.

## Implementation Order

**DO NOT immediately launch every specialist into production coding.**
The following sequence (Phases A through K) is mandatory.

### PHASE A: Visual Audit
- Audit the current UI foundations.
- Identify anti-patterns and areas where "generic SaaS" patterns exist.
- **Agent:** Design Critic

### PHASE B: Visual Language Refinement
- Finalize and approve `WINTER_ARC_VISUAL_LANGUAGE.md`.
- Finalize `WINTER_ARC_PAGE_BLUEPRINTS.md`.
- Create color, typography, spacing, and component rules.
- **Agent:** Design Director
- **Gate:** 🛑 *Human Review*

### PHASE C: Global Shell / Component Foundation
- Build the core layout structures, sidebar, global navigation, and responsive containers.
- Establish the baseline Tailwind/CSS config that all specialists will use.
- **Agent:** Design Director & Home Specialist

### PHASE D: Home + Profile + Arc
- **Home:** Implementation of the Time-of-Day logic, intention/execution/reflection splits.
- **Profile:** Identity layer, avatar logic, canonical attributes.
- **Arc:** Season tracking, milestones.
- **Agents:** Home Specialist, Identity Specialist, Arc Specialist
- **Gate:** 🛑 *Human Review*

### PHASE E: Mind + Work + Body + Learning
- **Mind:** Journal, Life Pulse, Recovery mode.
- **Work:** Focus, missions, tasks.
- **Body:** Fitness, workouts, recovery integration.
- **Learning:** Knowledge Journey, reading sessions, continuity.
- **Agents:** Mind Specialist, Work Specialist, Body Specialist, Learning Specialist

### PHASE F: Progress + Data Lab + Reports
- **Progress:** Level, XP, achievements.
- **Data Lab:** Cross-domain telemetry analysis, heatmaps.
- **Reports:** Generated summaries, export capabilities.
- **Agents:** Identity Specialist (Progress), Data/Intelligence Specialist

### PHASE G: Native Android Foundation
- Setup Kotlin + Jetpack Compose environment.
- Setup authentication, basic navigation architecture, offline data stores (Room).
- **Agent:** Android Specialist
- **Gate:** 🛑 *Human Review*

### PHASE H: Android Full Product Surfaces
- Implement native screens for Home, Mind, Work, Body, Learning, Arc, Profile.
- Establish Quick Actions.
- **Agent:** Android Specialist
- **Gate:** 🛑 *Human Review*

### PHASE I: Android Widgets + Notifications + Deep Links
- Implement What Matters Now, Momentum, Focus, Quick Log widgets.
- Implement contextual push notifications via WorkManager/FCM.
- Connect deep links.
- **Agent:** Android Specialist

### PHASE J: API / MCP Integration
- Solidify the external interface logic for external integrations.
- Implement specialized MCP tools.
- **Agent:** Systems Guardian

### PHASE K: AI Layer
- Provide weekly/monthly analysis, reflection assistance, pattern explanation.
- AI must remain a downstream interpretation layer, never a source of truth.
- **Agent:** Data / Intelligence Specialist

---

## Multi-Agent Model & Responsibilities

The implementation of the Winter Arc is driven by autonomous, highly-specialized agents.

### DESIGN DIRECTOR
- Owns global visual language, component system, typography, spacing, motion, themes, consistency.

### HOME SPECIALIST
- Owns Home, Mission Control evolution, daily state logic.

### IDENTITY SPECIALIST
- Owns Profile, Avatar, Attributes, Progression, Achievements.

### ARC SPECIALIST
- Owns Seasons, Winter Arc, milestones, season history.

### MIND SPECIALIST
- Owns Mind, Pulse, Recovery, Reflection.

### WORK SPECIALIST
- Owns Work, Productivity, Focus.

### BODY SPECIALIST
- Owns Fitness, Body, physical avatar integration.

### LEARNING SPECIALIST
- Owns Learning, Books, Videos, Talks, Knowledge Journey.

### DATA / INTELLIGENCE SPECIALIST
- Owns Data Lab, Reports, Experiments, historical analysis, AI layer.

### ANDROID SPECIALIST
- Owns Native Android (Kotlin, Jetpack Compose), mobile UX, widgets, notifications, deep links, native capabilities, offline behavior.

### SYSTEMS GUARDIAN
- Owns telemetry, API contracts, data integrity, RLS, duplication prevention, regression monitoring, architectural drift.

### DESIGN CRITIC
- Owns visual quality, consistency, usability, accessibility, responsive behavior, anti-pattern detection.

## Agent Autonomy
Agents **SHOULD** make implementation decisions. They should not require human approval for every small detail.
When ambiguity exists:
1. Inspect current code.
2. Inspect canonical documentation.
3. Inspect existing data/contracts.
4. Determine the simplest solution.
5. Document the decision.
6. Implement and verify.

*Agents may propose improvements but may NOT silently introduce new architecture.*
