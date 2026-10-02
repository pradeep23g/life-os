# Life OS — Seasonal Configuration & Vow Generation Prompt

> **Protocol Invariant (ADR-026):** Generates structured seasonal configurations, principles, phase partitions, and milestone achievements for direct automated ingestion into Life OS Admin Control Plane (`/admin`).
>
> *Note:* For active Arc Engine seasonal campaign authoring (`/arc`), see the canonical [`ARC_PROMPT_TEMPLATE.md`](./ARC_PROMPT_TEMPLATE.md) (ADR-029).

---

## Prompt Template

Copy and paste the following prompt into your preferred LLM (Claude, ChatGPT, Gemini) along with your seasonal intention, dates, and domain priorities:

```markdown
You are a Tactical Life Architect and Systems Strategist.
Formulate a seasonal campaign directive and achievement catalog for the following cycle:
<SEASON_NAME_E.G._WINTER_ARC_2026>

Start Date: <YYYY-MM-DD>
End Date: <YYYY-MM-DD>
Primary Focus Domains: <E.G._SYSTEMS_PROGRAMMING_AND_PHYSICAL_ENDURANCE>
Seasonal Directive / Theme: <E.G._SILENCE_AND_EXECUTION>

Output MUST be strictly valid JSON conforming to the Life OS Season Ingestion Protocol (ADR-026).
Do not include conversational preamble or postscript outside of the JSON or markdown code fence.

### JSON Schema Contract

{
  "$schema": "https://life-os.system/schemas/v1/season-config.json",
  "version": "1.0.0",
  "season": {
    "name": "<Season Name>",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "status": "active",
    "vows": {
      "vow": {
        "headline": "<Monumental Directive Headline>",
        "body": "<Operational philosophy and behavioral imperative>",
        "attribution": "Seasonal Directive"
      },
      "principles": [
        "<Principle 1: Eliminative discipline>",
        "<Principle 2: Physical cadence>",
        "<Principle 3: Cognitive depth>"
      ],
      "phases": [
        { "name": "Foundation", "startDay": 1, "endDay": 14 },
        { "name": "Deep Arc", "startDay": 15, "endDay": 75 },
        { "name": "Harvest & Transition", "startDay": 76, "endDay": 90 }
      ]
    }
  },
  "achievements": [
    {
      "badgeId": "<unique_snake_case_badge_id>",
      "name": "<Badge Name>",
      "description": "<Clear verifiable unlocking condition>",
      "tier": "bronze",
      "criteria": { "type": "consecutive_days", "count": 10 }
    }
  ]
}

### Guidelines:
1. Ensure `startDate` and `endDate` are valid ISO 8601 strings (`YYYY-MM-DD`).
2. Include 3 non-negotiable operational principles.
3. Structure the season into 3 sequential phases: Foundation (ramp-up), Deep Arc (sustained peak intensity), and Harvest/Transition (synthesis and handoff).
4. Define 2 to 6 seasonal milestone achievements with tiers ('bronze', 'silver', 'gold', 'monument').
```

---

## Canonical Ingestion Example

```json
{
  "$schema": "https://life-os.system/schemas/v1/season-config.json",
  "version": "1.0.0",
  "season": {
    "name": "Winter Arc 2026",
    "startDate": "2026-07-30",
    "endDate": "2026-10-27",
    "status": "active",
    "vows": {
      "vow": {
        "headline": "Silence and Execution",
        "body": "No announcements. No half-measures. Cold focus in the dark.",
        "attribution": "Seasonal Directive"
      },
      "principles": [
        "Eliminate non-essential commitments",
        "Kinetic discipline daily",
        "Cognitive rigor in deep work"
      ],
      "phases": [
        { "name": "Foundation", "startDay": 1, "endDay": 14 },
        { "name": "Deep Arc", "startDay": 15, "endDay": 75 },
        { "name": "Harvest & Transition", "startDay": 76, "endDay": 90 }
      ]
    }
  },
  "achievements": [
    {
      "badgeId": "arc_iron_initiate",
      "name": "Iron Initiate",
      "description": "Logged 10 consecutive active days during an active Arc",
      "tier": "bronze",
      "criteria": { "type": "consecutive_days", "count": 10 }
    }
  ]
}
```
