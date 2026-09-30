#!/usr/bin/env node

/**
 * LIFE OS — Documentation Drift Automated Verification Gate
 * 
 * Enforces strict ground-truth parity:
 * 1. Database Migrations -> docs/architecture/DATABASE_SCHEMA.md
 * 2. Client Routes (src/App.tsx) -> docs/architecture/SYSTEM_ARCHITECTURE.md
 * 3. Canonical ADR Registry Monotonicity & No Duplicate ADRs
 * 4. Internal Markdown Link & Heading Anchor Integrity across docs/
 * 5. Task Tracker Integrity (tasks/todo.md)
 * 
 * Phase 5 Content Parity Gates:
 * 6. Gate 1: Table count parity (Migrations <-> AGENT_QUICKSTART.md)
 * 7. Gate 2: Dynamic Route Parity (src/App.tsx <-> Architecture Docs)
 * 8. Gate 3: Reverse Schema Parity (DATABASE_SCHEMA.md <-> Migrations)
 * 9. Gate 4: Quick Schema Reference Column Spot-Check (AGENT_QUICKSTART.md <-> database.types.ts)
 * 10. Gate 5: Cross-Document Table Number Consistency (INDEX, QUICKSTART, SCHEMA, ARCHITECTURE)
 * 11. Gate 6: Historical Document Frontmatter Quarantine (docs/historical/ & docs/winter-arc/)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

let totalChecks = 0
let failedChecks = 0

function pass(name, details = '') {
  totalChecks++
  console.log(`  [PASS] ${name}${details ? ` (${details})` : ''}`)
}

function fail(name, error) {
  totalChecks++
  failedChecks++
  console.error(`  [FAIL] ${name}: ${error}`)
}

console.log('\n============================================================')
console.log('       LIFE OS — DOCUMENTATION DRIFT VERIFICATION GATE       ')
console.log('============================================================\n')

// -------------------------------------------------------------
// Helper: Extract Active Tables from PostgreSQL Migrations
// -------------------------------------------------------------
const migrationsDir = path.join(ROOT, 'supabase', 'migrations')

function getActiveMigrationTables() {
  if (!fs.existsSync(migrationsDir)) return []
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  const createdTables = new Set()
  const droppedTables = new Set()

  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    
    // Match CREATE TABLE [IF NOT EXISTS] public.<table_name>
    const createMatches = content.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)/gi)
    for (const match of createMatches) {
      createdTables.add(match[1].toLowerCase())
    }

    // Match DROP TABLE [IF EXISTS] public.<table_name>
    const dropMatches = content.matchAll(/drop\s+table(?:\s+if\s+exists)?\s+public\.([a-zA-Z0-9_]+)/gi)
    for (const match of dropMatches) {
      droppedTables.add(match[1].toLowerCase())
    }
  }

  return [...createdTables].filter(t => !droppedTables.has(t)).sort()
}

// -------------------------------------------------------------
// CHECK 1: Database Migration Schema Parity (Forward)
// -------------------------------------------------------------
console.log('[1/11] Checking Database Schema Parity (Migrations -> DATABASE_SCHEMA.md)...')

const schemaDocPath = path.join(ROOT, 'docs', 'architecture', 'DATABASE_SCHEMA.md')

if (!fs.existsSync(migrationsDir) || !fs.existsSync(schemaDocPath)) {
  fail('Migration / Schema Doc existence', 'Missing migrations dir or DATABASE_SCHEMA.md')
} else {
  const schemaDocContent = fs.readFileSync(schemaDocPath, 'utf8')
  const activeTables = getActiveMigrationTables()

  let missingTables = []
  for (const table of activeTables) {
    const pattern = new RegExp(`public\\.${table}\\b`, 'i')
    if (!pattern.test(schemaDocContent)) {
      missingTables.push(table)
    }
  }

  if (missingTables.length === 0) {
    pass('Database Tables Parity', `${activeTables.length} PostgreSQL tables verified in DATABASE_SCHEMA.md`)
  } else {
    fail('Database Tables Parity', `Undocumented tables in DATABASE_SCHEMA.md: ${missingTables.join(', ')}`)
  }
}

// -------------------------------------------------------------
// CHECK 2: Client Route Coverage
// -------------------------------------------------------------
console.log('\n[2/11] Checking Route Coverage (src/App.tsx -> SYSTEM_ARCHITECTURE.md)...')

const appTsxPath = path.join(ROOT, 'src', 'App.tsx')
const sysArchPath = path.join(ROOT, 'docs', 'architecture', 'SYSTEM_ARCHITECTURE.md')

if (!fs.existsSync(appTsxPath) || !fs.existsSync(sysArchPath)) {
  fail('App.tsx / SYSTEM_ARCHITECTURE.md existence', 'Missing App.tsx or SYSTEM_ARCHITECTURE.md')
} else {
  const sysArchContent = fs.readFileSync(sysArchPath, 'utf8')
  const appTsxContent = fs.readFileSync(appTsxPath, 'utf8')

  // Canonical routes that must be present in SYSTEM_ARCHITECTURE.md
  const canonicalRoutes = [
    '/',
    '/arc',
    '/system',
    '/profile',
    '/admin',
    '/reports',
    '/mind-os',
    '/productivity-hub',
    '/learning-os',
    '/fitness-os',
    '/time-os',
    '/finance-os',
    '/data-lab',
    '/auth'
  ]

  let missingRoutes = []
  for (const route of canonicalRoutes) {
    if (!sysArchContent.includes(route)) {
      missingRoutes.push(route)
    }
  }

  if (missingRoutes.length === 0) {
    pass('Route Coverage', `All ${canonicalRoutes.length} canonical routes documented in SYSTEM_ARCHITECTURE.md`)
  } else {
    fail('Route Coverage', `Missing routes in SYSTEM_ARCHITECTURE.md: ${missingRoutes.join(', ')}`)
  }
}

// -------------------------------------------------------------
// CHECK 3: ADR Register Monotonicity & Uniqueness
// -------------------------------------------------------------
console.log('\n[3/11] Checking Architectural Decision Records (ADR Registry)...')

const adrPath = path.join(ROOT, 'docs', 'decisions', 'ARCHITECTURE_DECISIONS.md')

if (!fs.existsSync(adrPath)) {
  fail('ADR Register existence', 'Missing ARCHITECTURE_DECISIONS.md')
} else {
  const adrContent = fs.readFileSync(adrPath, 'utf8')
  const adrMatches = [...adrContent.matchAll(/##\s+ADR-(\d{3}):/g)]
  const adrNumbers = adrMatches.map(m => parseInt(m[1], 10))

  // Check uniqueness
  const seen = new Set()
  const duplicates = []
  for (const num of adrNumbers) {
    if (seen.has(num)) duplicates.push(num)
    seen.add(num)
  }

  // Check monotonic sequence from 1 to max
  let isMonotonic = true
  for (let i = 0; i < adrNumbers.length; i++) {
    if (adrNumbers[i] !== i + 1) {
      isMonotonic = false
      break
    }
  }

  if (duplicates.length === 0 && isMonotonic && adrNumbers.length >= 28) {
    pass('ADR Registry Monotonicity', `Gapless sequence ADR-001 through ADR-${String(adrNumbers.length).padStart(3, '0')} (0 duplicates)`)
  } else {
    fail('ADR Registry Monotonicity', `Duplicates: [${duplicates.join(', ')}], Monotonic: ${isMonotonic}, Count: ${adrNumbers.length}`)
  }
}

// -------------------------------------------------------------
// CHECK 4: Markdown Link & Anchor Integrity across docs/
// -------------------------------------------------------------
console.log('\n[4/11] Checking Internal Markdown Link & Heading Anchor Integrity across docs/......')

function getAllMarkdownFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath))
    } else if (file.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

function getGfmSlug(text) {
  let clean = text.replace(/^#+\s*/, '')
  clean = clean.replace(/<[^>]+>/g, '')
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  clean = clean.replace(/`([^`]+)`/g, '$1')
  clean = clean.toLowerCase().trim()
  clean = clean.replace(/[^\w\s-]/g, '')
  clean = clean.replace(/\s+/g, '-')
  return clean
}

const fileSlugCache = new Map()
function getCachedSlugs(filePath) {
  if (fileSlugCache.has(filePath)) return fileSlugCache.get(filePath)
  // Split with CRLF-safe regex to prevent trailing \r breaking heading matching
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const slugCounts = new Map()
  const validSlugs = new Set()
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/)
    if (match) {
      const baseSlug = getGfmSlug(match[1])
      if (!baseSlug) continue
      let slug = baseSlug
      if (slugCounts.has(baseSlug)) {
        const count = slugCounts.get(baseSlug) + 1
        slugCounts.set(baseSlug, count)
        slug = `${baseSlug}-${count}`
      } else {
        slugCounts.set(baseSlug, 0)
      }
      validSlugs.add(slug)
    }
  }
  fileSlugCache.set(filePath, validSlugs)
  return validSlugs
}

const docsDir = path.join(ROOT, 'docs')
const tasksDir = path.join(ROOT, 'tasks')
let mdFiles = getAllMarkdownFiles(docsDir)
if (fs.existsSync(tasksDir)) {
  mdFiles = mdFiles.concat(getAllMarkdownFiles(tasksDir))
}
for (const entry of fs.readdirSync(ROOT)) {
  if (entry.endsWith('.md')) {
    mdFiles.push(path.join(ROOT, entry))
  }
}

let brokenLinks = []
let checkedAnchors = 0

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8')
  const dir = path.dirname(file)

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    let target = match[2].trim()

    // Skip external URLs, mailto, conversation links
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('conversation://')
    ) {
      continue
    }

    // Reject machine-specific file:/// URIs
    if (target.startsWith('file:///')) {
      brokenLinks.push({
        file: path.relative(ROOT, file),
        target,
        resolvedTarget: 'Portability violation: machine-specific file:/// URI forbidden'
      })
      continue
    }

    // Check anchor in self
    if (target.startsWith('#')) {
      const anchor = target.slice(1)
      checkedAnchors++
      const slugs = getCachedSlugs(file)
      if (!slugs.has(anchor)) {
        brokenLinks.push({
          file: path.relative(ROOT, file),
          target,
          resolvedTarget: `Anchor #${anchor} not found in self`
        })
      }
      continue
    }

    // Split target and anchor
    const [pathPart, anchorPart] = target.split('#')
    if (!pathPart) continue

    const decodedPath = decodeURIComponent(pathPart)
    const resolvedTarget = path.isAbsolute(decodedPath)
      ? decodedPath
      : path.resolve(dir, decodedPath)

    if (!fs.existsSync(resolvedTarget)) {
      brokenLinks.push({
        file: path.relative(ROOT, file),
        target,
        resolvedTarget: path.relative(ROOT, resolvedTarget)
      })
      continue
    }

    // Validate anchor on destination markdown file
    if (anchorPart && (resolvedTarget.endsWith('.md') || resolvedTarget.endsWith('.markdown'))) {
      checkedAnchors++
      const slugs = getCachedSlugs(resolvedTarget)
      if (!slugs.has(anchorPart)) {
        brokenLinks.push({
          file: path.relative(ROOT, file),
          target,
          resolvedTarget: `Anchor #${anchorPart} not found in destination markdown`
        })
      }
    }
  }
}

