import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, Plus, Loader2 } from 'lucide-react'
import { useCreateRoadmap, useCreateStage } from '../api/useLearningOS'
import { CreateRoadmapModal } from '../components/CreateRoadmapModal'

interface CuratedTrack {
  id: string
  title: string
  category: string
  description: string
  color: string
  stages: {
    title: string
    subtitle: string
    note: string
  }[]
}

const CURATED_TRACKS: CuratedTrack[] = [
  {
    id: 'systems-programming',
    title: 'Systems Programming & Low-Level Foundations',
    category: 'Computer Systems',
    color: '#10b981',
    description:
      'Master physical memory layouts, virtual memory paging, cache coherency, OS syscall interfaces, and safe low-level concurrency.',
    stages: [
      {
        title: '01. Memory Architecture & Pointers',
        subtitle: 'Virtual memory, page tables, stack vs heap allocation, and cache lines',
        note: 'Study cache miss latencies and memory alignment constraints.',
      },
      {
        title: '02. Concurrency & Synchronization Primitives',
        subtitle: 'Atomics, mutexes, condition variables, spinlocks, and memory fences',
        note: 'Analyze the acquire-release memory consistency model.',
      },
      {
        title: '03. Operating System Kernel Boundaries',
        subtitle: 'Syscall traps, interrupt handlers, asynchronous I/O (epoll/io_uring)',
        note: 'Trace context switch overhead and page faults in kernel traces.',
      },
      {
        title: '04. Low-Level Runtimes & Garbage Collectors',
        subtitle: 'Tracing vs reference-counting collectors, arenas, and allocators',
        note: 'Synthesize custom arena allocators and evaluate throughput.',
      },
    ],
  },
  {
    id: 'cognitive-architectures',
    title: 'Deep Learning & Cognitive Architectures',
    category: 'Machine Intelligence',
    color: '#6366f1',
    description:
      'Explore transformer attention mechanics, optimization manifolds, reinforcement learning policy gradients, and verified agentic coordination.',
    stages: [
      {
        title: '01. Optimization Manifolds & Backpropagation',
        subtitle: 'Matrix calculus, gradient descent dynamics, AdamW, and loss surfaces',
        note: 'Derive backpropagation equations through tensor contractions.',
      },
      {
        title: '02. Transformer Mechanics & Attention',
        subtitle: 'Multi-head attention, rotary positional embeddings, KV-caching',
        note: 'Trace algorithmic complexity and memory footprints of long contexts.',
      },
      {
        title: '03. Reinforcement Learning & Alignment',
        subtitle: 'Markov decision processes, policy gradients, PPO, DPO, and reward models',
        note: 'Examine stability boundaries in policy gradient updates.',
      },
      {
        title: '04. Multi-Agent Systems & Verification',
        subtitle: 'Tool orchestration, deterministic sandboxing, and adversarial review',
        note: 'Design multi-agent synthesis loops with formal consistency gates.',
      },
    ],
  },
  {
    id: 'distributed-consensus',
    title: 'Distributed Systems & Consensus Protocols',
    category: 'Infrastructure',
    color: '#f59e0b',
    description:
      'Traverse CAP theorems, Paxos/Raft consensus, vector clocks, linearizability, and fault-tolerant state-machine replication.',
    stages: [
      {
        title: '01. Distributed Time & Ordering',
        subtitle: 'Lamport timestamps, vector clocks, partial vs total ordering',
        note: 'Understand why physical clocks drift and NTP limits in distributed nodes.',
      },
      {
        title: '02. Consensus Protocols (Raft & Multi-Paxos)',
        subtitle: 'Leader election, log replication, quorum intersections, term invariants',
        note: 'Prove the safety property of Raft leader completeness.',
      },
      {
        title: '03. Consistency Models & Linearizability',
        subtitle: 'Serializability, strict serializability, read-your-writes, causal consistency',
        note: 'Map trade-offs between latency, availability, and consistency guarantees.',
      },
      {
        title: '04. Partition Tolerance & Disaster Recovery',
        subtitle: 'Split-brain resolution, peer gossip protocols, and snapshotting',
        note: 'Simulate network splits and verify quorum recovery.',
      },
    ],
  },
  {
    id: 'formal-logic',
    title: 'Formal Methods & Epistemic Logic',
    category: 'Mathematical Foundations',
    color: '#84cc16',
    description:
      'Rigorous exploration of propositional calculus, constructive type theory, Curry-Howard isomorphism, and mechanical proof verification.',
    stages: [
      {
        title: '01. Propositional & First-Order Predicate Logic',
        subtitle: 'Natural deduction, truth tables, sound inference rules, and completeness',
        note: 'Construct formal proofs using sequent calculus.',
      },
      {
        title: '02. Lambda Calculus & Constructive Type Theory',
        subtitle: 'Untyped vs simply-typed lambda calculus, normal form, Curry-Howard correspondence',
        note: 'Verify proofs as programs through typed evaluation.',
      },
      {
        title: '03. Invariants & Inductive Specification',
        subtitle: 'State assertions, pre/post-conditions, loop invariants, and Hoare logic',
        note: 'Formulate inductive invariants for state transition systems.',
      },
      {
        title: '04. Automated Verification & SMT Solvers',
        subtitle: 'SAT solvers (CDCL), SMT theories, and symbolic execution engines',
        note: 'Encode verification conditions into boolean satisfiability clauses.',
      },
    ],
  },
]

