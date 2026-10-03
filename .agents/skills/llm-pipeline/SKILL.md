---
name: llm-pipeline
description: >-
  Two-stage LLM evaluation and multi-provider abstraction skill for AutoLit AI.
  Use when constructing Stage 1 Batch Triage prompts, Stage 2 Deep Extraction prompts,
  configuring Gemini, Groq, or Ollama clients, and validating JSON output schemas.
---

# Two-Stage LLM Pipeline & Multi-Provider Abstraction

This skill defines the token-efficient LLM pipeline, structured JSON schemas, and multi-provider routing (Gemini Flash, Groq Llama, Ollama).

## Architecture Overview

```
User Query & Candidate Abstracts (15-25)
              │
              ▼
   Stage 1: Batch Triage (1 LLM Call)
   ┌───────────────────────────────────────────────┐
   │ Fast evaluation of all abstracts               │
   │ Output: List of {id, score (1-5), rationale}  │
   └───────────────────────────────────────────────┘
              │ Filter: score >= threshold (Top 6-8)
              ▼
   Stage 2: Deep Extraction (1 Call per top paper)
   ┌───────────────────────────────────────────────┐
   │ Inputs: Paper Abstract + PDF Slices (Intro/   │
   │         Conclusion)                           │
   │ Output: Structured Literature Review JSON    │
   │ (Gaps, Methodology, Findings, Evaluation)    │
   └───────────────────────────────────────────────┘
```

## Stage 1: Batch Triage Specification

- **Purpose:** Evaluate 15–25 candidates simultaneously in a single prompt to minimize round trips and token overhead.
- **Input Packing:**
  ```json
  [
    {"id": 1, "title": "...", "year": 2023, "abstract": "...(max 250 words)"},
    {"id": 2, "title": "...", "year": 2024, "abstract": "..."}
  ]
  ```
- **System Instruction:**
  "You are an academic literature screening specialist. Evaluate each candidate paper's direct relevance to the research topic. Return ONLY a JSON object with key 'evaluations' containing an array of items with 'id', 'score' (integer 1-5, where 5 is perfectly relevant and 1 is irrelevant), and 'rationale' (1 concise sentence)."
- **Output Schema:**
  ```json
  {
    "evaluations": [
      {"id": 1, "score": 5, "rationale": "Directly tackles autonomous multi-agent paper screening."},
      {"id": 2, "score": 2, "rationale": "Focuses on unrelated general NLP benchmarks without literature focus."}
    ]
  }
  ```

## Stage 2: Deep Extraction Specification

- **Purpose:** Extract dense academic insights from top papers ($\ge 4$ relevance score).
- **Target Fields (Strict JSON):**
  ```json
  {
    "title": "string",
    "year": 2024,
    "authors": ["Author 1", "Author 2"],
    "core_problem": "1-2 sentences on what problem the paper tackles",
    "methodology": "Summary of experimental or theoretical approach",
    "key_findings": "Top 2-3 empirical or conceptual findings",
    "research_gaps": "Specific limitations, unaddressed questions, or future work mentioned",
    "critical_remarks": "Actionable evaluation: how to use this in a literature review",
    "doi_link": "string",
    "pdf_downloaded": true
  }
  ```

## Multi-Provider Client Setup (100% Cloud Free Tiers, Zero Local Resource Usage)
Because the app runs on a laptop during development and is targeted for cloud deployment (Netlify frontend + cloud backend), **no local models (Ollama) are used**. This eliminates laptop memory/battery drain and ensures complete cloud compatibility:

1. **Groq Cloud API (`llama-3.1-8b-instant`)**:
   - Primary engine: 100% cloud-hosted, zero local CPU/RAM footprint.
   - Generous free tier: 30 requests/min, 14,400 requests/day.
   - Ultra-fast response speeds (300-500ms) for Stage 1 Batch Triage and basic JSON parsing.
   - Configured via `GROQ_API_KEY` with native JSON object formatting.

2. **Google AI Studio API (`gemini-1.5-flash-8b` / `gemini-2.5-flash`)**:
   - Secondary cloud engine: 100% cloud-hosted with 1M+ token context.
   - Free tier: 15 requests/min, 1,500 requests/day.
   - Lightweight 8B model ideal for Stage 2 deep extraction of structured literature insights.
   - Configured via `GEMINI_API_KEY` with native `application/json` schema.

## Robust Parsing Protocol
Always pass LLM text outputs through a sanitizer before Pydantic parsing:
```python
import json
import re

def clean_json_response(raw_text: str) -> dict:
    text = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)
```