if (brokenLinks.length === 0) {
  pass('Markdown Link & Anchor Integrity', `All internal links & anchors in ${mdFiles.length} markdown files resolve on disk (${checkedAnchors} anchors verified, 0 file:/// URIs)`)
} else {
  fail('Markdown Link & Anchor Integrity', `${brokenLinks.length} broken links found:\n` +
    brokenLinks.slice(0, 10).map(b => `      ${b.file} -> ${b.target} (not found: ${b.resolvedTarget})`).join('\n')
  )
}

// -------------------------------------------------------------
// CHECK 5: Task Tracker Parity (tasks/todo.md)
// -------------------------------------------------------------
console.log('\n[5/11] Checking Task Tracker Parity (tasks/todo.md)...')

const todoPath = path.join(ROOT, 'tasks', 'todo.md')
if (!fs.existsSync(todoPath)) {
  fail('tasks/todo.md existence', 'Missing tasks/todo.md')
} else {
  const todoContent = fs.readFileSync(todoPath, 'utf8')
  const uncheckedMatches = todoContent.match(/- \[\s*\]/g) || []
  
  if (uncheckedMatches.length === 0) {
    pass('Task Tracker Parity', '0 unchecked items in tasks/todo.md')
  } else {
    fail('Task Tracker Parity', `Found ${uncheckedMatches.length} unchecked items in tasks/todo.md`)
  }
}

