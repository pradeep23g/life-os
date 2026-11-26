---
title: "Winter Arc — Mobile & Android Product Directive"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc: Android Product Directive

## 1. Core Philosophy

**ANDROID IS NOT A MINIATURE WEBSITE.**
It is a **FULL-SCALE NATIVE LIFE OS PRODUCT**.

- **Desktop/Web:** LIFE OS COMMAND CENTER
- **Android:** LIFE OS DAILY COMPANION

The Android application is the user's daily physical interface with Life OS. It shares API contracts, canonical data, and domain semantics with the web client, but it **does not share UI code**. It must exploit the native Android environment.

## 2. Technical Foundation

- **Platform:** Native Android (Kotlin + Jetpack Compose).
- **Architecture:** Offline-friendly where appropriate, utilizing local caching and sync to ensure resilience against intermittent connectivity.
- **Background:** WorkManager for deferrable work, AlarmManager only when exact timing is justified.

## 3. Core Experience Surfaces

The Android app must eventually support substantial portions of the Life OS ecosystem:

- **HOME:** Current state, current mission, season progress, quick actions.
- **MIND:** Life Pulse, journal, quick reflection, mood/energy/clarity.
- **WORK:** Focus timers, tasks, current mission.
- **BODY:** Workout logging, training state.
- **LEARNING:** Reading progress, quick notes.
- **TIME:** Daily rhythm, relevant schedule.
- **PROGRESS:** Level, XP, achievements, streaks.
- **ARC:** Current season progress and milestones.
- **PROFILE:** Identity, avatar, key statistics.

## 4. Android-Native Capabilities

The Android Specialist must actively evaluate and implement native capabilities:
- **Widgets**
- **Notification Channels & Actions**
- **Deep Links** (e.g., Notification -> Reflection, Widget -> Current Mission)
- **Background Scheduling**
- **Local Persistence & Cache**
- **Biometric Security** (where appropriate)
- **Share Intents & Shortcuts**
- **Haptics & Adaptive Layouts**

## 5. Widgets

Widgets must answer useful questions and provide immediate value without opening the app.
- **WHAT MATTERS NOW:** Current mission / priority.
- **MOMENTUM:** Current state / trend.
- **TODAY:** Progress, habits, important actions.
- **FOCUS:** Active session / start action.
- **QUICK LOG:** Pulse, workout, journal, habit.
- **ARC:** Season progress.
- **PROGRESS:** Level, XP, achievements.

*Do not create widgets merely because they are technically possible.*

## 6. Notifications

Notifications belong primarily to Android.
- **Goal:** "Bring Life OS into real life."
- **Anti-Goal:** "Force the user to open Life OS."
- Notifications must be **contextual, scarce, actionable, dismissible, and user-controlled**.
- **No manipulative mechanics** (e.g., "YOUR STREAK IS DYING!!!").
- Prefer informative updates: "Life OS · Evening: You haven't closed the day yet."

## 7. Quick Actions

Design fast actions for common operations with extremely low interaction cost:
- Log Pulse
- Start Focus
- Complete Habit
- Log Workout
- Log Journal
- Update Reading Progress
- Mark Task Complete
- Open Current Mission

## 8. Navigation

**Do not simply reproduce desktop sidebar navigation.**
Explore mobile-native navigation for primary surfaces (Home, Mind, Work, Body, Learning, Arc/Profile). Quick actions must be accessible without deep navigation.

---

## 9. Current Implementation Status (v1 / November 2026)

The Android companion application has realized its foundational architecture and primary core surfaces under `/android` (`com.lifeos.companion`):

### 9.1 Implemented & Verified (Phases G1–G4)
- **Scaffolding & Security:** Single-module Gradle Kotlin DSL (`android/app`) targeting Android 15 (`minSdk = 29`, `targetSdk = 35`, `compileSdk = 35`), Supabase Kotlin SDK 3.1.4, and whole-app `BiometricPrompt` authentication gate.
- **Contract Synchronization:** `scripts/sync-android-contracts.mjs` generates `android/app/src/main/java/com/lifeos/companion/telemetry/EventTypes.kt` directly from `src/lib/eventTaxonomy.ts` (enforced via `npm run verify:docs`).
- **Offline Persistence & Outbox Sync:** Room database (`LifeOsDatabase`) caching habits, logs, tasks, and reflections; WorkManager `OutboxSyncWorker` flushing mutations in FIFO order to Supabase with exponential backoff and recording canonical `public.events` telemetry in `Asia/Kolkata` time (`event_date_ist`).
- **Tactile Companion Surfaces:**
  - `HomeScreen`: The Porch status dashboard (active timer, habit count, task count, journal CTA).
  - `FocusScreen`: Powered by `FocusTimerService` (Foreground Service with persistent chronometer notification and play/pause/stop actions), enforcing single-timer database constraints (`time_logs`).
  - `HabitsScreen`: Habit checklist, binary and target count steppers, and 5/month streak break healing (`habit_streak_heals`).
  - `TasksScreen`: Task backlog, priority indicators, deadline tags, and focus handoff.
  - `JournalScreen`: 1–5 mood scoring with 3 structured contemplative prompts.
  - `ProfileSettingsScreen`: Custom reminder times, biometric toggle, and test alarm triggers.
- **Home Screen Widgets:** Jetpack Glance `FocusGlanceWidget` (1-tap start/stop) and `HabitGlanceWidget` (1-tap habit toggle).
- **Exact Alarms & Deep Links:** `AlarmManager` exact triggers for 19:30 IST Tasks and 22:00 IST Journal deep links (`lifeos://tasks/today`, `lifeos://mind/journal`) with `BOOT_COMPLETED` rescheduling.
- **Mobile Astrolabe:** `AstrolabeNavigationShell.kt` providing 3-state navigation (Pill ↔ single-Orb ↔ 2-ring orbital blur overlay) in True-Black OLED styling (`#000000`).

### 9.2 Planned Work (Phase H Companion Expansion)
- **Fitness OS:** Workout set-by-set logging, movement pattern catalog, and rapid touch numpad.
- **Finance OS:** Need vs Want behavioral expense entry.
- **Learning OS:** Study session logging and roadmap progression view.
- **Arc Engine:** Seasonal campaign countdown, chapter milestones, and strict pace ratio badges.
- **Field Reports:** Sunday dossier mobile reading surface.
- **Lock Screen:** Android lock screen widget and quick-action notification tiles.
