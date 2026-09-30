import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAndValidateCurriculum, cleanJsonString } from '../src/lib/schemas/curriculumSchema.ts'
import { parseAndValidateAdminPayload } from '../src/lib/schemas/seasonConfigSchema.ts'

test('cleanJsonString: removes markdown code fences properly', () => {
  const input1 = '```json\n{"title": "Test"}\n```'
  assert.equal(cleanJsonString(input1), '{"title": "Test"}')

  const input2 = '```\n{"title": "Test"}\n```'
  assert.equal(cleanJsonString(input2), '{"title": "Test"}')

  const input3 = '  {"title": "Test"}  '
  assert.equal(cleanJsonString(input3), '{"title": "Test"}')

  const input4 = 'Here is the JSON you requested:\n```json\n{"title": "Test"}\n```\nHope this helps!'
  assert.equal(cleanJsonString(input4), '{"title": "Test"}')

  const input5 = 'Certainly! Check this out: {"title": "Raw Preamble"} All the best!'
  assert.equal(cleanJsonString(input5), '{"title": "Raw Preamble"}')

  const input6 = 'Here is the array: [{"item": 1}] Have fun!'
  assert.equal(cleanJsonString(input6), '[{"item": 1}]')
})

test('parseAndValidateCurriculum: preserves stage end_date and roadmap endDate across all casing variants', () => {
  const payload = JSON.stringify({
    title: 'Rust Mastery',
    endDate: '2026-12-31',
    stages: [
      {
        title: 'Stage 1',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        sessions: []
      },
      {
        title: 'Stage 2',
        target_end_date: '2026-11-30',
        sessions: []
      }
    ]
  })
  const result = parseAndValidateCurriculum(payload)
  assert.equal(result.success, true)
  assert.equal(result.data?.targetEndDate, '2026-12-31')
  assert.equal(result.data?.stages[0].endDate, '2026-10-31')
  assert.equal(result.data?.stages[1].endDate, '2026-11-30')
})

test('parseAndValidateCurriculum: handles conversational preamble without markdown fences', () => {
  const conversationalText = `Sure! Below is the curriculum roadmap JSON:
  {
    "title": "Quantum Computing 101",
    "stages": [
      {
        "title": "Qubits and Superposition",
        "sessions": []
      }
    ]
  }
  Please let me know if you need any additions.`

  const result = parseAndValidateCurriculum(conversationalText)
  assert.equal(result.success, true)
  assert.equal(result.data?.title, 'Quantum Computing 101')
  assert.equal(result.data?.stages.length, 1)
})

test('parseAndValidateCurriculum: accepts canonical ADR-028 curriculum', () => {
  const canonical = JSON.stringify({
    $schema: 'https://life-os.system/schemas/v1/curriculum.json',
    title: 'Distributed Systems Engineering',
    slug: 'distributed-systems-engineering',
    description: 'Mastery of consensus, fault tolerance, replication, and distributed state machines.',
    startDate: '2026-10-01',
    targetEndDate: '2026-12-31',
    color: 'var(--accent-primary)',
    stages: [
      {
        orderIndex: 1,
        title: 'Stage 1: Core Foundations & Time',
        subtitle: 'Lamport Clocks, Vector Clocks, and Network Asynchrony',
        sessions: [
          {
            orderIndex: 1,
            title: 'Time, Clocks, and the Ordering of Events',
            estimatedMinutes: 90,
            tags: ['consensus', 'time', 'theory']
          },
          {
            orderIndex: 2,
            title: 'Vector Clocks in Practice',
            estimatedMinutes: 60,
            tags: ['implementation', 'clocks']
          }
        ]
      }
    ],
    milestones: [
      { title: 'Implement Lamport Logical Clock simulator in Go' }
    ],
    projects: [
      {
        title: 'Toy Raft Cluster',
        description: '3-node Raft consensus engine with leader election and log replication.'
      }
    ]
  })

  const result = parseAndValidateCurriculum(canonical)
  assert.equal(result.success, true)
  assert.equal(result.data?.title, 'Distributed Systems Engineering')
  assert.equal(result.data?.stages.length, 1)
  assert.equal(result.data?.stages[0].sessions.length, 2)
  assert.equal(result.data?.milestones.length, 1)
  assert.equal(result.data?.projects.length, 1)
})

