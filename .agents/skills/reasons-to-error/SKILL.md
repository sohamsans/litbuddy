---
name: reasons-to-error
description: >-
  Deep root-cause diagnostic engine for AutoLit AI / LitBuddy. Analyzes logged bugs,
  maps architectural failure modes, and synthesizes robust, verified remediations.
---

# Reasons to Error Skill

This skill diagnoses the precise root causes behind operational bugs across LitBuddy and generates hardened architectural fixes.

## Diagnostic Domains & Failure Taxonomies

### 1. Paper Fetching & Bulk Downloader Failures
- **Root Cause A (Publisher Scrapers & Bot Blocks)**: Cloud IPs (e.g. Render/AWS) get blocked with 403 Forbidden by ScienceDirect, Springer, Wiley, or Cloudflare challenge pages when fetching PDFs.
- **Root Cause B (Gateway & Proxy Timeouts)**: Streaming multi-megabyte PDFs through an upstream proxy (Netlify 26s limit) triggers 504 timeouts if done sequentially.
- **Root Cause C (Filesystem Write Permissions in Cloud)**: Writing PDFs to relative working directories in serverless/container environments where ephemeral disks lack persistent permissions.
- **Root Cause D (MIME-Type & Stream Corruption)**: HTML error pages being saved as `.pdf` files without verifying `%PDF-` magic bytes.

### 2. Chat & State Persistence Across Page Refreshes
- **Root Cause A (Client Memory-Only State)**: Chat conversations held solely in React component state (`useState`) without synchronizing to browser `localStorage` or backend `/api/auth/history`.
- **Root Cause B (Unlinked Guest Sessions)**: Chat messages not associating to `user_id` when the user is signed in, or failing to reload on mount (`useEffect`).
- **Root Cause C (JWT Expiration Handling)**: Token refresh failures causing silent 401s when saving or retrieving chat history.

### 3. Authentication & Verification
- **Root Cause A (State Desync Between Client & Cloud DB)**: Local executable accessing local SQLite `autolit.db` while website accesses Render PostgreSQL/SQLite, leading to perceived missing accounts.
- **Root Cause B (Email Delivery Restraints)**: Rate limits, unauthenticated SMTP ports, or IP whitelisting restrictions from transactional email providers.

## Remediation Synthesis Template

For every error identified by `bug-analysis-and-fix`:
1. **Error Signature**: Exact message, HTTP code, or stack trace.
2. **Root Cause Diagnosis**: Architectural mechanics of the failure.
3. **Primary Solution**: Cleanest direct patch without breaking existing contracts.
4. **Resilient Fallback**: Graceful degradation if upstream services fail (e.g., fallback to OA abstract, client-side ZIP generation, or local indexedDB storage).
5. **Memory Commitment**: Document remediation strategy in `PROJECT_MEMORY.md`.
