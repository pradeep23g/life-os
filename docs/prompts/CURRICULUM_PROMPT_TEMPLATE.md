# Life OS — AI Curriculum & Study Plan Generation Prompt

> **Protocol Invariant (ADR-028):** Generates structured knowledge curricula and study plans for direct automated ingestion into Life OS Learning OS.

---

## Prompt Template

Copy and paste the following prompt into your preferred LLM (Claude, ChatGPT, Gemini) along with your desired topic and timeframe:

```markdown
You are a Principal Curriculum Architect and Pedagogical Engineer. 
Design an exhaustive, mastery-oriented curriculum for the following topic:
<TOPIC_OR_DOMAIN>

Target Timeframe: <TIMEFRAME_E.G._12_WEEKS>
Intensity / Dedication: <HOURS_PER_WEEK>

Output MUST be strictly valid JSON conforming to the Life OS Curriculum Ingestion Protocol (ADR-028).
Do not include any conversational preamble or postscript outside of the JSON or markdown code fence.

### JSON Schema Contract

{
  "$schema": "https://life-os.system/schemas/v1/curriculum.json",
  "title": "<Canonical Title of Curriculum>",
  "slug": "<kebab-case-slug>",
  "description": "<Concise thesis on what capabilities will be mastered>",
  "startDate": "YYYY-MM-DD",
  "targetEndDate": "YYYY-MM-DD",
  "color": "#eab308",
  "stages": [
    {
      "orderIndex": 1,
      "title": "<Stage Title: e.g. Stage 1: Core Foundations>",
      "subtitle": "<Key conceptual mechanisms>",
      "note": "<Pedagogical directive or reference texts>",
      "sessions": [
        {
          "orderIndex": 1,
          "title": "<Session Title>",
          "estimatedMinutes": 60,
          "slot": "Deep Work",
          "description": "<Specific subtopics covered>",
          "tags": ["core", "theory", "practice"]
        }
      ]
    }
  ],
  "milestones": [
    {
      "title": "<Verifiable milestone or proof-of-work>"
    }
  ],
  "projects": [
    {
      "title": "<Artifact or Implementation Project Title>",
      "description": "<Technical specifications of the artifact>",
      "status": "not_started"
    }
  ]
}

### Guidelines:
1. Break down complex subjects into 3 to 6 logical sequential stages.
2. Each stage must contain 2 to 8 focused study sessions (typically 45-120 minutes each).
3. Specify at least 2 concrete proof-of-work projects that synthesize the learned theory into tangible artifacts.
4. Keep session titles clear and actionable.
```

---

## Canonical Ingestion Example

```json
{
  "$schema": "https://life-os.system/schemas/v1/curriculum.json",
  "title": "Distributed Systems Engineering",
  "slug": "distributed-systems-engineering",
  "description": "Mastery of consensus, fault tolerance, replication, and distributed state machines.",
  "startDate": "2026-10-01",
  "targetEndDate": "2026-12-31",
  "color": "#eab308",
  "stages": [
    {
      "orderIndex": 1,
      "title": "Stage 1: Core Foundations & Time",
      "subtitle": "Lamport Clocks, Vector Clocks, and Network Asynchrony",
      "sessions": [
        {
          "orderIndex": 1,
          "title": "Time, Clocks, and the Ordering of Events",
          "estimatedMinutes": 90,
          "tags": ["consensus", "time", "theory"]
        },
        {
          "orderIndex": 2,
          "title": "Vector Clocks in Practice",
          "estimatedMinutes": 60,
          "tags": ["implementation", "clocks"]
        }
      ]
    }
  ],
  "milestones": [
    { "title": "Implement Lamport Logical Clock simulator in Go" }
  ],
  "projects": [
    {
      "title": "Toy Raft Cluster",
      "description": "3-node Raft consensus engine with leader election and log replication."
    }
  ]
}
```