test('parseAndValidateCurriculum: strips markdown code fences and normalizes snake_case keys', () => {
  const markdownWrapped = `\`\`\`json
{
  "title": "Machine Learning Foundations",
  "start_date": "2026-11-01",
  "target_end_date": "2027-01-31",
  "stages": [
    {
      "order_index": 1,
      "title": "Linear Algebra for ML",
      "sessions": [
        {
          "order_index": 1,
          "title": "Matrix Decompositions",
          "estimated_minutes": 120,
          "tags": ["math", "linear-algebra"]
        }
      ]
    }
  ]
}
\`\`\``

  const result = parseAndValidateCurriculum(markdownWrapped)
  assert.equal(result.success, true)
  assert.equal(result.data?.title, 'Machine Learning Foundations')
  assert.equal(result.data?.startDate, '2026-11-01')
  assert.equal(result.data?.targetEndDate, '2027-01-31')
  assert.equal(result.data?.stages[0].orderIndex, 1)
  assert.equal(result.data?.stages[0].sessions[0].estimatedMinutes, 120)
})

test('parseAndValidateCurriculum: catches schema errors', () => {
  // Empty title
  const invalid1 = JSON.stringify({
    title: '',
    stages: [{ title: 'Stage 1', sessions: [] }]
  })
  const res1 = parseAndValidateCurriculum(invalid1)
  assert.equal(res1.success, false)
  assert.ok(res1.errors?.some(e => e.includes('Roadmap title is required')))

  // Zero stages
  const invalid2 = JSON.stringify({
    title: 'Valid Title',
    stages: []
  })
  const res2 = parseAndValidateCurriculum(invalid2)
  assert.equal(res2.success, false)
  assert.ok(res2.errors?.some(e => e.includes('At least one stage is required')))

  // Negative estimated minutes
  const invalid3 = JSON.stringify({
    title: 'Valid Title',
    stages: [
      {
        title: 'Stage 1',
        sessions: [{ title: 'Session 1', estimatedMinutes: -30 }]
      }
    ]
  })
  const res3 = parseAndValidateCurriculum(invalid3)
  assert.equal(res3.success, false)

  // Corrupt JSON
  const invalid4 = '{"title": "Unclosed string'
  const res4 = parseAndValidateCurriculum(invalid4)
  assert.equal(res4.success, false)
  assert.ok(res4.errors?.[0].includes('JSON Syntax Error'))
})

test('parseAndValidateAdminPayload: accepts canonical ADR-026 season config', () => {
  const canonical = JSON.stringify({
    $schema: 'https://life-os.system/schemas/v1/season-config.json',
    version: '1.0.0',
    season: {
      name: 'Winter Arc 2026',
      startDate: '2026-07-30',
      endDate: '2026-10-27',
      status: 'active',
      vows: {
        vow: {
          headline: 'Silence and Execution',
          body: 'No announcements. No half-measures. Cold focus in the dark.',
          attribution: 'Seasonal Directive'
        },
        principles: [
          'Eliminate non-essential commitments',
          'Kinetic discipline daily',
          'Cognitive rigor in deep work'
        ],
        phases: [
          { name: 'Foundation', startDay: 1, endDay: 14 },
          { name: 'Deep Arc', startDay: 15, endDay: 75 },
          { name: 'Harvest & Transition', startDay: 76, endDay: 90 }
        ]
      }
    },
    achievements: [
      {
        badgeId: 'arc_iron_initiate',
        name: 'Iron Initiate',
        description: 'Logged 10 consecutive active days during an active Arc',
        tier: 'bronze',
        criteria: { type: 'consecutive_days', count: 10 }
      }
    ]
  })

  const result = parseAndValidateAdminPayload(canonical)
  assert.equal(result.success, true)
  assert.equal(result.payload?.kind, 'canonical')
  if (result.payload?.kind === 'canonical') {
    assert.equal(result.payload.data.season.name, 'Winter Arc 2026')
    assert.equal(result.payload.data.season.startDate, '2026-07-30')
    assert.equal(result.payload.data.achievements.length, 1)
    assert.equal(result.payload.data.achievements[0].badgeId, 'arc_iron_initiate')
  }
})