export function ExplorePage() {
  const navigate = useNavigate()
  const { mutateAsync: createRoadmap } = useCreateRoadmap()
  const { mutateAsync: createStage } = useCreateStage()

  const [importingTrackId, setImportingTrackId] = useState<string | null>(null)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)

  const handleAdoptTrack = async (track: CuratedTrack) => {
    if (importingTrackId) return
    setImportingTrackId(track.id)

    try {
      // 1. Create Roadmap
      const roadmapResult = await createRoadmap({
        title: track.title,
        description: track.description,
        color: track.color,
        startDate: new Date().toISOString().slice(0, 10),
      })

      // 2. Sequentially add stages
      for (let i = 0; i < track.stages.length; i++) {
        const stage = track.stages[i]
        await createStage({
          roadmapId: roadmapResult.id,
          title: stage.title,
          subtitle: stage.subtitle,
          note: stage.note,
          orderIndex: i + 1,
        })
      }

      // 3. Navigate directly to the newly instantiated roadmap
      navigate(`/learning-os/roadmap/${roadmapResult.id}`)
    } catch (err) {
      console.error('Failed to import track', err)
      setImportingTrackId(null)
    }
  }

  return (
    <div className="space-y-12 font-sans text-text-primary">
      {/* Back Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <Link
          to="/learning-os"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Study Shelf
        </Link>
        <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
          CARTOGRAPHY ARCHIVES
        </span>
      </div>

      {/* Header Monograph */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-accent-primary">
            Curated Knowledge Tracks
          </span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-text-primary font-serif">
            Intellectual Cartography
          </h1>
          <p className="text-sm font-serif italic text-text-secondary leading-relaxed">
            Curated epistemological frameworks ready for instant adoption into your personal study shelf.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomModalOpen(true)}
          className="inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity self-start md:self-auto"
        >
          <Plus size={14} />
          Chart Custom Trajectory
        </button>
      </div>

      {/* Curated Tracks Architectural Grid (No dashed placeholder box!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {CURATED_TRACKS.map((track) => {
          const isImporting = importingTrackId === track.id

          return (
            <article
              key={track.id}
              className="flex flex-col justify-between border border-border-subtle bg-surface p-6 sm:p-8 space-y-6 transition-colors hover:border-border"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-accent-primary border border-border-subtle px-2 py-0.5 rounded">
                    {track.category}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-text-tertiary">
                    {track.stages.length} Stations Planned
                  </span>
                </div>

                <h2 className="text-xl font-medium text-text-primary text-balance">
                  {track.title}
                </h2>

                <p className="text-sm font-serif text-text-secondary leading-relaxed">
                  {track.description}
                </p>

                {/* Previews of Stations in Track */}
                <div className="space-y-2.5 pt-4 border-t border-border-subtle">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
                    Curriculum Stations:
                  </span>
                  <div className="divide-y divide-border-subtle/60 border border-border-subtle bg-background/50 rounded overflow-hidden">
                    {track.stages.map((stage, idx) => (
                      <div key={idx} className="p-3 text-xs space-y-0.5">
                        <span className="font-medium text-text-primary block">
                          {stage.title}
                        </span>
                        <span className="text-text-tertiary block font-serif italic text-[11px]">
                          {stage.subtitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-6 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono text-text-tertiary">
                  Instant Curriculum Setup
                </span>

                <button
                  type="button"
                  onClick={() => handleAdoptTrack(track)}
                  disabled={importingTrackId !== null}
                  className="inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Inscribing Folio...
                    </>
                  ) : (
                    <>
                      <Compass size={13} />
                      Chart This Trajectory
                    </>
                  )}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <CreateRoadmapModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </div>
  )
}
