# LIFE OS — AGENTS ARCHITECTURE DOCUMENT

Welcome to the official multi-agent development specification for **Life OS**.

This document exists so AI coding agents (Codex, GPT, Gemini, etc.) can understand the architecture, development workflow, and system design without requiring additional explanations.

This file acts as the **engineering constitution** for the project.

---

# PROJECT OVERVIEW

Life OS is a personal operating system for managing life data including:

- habits
- tasks
- journaling
- progress tracking
- finances
- analytics

The goal is to create a **long-term personal intelligence engine** capable of tracking years of behavioral data via a nested, domain-isolated interface.

---

# CORE PHILOSOPHY

Life OS is built on six pillars:

1. Awareness  
2. Mind  
3. Body  
4. Execution  
5. Growth  
6. Cognitive Protection (Strict separation of reflection and execution)

Every module connects back to these pillars.

---

# SYSTEM MODULES (DOMAIN WORKSPACES)

Life OS contains the following major systems. These are NOT flat pages; they are nested workspaces with their own internal dashboards and navigation.

## Mission Control (The Global Aggregator)

The central dashboard providing overview statistics across all modules.

Displays summaries ONLY:

- active habits (from Mind OS)
- pending tasks (from Productivity Hub)
- journal activity (from Mind OS)
- progress metrics (from Progress Hub)
- financial snapshot (from Finance OS)

**CRITICAL RULE:** Mission Control **does not show raw data**. It only displays **aggregated summaries** fetched from domain-specific widgets. It is a read-only macro view.

---

## Mind OS (The Reflection Workspace)

Responsible for cognitive systems and emotional awareness.

**Cognitive Boundary:** Execution items (like tasks, deadlines) are STRICTLY BANNED from this interface to prevent anxiety during reflection.

Modules:

- Mind OS Dashboard (Mood charts, habit streaks)
- Habit Tracker
- Journal System
- Goals & Vision

---

## Fitness OS (The Physical Workspace)

Tracks physical development.

Modules:

- Fitness OS Dashboard (Today's split, weekly effort)
- workout tracking
- exercise logs
- progress tracking
- strength progression

---

## Productivity Hub (The Execution Workspace)

Execution layer of Life OS.

**Cognitive Boundary:** This is a high-focus zone. Do not mix emotional journaling features here.

Modules:

- Productivity Dashboard (Daily focus, upcoming deadlines)
- task manager (Kanban)
- calendar
- planning engine
- bookmark vault

---

## Progress Hub (The Learning Workspace)

Tracks long-term and short-term learning progress.

Modules:

- Progress Hub Dashboard
- programming progress
- learning milestones
- personal challenges

---

## Finance OS (The Financial Workspace)

Tracks financial awareness.

Modules:

- Finance Dashboard (Monthly spend charts using full-width CSS grids)
- spending tracker
- income tracker
- financial goals
- monthly analysis

---

# TECH STACK

Frontend:

React  
Vite  
TailwindCSS  
React Query (Domain-prefixed cache keys)
React Router (Nested routing)

Backend:

Supabase  
PostgreSQL (Row Level Security enabled)

Execution:

Node  
Vite dev server  

---

# PROJECT STRUCTURE & AGENT RESPONSIBILITY

The project uses a **Strict Domain-Driven Feature Architecture**.

Agents MUST isolate features inside their specific OS folders (e.g., `src/features/mind-os/`). Flat directory structures are explicitly forbidden to ensure system scalability and cognitive isolation.