// -------------------------------------------------------------
// GATE 1: Table Count Parity (Migrations <-> AGENT_QUICKSTART.md)
// -------------------------------------------------------------
console.log('\n[6/11] Gate 1: Checking Table Count Parity (Migrations <-> AGENT_QUICKSTART.md)...')

const quickstartPath = path.join(ROOT, 'docs', 'AGENT_QUICKSTART.md')

if (!fs.existsSync(quickstartPath) || !fs.existsSync(migrationsDir)) {
  fail('Gate 1: Table Count Parity', 'Missing AGENT_QUICKSTART.md or migrations directory')
} else {
  const activeTables = getActiveMigrationTables()
  const qsContent = fs.readFileSync(quickstartPath, 'utf8')

  // Extract table count cited in AGENT_QUICKSTART.md
  const qsCountMatch = qsContent.match(/(\d+)\s+Base Tables/i) || qsContent.match(/Base Tables by Domain \((\d+) Total\)/i)
  const qsTotalCount = qsCountMatch ? parseInt(qsCountMatch[1], 10) : null

  // Check table names documented in Section 3.1
  let missingTablesInQS = []
  for (const table of activeTables) {
    const tablePattern = new RegExp(`\`${table}\``, 'i')
    if (!tablePattern.test(qsContent)) {
      missingTablesInQS.push(table)
    }
  }

  if (qsTotalCount === null) {
    fail('Gate 1: Table Count Parity', 'Unable to parse total Base Tables count from AGENT_QUICKSTART.md')
  } else if (qsTotalCount !== activeTables.length) {
    fail('Gate 1: Table Count Parity', `Count mismatch: migrations define ${activeTables.length} active tables, but AGENT_QUICKSTART.md cites ${qsTotalCount}`)
  } else if (missingTablesInQS.length > 0) {
    fail('Gate 1: Table Count Parity', `Active PostgreSQL tables missing in AGENT_QUICKSTART.md: ${missingTablesInQS.join(', ')}`)
  } else {
    pass('Gate 1: Table Count Parity', `Both migrations and AGENT_QUICKSTART.md define exactly ${activeTables.length} tables with 100% name parity`)
  }
}

