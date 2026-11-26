#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const taxonomyPath = path.join(repoRoot, 'src/lib/eventTaxonomy.ts')
const targetPath = path.join(
  repoRoot,
  'android/app/src/main/java/com/lifeos/companion/telemetry/EventTypes.kt',
)

const isCheckMode = process.argv.includes('--check')

const source = fs.readFileSync(taxonomyPath, 'utf8')
const blockMatch = source.match(/export const EVENT_TYPES = \{([\s\S]*?)\} as const/)
if (!blockMatch) {
  console.error('Could not locate EVENT_TYPES block in src/lib/eventTaxonomy.ts')
  process.exit(1)
}

const entries = []
const entryRegex = /^\s*([A-Z0-9_]+):\s*'([^']+)'/gm
for (const match of blockMatch[1].matchAll(entryRegex)) {
  entries.push({ key: match[1], value: match[2] })
}

if (entries.length === 0) {
  console.error('No event entries parsed from src/lib/eventTaxonomy.ts')
  process.exit(1)
}

const lines = [
  '// GENERATED FILE — DO NOT EDIT MANUALLY.',
  '// Source of truth: src/lib/eventTaxonomy.ts',
  '// Regenerate via: node scripts/sync-android-contracts.mjs',
  'package com.lifeos.companion.telemetry',
  '',
  'object EventTypes {',
  ...entries.map(({ key, value }) => `    const val ${key}: String = "${value}"`),
  '}',
  '',
]
const generated = lines.join('\n')

if (isCheckMode) {
  if (!fs.existsSync(targetPath)) {
    console.error(`Missing generated Kotlin contract: ${path.relative(repoRoot, targetPath)}`)
    process.exit(1)
  }
  const existing = fs.readFileSync(targetPath, 'utf8')
  if (existing !== generated) {
    console.error(
      `Android EventTypes.kt is out of sync with src/lib/eventTaxonomy.ts. Run: node scripts/sync-android-contracts.mjs`,
    )
    process.exit(1)
  }
  console.log(`Android EventTypes.kt is in sync (${entries.length} canonical events).`)
  process.exit(0)
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.writeFileSync(targetPath, generated, 'utf8')
console.log(`Synced ${entries.length} canonical events -> ${path.relative(repoRoot, targetPath)}`)
