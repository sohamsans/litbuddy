---
name: bug-analysis-and-fix
description: >-
  Systematic autonomous bug discovery, end-to-end integration testing, memory logging,
  and hallucination-proof plan generation for AutoLit AI / LitBuddy.
---

# Bug Analysis and Fix Skill

This skill governs the systematic discovery, reproduction, logging, and remediation of bugs across the LitBuddy application (Frontend, Backend, Desktop Executable, and Cloud Netlify/Render deployment).

## Workflow Protocol

1. **Autonomous Diagnostic Audit**:
   - Inspect full stack interfaces: Authentication, Email OTP verification, Paper fetching cascades (Unpaywall, arXiv, PMC, Sci-Hub), Document Vault local persistence, Bulk ZIP compilation, and Chat persistence across page refreshes.
   - Run live end-to-end headless/scripted probes against the backend and frontend contracts.

2. **Memory Logging & State Preservation**:
   - Log all identified bugs, reproduction traces, and contract mismatches directly into `PROJECT_MEMORY.md` under a dedicated `# Bug Register & Diagnostic Ledger` section.
   - Maintain lean token state by referencing the registered bug IDs rather than repeating verbose logs in context.

3. **Synergy with `reasons-to-error`**:
   - Pass logged bugs to the `reasons-to-error` skill to analyze underlying root causes (e.g. CORS, timeouts, missing local storage keys, unhandled database nulls, network blocks).

4. **Multi-Pass Critic Review (5-Pass Review)**:
   - Before executing code edits, formulate an Implementation Plan and pass it through 5 rigorous review rounds:
     - **Round 1 (Correctness & Edge Cases)**: Are all HTTP status codes, null fields, and database constraints handled?
     - **Round 2 (Anti-Hallucination Check)**: Are any non-existent endpoints, invalid parameters, or hallucinated library methods used?
     - **Round 3 (Deployment Compatibility)**: Will this work seamlessly across both local Windows desktop (`LitBuddy.exe`) and cloud (`Netlify + Render`)?
     - **Round 4 (Token & Resource Efficiency)**: Are payload slices strictly respected and stream buffers closed properly?
     - **Round 5 (User Experience & Continuity)**: Does chat history, auth session, and vaulted files persist without state loss?

5. **Execution & Regression Verification**:
   - Apply clean, surgical patches.
   - Re-run autonomous diagnostic suite to guarantee zero regression.
   - Record resolution status in `PROJECT_MEMORY.md`.