// -------------------------------------------------------------
// GATE 2: Dynamic Route Parity (src/App.tsx <-> Architecture Docs)
// -------------------------------------------------------------
console.log('\n[7/11] Gate 2: Checking Dynamic Route Parity (src/App.tsx -> Architecture Docs)...')

if (!fs.existsSync(appTsxPath) || !fs.existsSync(sysArchPath) || !fs.existsSync(quickstartPath)) {
  fail('Gate 2: Route Parity', 'Missing App.tsx, SYSTEM_ARCHITECTURE.md, or AGENT_QUICKSTART.md')
} else {
  const appTsxContent = fs.readFileSync(appTsxPath, 'utf8')
  const sysArchContent = fs.readFileSync(sysArchPath, 'utf8')
  const qsContent = fs.readFileSync(quickstartPath, 'utf8')

  // Dynamically parse route definitions from src/App.tsx
  const routeTags = [...appTsxContent.matchAll(/<Route\s+([^>]*?)>/g)]
  const dynamicRoutes = new Set()

  for (const match of routeTags) {
    const props = match[1]
    if (/\bindex\b/.test(props)) {
      dynamicRoutes.add('/')
    }
    const pathMatch = props.match(/\bpath=["']([^"']+)["']/)
    if (pathMatch) {
      const rawPath = pathMatch[1]
      if (rawPath !== '*') {
        const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
        dynamicRoutes.add(normalized)
      }
    }
  }

  // Canonical routes to verify across architecture docs
  const primaryClientRoutes = [
    '/',
    '/arc',
    '/system',
    '/profile',
    '/admin',
    '/reports',
    '/mind-os',
    '/productivity-hub',
    '/learning-os',
    '/fitness-os',
    '/time-os',
    '/finance-os',
    '/data-lab',
    '/auth'
  ]

  let unparsedRoutes = []
  let undocumentedInSysArch = []
  let undocumentedInQuickstart = []

  for (const route of primaryClientRoutes) {
    if (!dynamicRoutes.has(route)) {
      unparsedRoutes.push(route)
    }
    if (!sysArchContent.includes(route)) {
      undocumentedInSysArch.push(route)
    }
    if (!qsContent.includes(route)) {
      undocumentedInQuickstart.push(route)
    }
  }

  if (unparsedRoutes.length > 0) {
    fail('Gate 2: Route Parity', `Routes missing from src/App.tsx AST/regex parse: ${unparsedRoutes.join(', ')}`)
  } else if (undocumentedInSysArch.length > 0) {
    fail('Gate 2: Route Parity', `Parsed routes missing in SYSTEM_ARCHITECTURE.md: ${undocumentedInSysArch.join(', ')}`)
  } else if (undocumentedInQuickstart.length > 0) {
    fail('Gate 2: Route Parity', `Parsed routes missing in AGENT_QUICKSTART.md: ${undocumentedInQuickstart.join(', ')}`)
  } else {
    pass('Gate 2: Route Parity', `Dynamically parsed ${dynamicRoutes.size} routes from src/App.tsx; all ${primaryClientRoutes.length} canonical routes verified across SYSTEM_ARCHITECTURE.md and AGENT_QUICKSTART.md`)
  }
}

