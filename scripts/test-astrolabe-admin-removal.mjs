import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_MODULE_COLORS } from '../src/lib/useModuleColors.ts'

const astrolabePath = path.resolve('src/layout/AstrolabeOrbNav.tsx')
const astrolabeContent = fs.readFileSync(astrolabePath, 'utf8')
const profileOpsPath = path.resolve('src/features/profile/components/ProfileSystemOperations.tsx')
const profileOpsContent = fs.readFileSync(profileOpsPath, 'utf8')
const commandPalettePath = path.resolve('src/components/CommandPalette.tsx')
const commandPaletteContent = fs.readFileSync(commandPalettePath, 'utf8')
const appPath = path.resolve('src/App.tsx')
const appContent = fs.readFileSync(appPath, 'utf8')
const uiSystemPath = path.resolve('docs/architecture/UI_SYSTEM.md')
const uiSystemContent = fs.readFileSync(uiSystemPath, 'utf8')

test('AstrolabeOrbNav: Admin Console orb node is completely removed', () => {
  // Must NOT contain admin node in ORBIT lists
  assert.equal(astrolabeContent.includes("id: 'admin'"), false, "AstrolabeOrbNav must not contain an orb with id: 'admin'")
  assert.equal(astrolabeContent.includes("path: '/admin'"), false, "AstrolabeOrbNav must not contain an orb with path: '/admin'")
  assert.equal(astrolabeContent.includes("ShieldAlert"), false, "AstrolabeOrbNav must not import or use ShieldAlert")
})

test('AstrolabeOrbNav: Orbit topology adheres strictly to canonical 9-node layout', () => {
  // Extract ORBIT_1 and ORBIT_2 blocks cleanly using delimiter comments / declarations
  const orbit1Section = astrolabeContent.slice(
    astrolabeContent.indexOf('const ORBIT_1: NavOrbItem[] = ['),
    astrolabeContent.indexOf('const ORBIT_2: NavOrbItem[] = [')
  )
  const orbit1Ids = [...orbit1Section.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])
  assert.deepEqual(orbit1Ids, ['productivity-time', 'mind-os', 'winter-arc', 'fitness-os'], 'Orbit 1 must contain exactly 4 canonical nodes')

  const orbit2Section = astrolabeContent.slice(
    astrolabeContent.indexOf('const ORBIT_2: NavOrbItem[] = ['),
    astrolabeContent.indexOf('export function AstrolabeOrbNav()')
  )
  const orbit2Ids = [...orbit2Section.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])
  assert.deepEqual(orbit2Ids, ['learning-os', 'finance-os', 'data-reports', 'system', 'profile'], 'Orbit 2 must contain exactly 5 canonical nodes')

  assert.equal(orbit1Ids.length + orbit2Ids.length, 9, 'Total primary planetary nodes must be exactly 9')
})

test('AstrolabeOrbNav: Profile Dossier node is canonical and decoupled from Admin colorKey', () => {
  assert.ok(
    astrolabeContent.includes("{ id: 'profile', path: '/profile', label: 'Profile Dossier', icon: User, colorKey: 'Profile' }"),
    "Profile node must use colorKey: 'Profile' instead of 'Admin'"
  )
  assert.equal(
    astrolabeContent.includes("colorKey: 'Admin'"),
    false,
    "No orb node in AstrolabeOrbNav should use 'Admin' as its colorKey"
  )
})

test('Module Colors: DEFAULT_MODULE_COLORS includes Profile matching UI_SYSTEM.md', () => {
  assert.equal(DEFAULT_MODULE_COLORS['Profile'], '#e2e8f0', "Profile default module color must match UI_SYSTEM.md Slate (#e2e8f0)")
  assert.equal(DEFAULT_MODULE_COLORS['Admin'], '#8b5cf6', "Admin Console module color must match UI_SYSTEM.md Violet (#8b5cf6)")
})

test('Admin Surfaces: Admin Console is accessible via Profile Room 05 and Command Palette', () => {
  // Profile Room 05 System Operations mounts /admin launch button
  assert.ok(profileOpsContent.includes("navigate('/admin')"), 'ProfileSystemOperations must contain navigate to /admin')
  assert.ok(profileOpsContent.includes('Launch Admin Console'), 'ProfileSystemOperations must contain Launch Admin Console trigger')

  // Command Palette supports /admin
  assert.ok(commandPaletteContent.includes("path: '/admin'"), 'CommandPalette must contain /admin navigation route')
  assert.ok(commandPaletteContent.includes("input === '/admin'"), 'CommandPalette must handle /admin slash command')

  // App.tsx contains protected /admin route (relative child route "admin")
  assert.ok(appContent.includes('path="admin"'), 'App.tsx must register admin route')
  assert.ok(appContent.includes('AdminConsolePage'), 'App.tsx must mount AdminConsolePage')
})

test('UI System & Handoff docs: Documented orbital layout and admin governance parity', () => {
  assert.ok(uiSystemContent.includes('Ring 1 (Inner Arc: Productivity & Time fanout, Mind OS, Winter Arc, Fitness OS)'))
  assert.ok(uiSystemContent.includes('Ring 2 (Outer Arc: Learning OS, Finance OS, Data & Reports fanout, Mission Control, Profile Dossier)'))
  assert.ok(uiSystemContent.includes('Administrative & Session Governance: Streamlined into `/profile` (Room 05 · System Operations via `ProfileSystemOperations.tsx`)'))
})
