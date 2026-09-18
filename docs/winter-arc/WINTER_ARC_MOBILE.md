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
