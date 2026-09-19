---
title: "Winter Arc — Room & Page Blueprints"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc: Page Blueprints

This document outlines the architectural blueprints for every major surface in Life OS. It enforces strict narrative distinctiveness between domains.

## Core Directives
- **Dense underneath, calm on the surface.**
- **No generic dashboarding.**
- **Purpose-driven hierarchy.**

---

## 1. HOME (The Daily Experience)

*Note: Mission Control is no longer the primary landing experience. It has been moved to a secondary System/Command diagnostic surface.*

**Purpose:** The primary daily experience and anchor of Life OS.
**User Question:** "What matters now?"

**Hierarchy & Layout:**
1.  **Primary Viewport (Calm Surface):** Aggressively minimizes noise. Displays the current state, ONE important directive/intention, and ONE meaningful action (dependent on Time-of-Day).
2.  **Avatar Presence:** Contextual integration reacting to Time-of-Day and Life State.
3.  **Progressive Disclosure:** Secondary information (tasks, habits, raw progress) is completely hidden behind interaction or deeper navigation.

**Time-of-Day Shifts:**
- *Morning:* Intention setting.
- *Afternoon:* Current Focus / Active Mission.
- *Evening:* Reflection entry.
- *Night:* Closure sequence.

---

## 2. PROFILE (Personal Identity Dossier)

**Purpose:** The deepest representation of identity.
**User Question:** "Who am I becoming?"

**Hierarchy & Layout:**
1.  **Hero:** The avatar and identity (Level, Title, Life State) dominate the macro composition.
2.  **Attributes:** Rendered organically using typography, scale, spatial relationships, or environmental effects. *No generic dashboard grids or progress bars.*
3.  **Narrative Progression:** Achievements and season history presented as a personal evolution dossier, not an analytics table.

---

## 3. ARC (The Season)

**Purpose:** The macroscopic view of the current chapter.
**User Question:** "What chapter am I living?"

**Hierarchy & Layout:**
1.  **Narrative Chapter:** Presented like a chapter title page in a book. Avoids Jira-like timelines, sprints, or burndown charts.
2.  **Atmosphere:** Deep seasonal atmosphere and environmental evolution.
3.  **Transformation:** Milestones act as narrative markers of personal transformation. Time feels experienced rather than merely counted.

---

## 4. MIND (The Internal State)

**Purpose:** Emotionally human reflection and psychological tracking.
**User Question:** "What is happening internally?"

**Hierarchy & Layout:**
1.  **Tone:** Human-centered, supportive, non-judgmental.
2.  **Recovery/Grief:** Completely avoids gamifying difficult periods. Focuses purely on understanding, reflection, and patterns rather than streak preservation.
3.  **Journal & Pulse:** High whitespace, editorial typography.

---

## 5. WORK (The Execution)

**Purpose:** Professional and personal output management.
**User Question:** "What should I execute now?"

**Hierarchy & Layout:**
1.  **Mental Model:** QUEUE / FLOW / EXECUTION.
2.  **Design:** Temporal and highly structured. Instrument-mode typography (monospaced data).
3.  **Anti-pattern:** Must NOT look like a BI dashboard. It is a prioritized terminal for human output.

---

## 6. LEARNING (The Knowledge Journey)

**Purpose:** Tracking intellectual growth.
**User Question:** "What am I building inside my mind?"

**Hierarchy & Layout:**
1.  **Mental Model:** Spatial and journey-oriented.
2.  **Design:** Explores library, learning maps, and paths. Emphasizes continuity (current book, progress, sessions, takeaways).
3.  **Anti-pattern:** Must NOT be a simple CRUD list presentation.

---

## 7. BODY (The Physical System)

**Purpose:** Physical progression and consistency.
**User Question:** "How is my physical system progressing?"

**Hierarchy & Layout:**
1.  **Design:** Physical-mode typography (bolder weights, grounded).
2.  **Content:** Training, physical progress, trends, and avatar body integration.

---

## 8. SYSTEM / COMMAND (Diagnostic Surface)

**Purpose:** Diagnostic engine read-out (The former Mission Control).
**User Question:** "What is the health of the underlying telemetry?"

**Hierarchy & Layout:**
1.  **Design:** Instrument mode. Dense grid of Vitals, Subsystem status, and Event Logs.
2.  **Visibility:** Secondary. Only accessed when debugging or verifying data intake.

---

## 9. DATA LAB (Deferred)

**Purpose:** Advanced telemetry and cross-domain correlation.
**Status:** Deferred from foundational implementation.
**Future Design Requirement:** Must feel like **PERSONAL DATA EXPLORATION**, absolutely avoiding the look of Tableau, Power BI, or standard admin analytics.

---

## 10. ANDROID (The Daily Companion)

**Purpose:** A first-class native product for daily, on-the-go interaction.
**Architecture:** Kotlin + Jetpack Compose (Locked).

**Native Execution Requirements:**
1.  **Interaction:** Fluid bottom sheets, native gestures, haptics.
2.  **Widgets:** Deeply integrated Momentum, Today's Mission, Focus, and Quick Log widgets.
3.  **Notifications:** Actionable, contextual, deep-linked directly to native views.
4.  **Resilience:** WorkManager for deferred writes, local persistence for offline-friendly behavior.
5.  **Anti-pattern:** Do NOT compress desktop layouts into mobile. Android owns its own UI layer.
