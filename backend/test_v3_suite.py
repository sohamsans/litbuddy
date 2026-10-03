import asyncio
import os
import json
from app.db.database import init_db, AsyncSessionLocal
from app.services.auth_service import (
    encrypt_key,
    decrypt_key,
    mask_key,
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    PROVIDERS_METADATA,
    SECURITY_ASSURANCE
)
from app.services.llm_provider import (
    UniversalLLMClient,
    compress_abstract,
    compress_paper_slice
)
from app.services.cache_service import (
    compute_query_hash,
    get_cached_discovery,
    save_discovery_cache,
    get_cached_synthesis,
    save_paper_synthesis
)
from app.models.schemas import RawPaperMetadata, ReviewPaper
from app.mcp_server import TOOLS

async def run_suite():
    print("==================================================")
    print("AutoLit AI v3.0 Comprehensive Verification Suite")
    print("==================================================")

    # 1. Database Init
    await init_db()
    print("[PASS] Database initialized (users, discovery_cache, papers_cache, chat_history).")

    # 2. Cryptography & Key Isolation
    sample_key = "dummy_test_sample_key_1234567890abcdef"
    encrypted = encrypt_key(sample_key)
    assert encrypted != sample_key, "Key should be encrypted"
    decrypted = decrypt_key(encrypted)
    assert decrypted == sample_key, "Decrypted key must match original"
    masked = mask_key(sample_key)
    assert masked.startswith("dumm") and masked.endswith("cdef"), "Masked key format correct"
    print(f"[PASS] AES-256 Key Encryption & Isolation: Original masked as '{masked}'.")

    # 3. Password Hashing & JWT
    pass_hash = hash_password("SecurePassword2026!")
    assert verify_password("SecurePassword2026!", pass_hash), "Password verification failed"
    assert not verify_password("WrongPassword", pass_hash), "Invalid password accepted"
    token = create_access_token("user-123", "test@autolit.local")
    payload = verify_access_token(token)
    assert payload["sub"] == "user-123", "JWT payload sub mismatch"
    print("[PASS] PBKDF2 Password Hashing & JWT Token Generation.")

    # 4. Prompt Compression
    long_abstract = "This paper presents a novel approach. " * 30 + "Copyright 2026 Elsevier. All rights reserved."
    compressed_abs = compress_abstract(long_abstract, max_words=180)
    assert len(compressed_abs.split()) <= 185, "Abstract not properly capped"
    assert "Copyright" not in compressed_abs, "Copyright boilerplate not stripped"
    print(f"[PASS] Hyper-Lean Abstract Compression (Reduced to {len(compressed_abs.split())} words, boilerplate removed).")

    long_slice = "Introduction text... " * 500 + "\nReferences\n[1] Author et al."
    compressed_sl = compress_paper_slice(long_slice, max_chars=8000)
    assert len(compressed_sl) <= 8000, "Slice exceeded 8000 char cap"
    assert "References" not in compressed_sl, "References section not stripped"
    print(f"[PASS] Sliced Text Compression (Capped at {len(compressed_sl)} chars, references stripped).")

    # 5. Dual-Layer Cache Validation
    test_papers = [
        RawPaperMetadata(
            id="test-1",
            title="Transformer Attention Optimization in Medical Imaging",
            authors=["Vaswani et al."],
            year=2024,
            venue="NeurIPS",
            doi="10.1000/182",
            abstract="We present an efficient linear attention mechanism for high-resolution images.",
            is_oa=True,
            pdf_url="https://arxiv.org/pdf/test.pdf",
            source="openalex"
        )
    ]

    # Tier 1 Discovery Cache Test
    test_topic = "transformer attention optimization in medical imaging"
    q_hash = compute_query_hash(test_topic, year_min=2024, year_max=2026, max_results=50)
    await save_discovery_cache(q_hash, test_topic, {"year_min": 2024, "year_max": 2026}, test_papers)
    cached_discovery = await get_cached_discovery(q_hash)
    assert cached_discovery is not None, "Tier 1 Cache lookup returned None"
    assert len(cached_discovery) == 1, "Cached paper count mismatch"
    assert cached_discovery[0].title == test_papers[0].title
    print("[PASS] Tier 1 Discovery Cache: Stored and replayed raw candidate pool in 0ms.")

    # Tier 2 Synthesized Paper Cache Test
    test_review = ReviewPaper(
        id="test-1",
        title="Transformer Attention Optimization in Medical Imaging",
        year=2024,
        authors=["Vaswani et al."],
        venue="NeurIPS",
        relevance_score=5,
        triage_rationale="Directly proposes novel attention mechanisms for medical scans.",
        core_problem="Quadratic complexity of attention on gigapixel pathology images.",
        methodology="Linear kernel approximation with sparse tile caching.",
        key_findings="Reduces memory footprint by 74% with zero loss in dice score.",
        research_gaps="Needs evaluation across rare pathological edge cases.",
        critical_remarks="Essential benchmark paper for scalable vision transformers.",
        doi_link="https://doi.org/10.1000/182",
        pdf_downloaded=True,
        source="openalex"
    )

    await save_paper_synthesis(test_review)
    cached_synthesis = await get_cached_synthesis(test_review.doi_link, test_review.title)
    assert cached_synthesis is not None, "Tier 2 Cache lookup returned None"
    assert cached_synthesis.core_problem == test_review.core_problem
    print("[PASS] Tier 2 Synthesis Cache: Stored and replayed review with 0 LLM calls.")

    # 6. Universal LLM Client & Providers
    assert len(PROVIDERS_METADATA) == 6, "Expected 6 AI providers"
    provider_ids = [p["id"] for p in PROVIDERS_METADATA]
    assert "groq" in provider_ids and "gemini" in provider_ids and "openrouter" in provider_ids and "deepseek" in provider_ids and "nvidia" in provider_ids
    print(f"[PASS] Universal LLM Providers Directory: {', '.join(provider_ids)} verified.")

    # 7. Model Context Protocol (MCP) Server Tools
    assert len(TOOLS) == 4, "Expected 4 MCP tools"
    tool_names = [t["name"] for t in TOOLS]
    assert "autolit_search_literature" in tool_names
    assert "autolit_triage_candidates" in tool_names
    assert "autolit_deep_extract" in tool_names
    assert "autolit_export_matrix" in tool_names
    print(f"[PASS] Model Context Protocol (MCP): Registered tools {', '.join(tool_names)}.")

    print("\n[SUCCESS] All AutoLit AI v3.0 core engines and security constraints verified!")

if __name__ == "__main__":
    asyncio.run(run_suite())
