# LIFE OS — UI SYSTEM

This document defines the official UI/UX system for Life OS.

Its purpose is to guide human developers and AI agents (Codex, GPT, Gemini) so the interface remains:

• simple  
• efficient  
• lightweight  
• responsive  
• cognitively optimized  

The UI must prioritize **clarity and speed over visual complexity**.

---

# UI PHILOSOPHY & COGNITIVE BOUNDARIES

Life OS is not a decorative application. It is a **daily operating system for life management**.

Therefore, the interface must follow these principles:

• minimal visual noise  
• fast interaction  
• readable typography  
• low resource consumption  

**CRITICAL RULE: Cognitive Boundaries**
Life OS uses a nested architecture to protect human cognitive load. 
Reflection features (Mind OS) must NEVER be mixed with Execution features (Productivity Hub). 
Showing pending tasks inside a journaling space triggers the Zeigarnik Effect (task anxiety). AI agents must strictly isolate these features into their designated Module Workspaces.

Animations and complex visual effects must be avoided entirely.

---

# COLOR SYSTEM

Life OS uses a **two-color dominant theme** similar to Notion.

Each theme contains:

1 neutral base color  
1 accent color  

The accent color highlights:

• active elements  
• buttons  
• progress indicators  

---

# DARK THEME (PRIMARY)

Dark theme is the default interface.

Base colors:

Background
#0f172a

Surface
#1e293b

Border
#334155

Text colors:

Primary text
#f1f5f9

Secondary text
#94a3b8

Accent color example:

Red
#ef4444

Alternative accents allowed:

blue
green
orange

Only **one accent color may be active at a time**.

---

# LIGHT THEME

Light theme must mirror the dark theme structure.

Base colors:

Background
#ffffff

Surface
#f8fafc

Border
#e2e8f0

Text:

Primary
#0f172a

Secondary
#475569

Accent color remains the same as dark theme.

---

# TYPOGRAPHY

Typography must prioritize readability.

Recommended font:

Inter

Fallback:

system-ui

Font sizes:

Page title
text-3xl

Section title
text-xl

Card title
text-lg

Body
text-sm

Avoid large typography scaling.

---

# LAYOUT SYSTEM & GRID ARCHITECTURE

Life OS follows a **card-based layout** combined with a **flexible CSS Grid**.

### Consistent Frame
All data widgets and interface elements must sit inside a standard card:

rounded-xl
border
padding
surface background

Example Tailwind classes:

rounded-xl
border border-slate-700
bg-slate-900
p-4

Cards must contain:

• clear header  
• minimal controls  
• consistent spacing  

### Flexible Canvas (CSS Grid)
While card styles must remain uniform, the width of the cards should adapt to the data they hold. 
Agents should utilize CSS Grid classes like `col-span-2` or `col-span-full` for domain-specific visualisations (e.g., a wide line chart for Finance OS spending analytics).

---

# NAVIGATION ARCHITECTURE (NESTED ROUTING)

Life OS uses a two-tier navigation system to reduce cognitive overload.

### Tier 1: Global Sidebar (The Pillars)
The sidebar acts as the macro-navigator. It ONLY links to Master Modules.

Items:

Mission Control
Mind OS
Productivity Hub
Fitness OS
Finance OS
Progress Hub

Rules:

• always visible on desktop  
• collapsible on mobile  
• icons should be minimal  

### Tier 2: Local Module Navigation (Sub-navigation)
When a user clicks into a module (e.g., Mind OS), the main workspace renders a secondary top-navigation bar (tabs) specific to that module. 

Example for Mind OS Workspace:
[ Dashboard ]  [ Habit Tracker ]  [ Journal ]

---

# MODULE SPECIFICATIONS

Each OS Pillar has its own distinct structure.

## 1. Mission Control (Master Dashboard)
Mission Control displays **system summaries only**. It acts as an aggregator.

Example layout:

Active Habits (Pulled from Mind OS)
Pending Tasks (Pulled from Productivity Hub)
Daily Split (Pulled from Fitness OS)
Average Mood (Pulled from Mind OS)

Cards should be displayed in a **grid layout**.

Desktop:

4 column grid

Mobile:

1 column stack

---

## 2. Mind OS Workspace
The cognitive reflection zone. 

**Strict UI Rule:** Tasks and execution-based deadlines are BANNED from this interface. 

Sub-pages:
• Mind OS Dashboard (Wide charts for mood trends, habit streaks)
• Habit Tracker
• Journal System

---

## 3. Productivity Hub Workspace
The execution zone. 

Sub-pages:
• Productivity Dashboard (Upcoming deadlines, daily focus)
• Tasks (Kanban)
• Planning Engine

---

## 4. Fitness OS & Finance OS Workspaces
These modules require domain-specific dashboards.
• Fitness OS Dashboard: Focus on effort tracking (Today's split, weekly consistency).
• Finance OS Dashboard: Focus on behavior awareness (Monthly spending overview using `col-span-full` charts).

---

# COMPONENT LEVEL SPECIFICATIONS

### Habits UI
Habit cards must be extremely simple.

Example:

Read Book
12 / 30 pages
[ + ]

Rules:

• one action button  
• visible progress  
• progress bars should be subtle  

### Tasks UI
Tasks use a **Kanban layout**.

Columns:

To Do
Doing
Done

Cards contain:

task title
priority label

Avoid complex drag animations. Use simple click-to-move menus or highly optimized lightweight dragging to maintain UI speed.

### Journal UI
Layout:

Mood selector
Recent Entries List | Journal Editor

Mood selector must be button based.

😞
😐
🙂
😄
🔥

*(Note: Full Calendar navigation is reserved for Phase 6 Planning Engine)*

---

# RESPONSIVE DESIGN

Life OS must function well on:

• laptops  
• tablets  
• mobile devices  

Responsive rules:

Desktop:

global sidebar visible
nested local navigation at top
multi-column grid layouts

Mobile:

global sidebar collapses into hamburger menu
cards stack vertically
local navigation becomes horizontal scrollable tabs

---

# PERFORMANCE RULES

To keep the UI lightweight:

Avoid:

• heavy UI component libraries (e.g., Material UI, Ant Design)
• large animation frameworks (e.g., Framer Motion for simple things)
• unnecessary React re-renders  

Prefer:

• TailwindCSS  
• small, strictly typed reusable components  
• React Query caching to prevent loading spinners  

---

# ACCESSIBILITY

UI should maintain:

• readable color contrast (especially on secondary text)
• full keyboard navigation  
• clear focus states for accessibility

---

# DESIGN RESTRICTIONS FOR AI AGENTS

Agents must NOT introduce:

• excessive color palettes  
• complex CSS gradients  
• unnecessary hover animations  
• flat routing that mixes domains

Life OS should feel calm, structured, and functional.

---

# UI DEVELOPMENT WORKFLOW

When implementing UI features, agents must follow this process:

1. identify module boundary (e.g., Does this belong in Mind OS or Productivity Hub?)
2. define nested route mapping
3. build component structure
4. implement Tailwind styling using consistent card frames
5. utilize CSS Grid for responsive layouts
6. verify responsive behavior on mobile/desktop viewports

---

# FINAL PRINCIPLE

The UI must always prioritize:

clarity
speed
focus
cognitive safety

Life OS should feel like a **personal command center**, not a decorative productivity tool.