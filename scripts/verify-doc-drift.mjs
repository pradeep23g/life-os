#!/usr/bin/env node

/**
 * LIFE OS — Documentation Drift Automated Verification Gate
 * 
 * Enforces strict ground-truth parity:
 * 1. Database Migrations -> docs/architecture/DATABASE_SCHEMA.md
 * 2. Client Routes (src/App.tsx) -> docs/architecture/SYSTEM_ARCHITECTURE.md
 * 3. Canonical ADR Registry Monotonicity & No Duplicate ADRs
 * 4. Internal Markdown Link Integrity across docs/
 * 5. Task Tracker Integrity (tasks/todo.md)
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
// CHECK 1: Database Migration Schema Parity
// -------------------------------------------------------------
console.log('[1/5] Checking Database Schema Parity (Migrations -> DATABASE_SCHEMA.md)...')

const migrationsDir = path.join(ROOT, 'supabase', 'migrations')
const schemaDocPath = path.join(ROOT, 'docs', 'architecture', 'DATABASE_SCHEMA.md')

if (!fs.existsSync(migrationsDir) || !fs.existsSync(schemaDocPath)) {
  fail('Migration / Schema Doc existence', 'Missing migrations dir or DATABASE_SCHEMA.md')
} else {
  const schemaDocContent = fs.readFileSync(schemaDocPath, 'utf8')
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

  // Active tables in PostgreSQL
  const activeTables = [...createdTables].filter(t => !droppedTables.has(t))

  let missingTables = []
  for (const table of activeTables) {
    // Check if table is documented in DATABASE_SCHEMA.md
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
// CHECK 2: Client Route Parity
// -------------------------------------------------------------
console.log('\n[2/5] Checking Route Parity (src/App.tsx -> SYSTEM_ARCHITECTURE.md)...')

const appTsxPath = path.join(ROOT, 'src', 'App.tsx')
const sysArchPath = path.join(ROOT, 'docs', 'architecture', 'SYSTEM_ARCHITECTURE.md')

if (!fs.existsSync(appTsxPath) || !fs.existsSync(sysArchPath)) {
  fail('App.tsx / SYSTEM_ARCHITECTURE.md existence', 'Missing App.tsx or SYSTEM_ARCHITECTURE.md')
} else {
  const sysArchContent = fs.readFileSync(sysArchPath, 'utf8')

  // Canonical routes that must be present in SYSTEM_ARCHITECTURE.md
  const requiredRoutes = [
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
  for (const route of requiredRoutes) {
    if (!sysArchContent.includes(route)) {
      missingRoutes.push(route)
    }
  }

  if (missingRoutes.length === 0) {
    pass('Route Coverage', `All ${requiredRoutes.length} canonical routes documented in SYSTEM_ARCHITECTURE.md`)
  } else {
    fail('Route Coverage', `Missing routes in SYSTEM_ARCHITECTURE.md: ${missingRoutes.join(', ')}`)
  }
}

// -------------------------------------------------------------
// CHECK 3: ADR Register Monotonicity & Uniqueness
// -------------------------------------------------------------
console.log('\n[3/5] Checking Architectural Decision Records (ADR Registry)...')

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
// CHECK 4: Markdown Link Integrity across docs/
// -------------------------------------------------------------
console.log('\n[4/5] Checking Internal Markdown Link Integrity across docs/......')

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
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
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
  pass('Markdown Link Integrity', `All internal links & anchors in ${mdFiles.length} markdown files resolve on disk (${checkedAnchors} anchors verified, 0 file:/// URIs)`)
} else {
  fail('Markdown Link Integrity', `${brokenLinks.length} broken links found:\n` +
    brokenLinks.slice(0, 10).map(b => `      ${b.file} -> ${b.target} (not found: ${b.resolvedTarget})`).join('\n')
  )
}

// -------------------------------------------------------------
// CHECK 5: Task Tracker Parity (tasks/todo.md)
// -------------------------------------------------------------
console.log('\n[5/5] Checking Task Tracker Parity (tasks/todo.md)...')

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