test('parseAndValidateAdminPayload: accepts raw table format', () => {
  const rawTable = JSON.stringify({
    entity: 'life_seasons',
    data: [
      {
        name: 'Sprint 2026',
        startDate: '2026-01-01',
        endDate: '2026-03-31'
      }
    ]
  })

  const result = parseAndValidateAdminPayload(rawTable)
  assert.equal(result.success, true)
  assert.equal(result.payload?.kind, 'raw')
  if (result.payload?.kind === 'raw') {
    assert.equal(result.payload.data.entity, 'life_seasons')
    assert.equal(result.payload.data.data.length, 1)
  }
})

test('parseAndValidateCurriculum: handles rich multi-stage, milestones, and projects', () => {
  const complexCurriculum = JSON.stringify({
    title: 'Advanced Rust & Systems Programming',
    slug: 'rust-systems',
    description: 'Kernel bypass, async runtime internals, memory layout, SIMD intrinsics.',
    startDate: '2026-10-01',
    targetEndDate: '2027-01-31',
    color: '#ea580c',
    stages: [
      {
        orderIndex: 1,
        title: 'Stage 1: Memory Layout & Pointer Ergonomics',
        subtitle: 'Unsafe Rust, Miri, and Custom Allocators',
        note: 'Requires The Rustonomicon and Linux perf tooling',
        sessions: [
          {
            orderIndex: 1,
            title: 'Layout of Structs, Enums, and Trait Objects',
            slot: 'Deep Work',
            estimatedMinutes: 90,
            tags: ['memory', 'layout', 'miri']
          },
          {
            orderIndex: 2,
            title: 'Custom Bump and Arena Allocators',
            slot: 'Deep Work',
            estimatedMinutes: 120,
            tags: ['allocators', 'unsafe']
          }
        ]
      },
      {
        orderIndex: 2,
        title: 'Stage 2: Async Runtimes & Epoll Engines',
        subtitle: 'Futures, Wakers, and Reactor Pattern',
        sessions: [
          {
            orderIndex: 1,
            title: 'Building a Minimal Epoll Event Loop',
            estimatedMinutes: 150,
            tags: ['async', 'epoll', 'linux']
          }
        ]
      }
    ],
    milestones: [
      { title: 'Pass all Miri validation suites on arena allocator', stageIndex: 0 },
      { title: 'Achieve 1M req/s on toy async HTTP server', stageIndex: 1 }
    ],
    projects: [
      {
        title: 'ArenaAlloc-rs',
        description: 'Zero-overhead arena allocator with thread-safe bulk deallocation.',
        status: 'not_started',
        repoUrl: 'https://github.com/example/arena-alloc-rs'
      },
      {
        title: 'MiniReactor',
        description: 'Single-threaded async reactor based on Linux io_uring / epoll.',
        status: 'in_progress'
      }
    ]
  })

  const result = parseAndValidateCurriculum(complexCurriculum)
  assert.equal(result.success, true)
  assert.equal(result.data?.stages.length, 2)
  assert.equal(result.data?.stages[0].sessions.length, 2)
  assert.equal(result.data?.stages[1].sessions.length, 1)
  assert.equal(result.data?.milestones.length, 2)
  assert.equal(result.data?.projects.length, 2)
  assert.equal(result.data?.projects[0].repoUrl, 'https://github.com/example/arena-alloc-rs')
  assert.equal(result.data?.projects[1].status, 'in_progress')
})

test('parseAndValidateAdminPayload: rejects invalid schema', () => {
  const invalid = JSON.stringify({ foo: 'bar' })
  const result = parseAndValidateAdminPayload(invalid)
  assert.equal(result.success, false)
  assert.ok(result.errors?.[0].includes('Unrecognized payload format'))
})

test('parseAndValidateAdminPayload: handles conversational preamble and markdown code fences', () => {
  const wrapped = `Here is your seasonal configuration for Winter Arc 2026:
\`\`\`json
{
  "season": {
    "name": "Winter Arc 2026",
    "startDate": "2026-07-30",
    "endDate": "2026-10-27",
    "vows": {
      "principles": ["Focus", "Rigor"]
    }
  },
  "achievements": []
}
\`\`\`
Let me know if this works!`

  const result = parseAndValidateAdminPayload(wrapped)
  assert.equal(result.success, true)
  assert.equal(result.payload?.kind, 'canonical')
  if (result.payload?.kind === 'canonical') {
    assert.equal(result.payload.data.season.name, 'Winter Arc 2026')
  }
})