// -------------------------------------------------------------
// GATE 3: Reverse Schema Parity (DATABASE_SCHEMA.md -> Migrations)
// -------------------------------------------------------------
console.log('\n[8/11] Gate 3: Checking Reverse Schema Parity (DATABASE_SCHEMA.md -> Migrations)...')

if (!fs.existsSync(schemaDocPath) || !fs.existsSync(migrationsDir)) {
  fail('Gate 3: Reverse Schema Parity', 'Missing DATABASE_SCHEMA.md or migrations directory')
} else {
  const schemaDocContent = fs.readFileSync(schemaDocPath, 'utf8')
  const activeTables = new Set(getActiveMigrationTables())

  // Parse all table headings: #### `public.<table_name>`
  const documentedMatches = [...schemaDocContent.matchAll(/####\s+`public\.([a-zA-Z0-9_]+)`/g)]
  const documentedTables = documentedMatches.map(m => m[1].toLowerCase())

  let phantomTables = []
  for (const table of documentedTables) {
    if (!activeTables.has(table)) {
      phantomTables.push(table)
    }
  }

  if (documentedTables.length === 0) {
    fail('Gate 3: Reverse Schema Parity', 'No table headings (#### `public.<table_name>`) parsed from DATABASE_SCHEMA.md')
  } else if (phantomTables.length > 0) {
    fail('Gate 3: Reverse Schema Parity', `Phantom tables documented in DATABASE_SCHEMA.md but missing from migrations: ${phantomTables.join(', ')}`)
  } else {
    pass('Gate 3: Reverse Schema Parity', `All ${documentedTables.length} tables documented in DATABASE_SCHEMA.md physically exist in PostgreSQL migrations (0 phantom tables)`)
  }
}

// -------------------------------------------------------------
// GATE 4: Quick Schema Reference Column Spot-Check against database.types.ts
// -------------------------------------------------------------
console.log('\n[9/11] Gate 4: Checking Column Spot-Check (AGENT_QUICKSTART.md <-> database.types.ts)...')

const databaseTypesPath = path.join(ROOT, 'src', 'types', 'database.types.ts')

if (!fs.existsSync(quickstartPath) || !fs.existsSync(databaseTypesPath)) {
  fail('Gate 4: Column Spot-Check', 'Missing AGENT_QUICKSTART.md or database.types.ts')
} else {
  const tsContent = fs.readFileSync(databaseTypesPath, 'utf8')
  const qsContent = fs.readFileSync(quickstartPath, 'utf8')

  // Parse TypeScript database Tables and Columns
  const tableColumns = new Map()
  const tablesBlockMatch = tsContent.match(/Tables:\s*\{([\s\S]*?)\n\s*Views:/)
  if (tablesBlockMatch) {
    const tablesBlock = tablesBlockMatch[1]
    const tableRegex = /([a-zA-Z0-9_]+):\s*\{\s*Row:\s*\{([\s\S]*?)\}/g
    let tMatch
    while ((tMatch = tableRegex.exec(tablesBlock)) !== null) {
      const tableName = tMatch[1]
      const rowBlock = tMatch[2]
      const cols = new Set()
      const colRegex = /^\s*([a-zA-Z0-9_]+)\s*[:?]/gm
      let cMatch
      while ((cMatch = colRegex.exec(rowBlock)) !== null) {
        cols.add(cMatch[1])
      }
      tableColumns.set(tableName, cols)
    }
  }

  // Spot-check core and extension tables documented in AGENT_QUICKSTART.md
  const coreTableSpotChecks = {
    journal_entries: ['mood', 'what_went_good', 'what_you_learned', 'brief_about_day', 'user_id'],
    habits: ['user_id', 'title', 'habit_type', 'target_value', 'deleted_at'],
    habit_logs: ['habit_id', 'log_date', 'value'],
    habit_streak_breaks: ['habit_id', 'break_date', 'reason', 'healed_at'],
    tasks: ['user_id', 'title', 'deadline_type', 'deadline_date', 'is_completed'],
    goals: ['user_id', 'title', 'domain', 'status', 'target_date'],
    weekly_plans: ['user_id', 'week_start_date', 'focus_text'],
    weekly_plan_items: ['user_id', 'week_start_date', 'title', 'priority', 'status', 'goal_id'],
    weekly_reviews: ['user_id', 'week_start_date', 'wins', 'blockers'],
    fitness_exercises: ['user_id', 'name', 'category', 'movement_pattern'],
    exercise_logs: ['workout_id', 'exercise_id', 'sets', 'weight_kg', 'duration_seconds'],
    workouts: ['user_id', 'title', 'start_time', 'end_time'],
    time_logs: ['user_id', 'task_id', 'start_time', 'end_time'],
    transactions: ['user_id', 'amount', 'category', 'type', 'is_need'],
    events: ['user_id', 'event_type', 'payload', 'event_date_ist'],
    life_seasons: ['user_id', 'name', 'start_date', 'end_date', 'vows'],
    user_achievements: ['user_id', 'badge_id', 'unlocked_at', 'metadata'],
    pulse_logs: ['user_id', 'timestamp', 'value', 'metadata'],
    knowledge_resources: ['user_id', 'title', 'url', 'metadata'],
    experiments: ['user_id', 'title', 'status', 'metadata'],
    user_settings: ['user_id', 'finance_preferences']
  }

  let missingColumns = []
  let totalColumnsChecked = 0

  for (const [table, cols] of Object.entries(coreTableSpotChecks)) {
    const actualCols = tableColumns.get(table)
    if (!actualCols) {
      missingColumns.push(`Table public.${table} not found in database.types.ts`)
      continue
    }

    for (const col of cols) {
      totalColumnsChecked++
      if (!actualCols.has(col)) {
        missingColumns.push(`${table}.${col} missing from database.types.ts`)
      }
      if (!qsContent.includes(col)) {
        missingColumns.push(`${table}.${col} documented in spot-check but absent from AGENT_QUICKSTART.md`)
      }
    }
  }

  // Defend against regressions of known phantom columns for journal_entries
  const journalRowMatch = qsContent.match(/`journal_entries`[^\n]+/)
  if (journalRowMatch) {
    if (journalRowMatch[0].includes('entry_date') || journalRowMatch[0].includes('content')) {
      missingColumns.push('Regression detected: journal_entries quickstart row contains obsolete columns (entry_date or content)')
    }
  }

  if (missingColumns.length === 0) {
    pass('Gate 4: Column Spot-Check', `All ${totalColumnsChecked} columns across ${Object.keys(coreTableSpotChecks).length} core & extension tables verified against database.types.ts (0 discrepancies)`)
  } else {
    fail('Gate 4: Column Spot-Check', `Column mismatches detected:\n      ${missingColumns.join('\n      ')}`)
  }
}

// -------------------------------------------------------------
// GATE 5: Cross-Document Table Number Consistency
// -------------------------------------------------------------
console.log('\n[10/11] Gate 5: Checking Cross-Document Table Number Consistency...')

const indexDocPath = path.join(ROOT, 'docs', 'INDEX.md')

if (!fs.existsSync(indexDocPath) || !fs.existsSync(quickstartPath) || !fs.existsSync(schemaDocPath) || !fs.existsSync(sysArchPath)) {
  fail('Gate 5: Table Number Consistency', 'Missing one or more required documentation files for cross-check')
} else {
  const indexContent = fs.readFileSync(indexDocPath, 'utf8')
  const qsContent = fs.readFileSync(quickstartPath, 'utf8')
  const dbSchemaContent = fs.readFileSync(schemaDocPath, 'utf8')
  const sysArchContent = fs.readFileSync(sysArchPath, 'utf8')

  const activeTables = getActiveMigrationTables()
  const expectedCount = activeTables.length

  // Extract table counts cited in each document
  const indexMatch = indexContent.match(/(\d+)[-\s]tables?/i)
  const indexCount = indexMatch ? parseInt(indexMatch[1], 10) : null

  const qsMatch = qsContent.match(/(\d+)\s+Base Tables/i) || qsContent.match(/Base Tables by Domain \((\d+) Total\)/i)
  const qsCount = qsMatch ? parseInt(qsMatch[1], 10) : null

  const dbSchemaMatch = dbSchemaContent.match(/(\d+)\s+base tables/i)
  const dbSchemaCount = dbSchemaMatch ? parseInt(dbSchemaMatch[1], 10) : null

  const sysArchMatch = sysArchContent.match(/(\d+)\s+base tables/i) || sysArchContent.match(/(\d+)\s+Base Tables/i)
  const sysArchCount = sysArchMatch ? parseInt(sysArchMatch[1], 10) : null

  const docCounts = [
    { name: 'INDEX.md', count: indexCount },
    { name: 'AGENT_QUICKSTART.md', count: qsCount },
    { name: 'DATABASE_SCHEMA.md', count: dbSchemaCount },
    { name: 'SYSTEM_ARCHITECTURE.md', count: sysArchCount }
  ]

  let countMismatches = []
  for (const doc of docCounts) {
    if (doc.count === null) {
      countMismatches.push(`${doc.name}: could not extract table count`)
    } else if (doc.count !== expectedCount) {
      countMismatches.push(`${doc.name}: cites ${doc.count} tables, expected ${expectedCount}`)
    }
  }

  if (countMismatches.length === 0) {
    pass('Gate 5: Cross-Document Consistency', `All 4 core documents mutually cite exactly ${expectedCount} base tables in complete alignment with PostgreSQL migrations`)
  } else {
    fail('Gate 5: Cross-Document Consistency', `Discrepancies in cited table counts:\n      ${countMismatches.join('\n      ')}`)
  }
}

// -------------------------------------------------------------
// GATE 6: Historical Document Frontmatter Quarantine
// -------------------------------------------------------------
console.log('\n[11/11] Gate 6: Checking Historical Document Frontmatter Quarantine...')

const historicalDir = path.join(ROOT, 'docs', 'historical')
const winterArcDir = path.join(ROOT, 'docs', 'winter-arc')

if (!fs.existsSync(historicalDir) || !fs.existsSync(winterArcDir)) {
  fail('Gate 6: Frontmatter Quarantine', 'Missing docs/historical or docs/winter-arc directory')
} else {
  // Collect all historical files in docs/historical/
  const historicalFiles = fs.readdirSync(historicalDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(historicalDir, f))

  // Collect quarantined Winter Arc specifications in docs/winter-arc/
  const quarantinedWinterArcSpecs = [
    'WINTER_ARC_DESIGN_SYSTEM.md',
    'WINTER_ARC_MASTER_PLAN.md',
    'WINTER_ARC_DATA_MODEL.md',
    'WINTER_ARC_ARCHITECTURE.md',
    'WINTER_ARC_DECISIONS.md',
    'PROGRESS.md'
  ].map(f => path.join(winterArcDir, f))

  const targetFiles = [...historicalFiles, ...quarantinedWinterArcSpecs]
  let quarantineViolations = []

  for (const file of targetFiles) {
    if (!fs.existsSync(file)) {
      quarantineViolations.push(`${path.relative(ROOT, file)}: file does not exist`)
      continue
    }

    const content = fs.readFileSync(file, 'utf8')
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!fmMatch) {
      quarantineViolations.push(`${path.relative(ROOT, file)}: missing structured YAML frontmatter`)
      continue
    }

    const statusMatch = fmMatch[1].match(/status:\s*["']?([^"'\r\n]+)["']?/i)
    const status = statusMatch ? statusMatch[1].trim().toLowerCase() : ''

    if (status === 'active') {
      quarantineViolations.push(`${path.relative(ROOT, file)}: status is active (must be quarantined as historical or deprecated)`)
    }
  }

  if (quarantineViolations.length === 0) {
    pass('Gate 6: Frontmatter Quarantine', `All ${targetFiles.length} historical and quarantined specifications verified non-active (0 active status violations)`)
  } else {
    fail('Gate 6: Frontmatter Quarantine', `Quarantine violations detected:\n      ${quarantineViolations.join('\n      ')}`)
  }
}

// -------------------------------------------------------------
// SUMMARY & EXIT CODE
// -------------------------------------------------------------
console.log('\n------------------------------------------------------------')
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${totalChecks - failedChecks} | FAILED: ${failedChecks}`)
console.log('------------------------------------------------------------\n')

if (failedChecks > 0) {
  console.error(' Documentation drift verification FAILED. Correct discrepancies above.')
  process.exit(1)
} else {
  console.log(' Documentation drift verification PASSED. Ground truth parity confirmed.')
  process.exit(0)
}
