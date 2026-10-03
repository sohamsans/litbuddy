---
name: autolit-memory
description: >-
  Project memory, state tracking, and token conservation skill for AutoLit AI.
  Use to read and update project memory, prevent hallucination, verify architectural state,
  and enforce token optimization protocols.
---

# AutoLit Project Memory & Token Conservation

This skill maintains project state, tracks verified interfaces, prevents hallucination of endpoints/parameters, and enforces strict token-budget conservation.

## Core Directives

1. **State Persistence in `PROJECT_MEMORY.md`**:
   - Always reference [PROJECT_MEMORY.md](../../PROJECT_MEMORY.md) for the source of truth on completed milestones, API contract specifications, verified packages, and architectural decisions.
   - When modifying core backend or frontend contracts, update `PROJECT_MEMORY.md` immediately.

2. **Anti-Hallucination Protocol**:
   - Never assume an external academic API schema or query param without cross-referencing `academic-apis` skill or making a verified curl/python test.
   - Always validate LLM responses through Pydantic models with `model_validate_json()`. If an LLM returns unexpected markdown formatting, strip fences (````json ... ````) before parsing.
   - Do not guess library methods: check installed versions (e.g., PyMuPDF `pymupdf.open()` vs `fitz.open()`).

3. **Token Conservation Rules**:
   - **Batch Triage (Stage 1)**: Pack only essential metadata into the prompt: Title, Year, Authors (first 2 + et al.), Abstract. Strip citation metadata, venue details, or repetitive text.
   - **Truncation Cap**: If an abstract exceeds 250 words, truncate it cleanly at the 250th word with `...` before passing to Stage 1.
   - **Filter Aggressively**: Set threshold $\ge 4$ (or user-chosen value) and hard cap at top 6-8 papers before Stage 2.
   - **Targeted Slicing (Stage 2)**: Only send Abstract + Introduction (pages 1-2) + Discussion/Conclusion (last 2 pages) to the deep extraction prompt. Do NOT send full 20-30 page PDFs.
   - **Structured JSON Mode**: Always use provider native JSON schemas / response formats (`response_mime_type="application/json"` in Gemini, `response_format={"type": "json_object"}` in Groq) to avoid retry overhead.
