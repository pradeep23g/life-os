# CHANGELOG

All notable changes to the Life OS platform will be documented in this file.

> **Historical Archive:** For historical releases prior to 2.0.0 (Milestones 1 through 9), see [`docs/historical/CHANGELOG.md`](docs/historical/CHANGELOG.md).

## [2.0.0-winter-arc] - 2026-09-17

### Added
- **Kinetic Astrolabe Orb Navigation:** Spatial 3-tier orbital navigation HUD with tight radii, central module name hover readout, signature reactive neon glows, and a11y navigation labels.
- **Time OS // Chronos Overhaul:** 24-hour horizontal Gantt timeline, Monolith timer, borderless monospace Chronos Analytics ledger with ASCII meters, and bioluminescent harmonic root growth visualizer with 12-week density grid.
- **Fitness OS Kinetic Ledger:** Step-by-step active set logging with dual hardware keyboard / touch numeric inputs, collapsible tactical numpad, and batch command parsing (`Bench 3x10@225`).
- **Anatomy Wireframe Visualizer:** Cybernetic SVG wireframe anatomy rendering target muscle groups dynamically across the architectural movement catalog.
- **Cross-Domain Temporal Sync:** Automatic background synchronization of completed workout sessions into Time OS under the `Fitness` bucket with `TIME_SESSION_LOGGED` telemetry.
- **Winter Arc Protocol Modules:** Dedicated Arc seasonal horizon countdown, profile dossier with capability crests and chronicle timeline, and field reporting consoles.

### Changed
- **Personal Records System:** Refactored PR tracking to sort logs chronologically ascending, support isometric hold durations, and celebrate achievements as "PEAK RECORD".
- **Module Theme Engine:** Refactored `useModuleColors` with React `useSyncExternalStore` for instant global theme propagation.
- **Exercise Catalog:** Reorganized exercise browsing into dual modes: Primary Muscle and Movement Pattern (Squat, Hinge, Push, Pull, Core, Carry).

### Removed
- Retired legacy chart sprawl in Data Lab and legacy Fitness dashboard stubs in favor of streamlined, high-signal monospace ledgers.

### Security & Verification
- Verified zero TypeScript compilation errors (`tsc -b` exit 0).
- Verified zero ESLint warnings and errors (`eslint src` exit 0).
- Verified successful production build (`npm run build` exit 0).
