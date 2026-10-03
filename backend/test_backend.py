import asyncio
from app.services.academic_search import (
    reconstruct_openalex_abstract,
    normalize_title,
    deduplicate_papers,
    fetch_openalex_papers,
    fetch_arxiv_papers,
    discover_academic_papers
)
from app.models.schemas import RawPaperMetadata, SearchRequest, SelectedPipelineRequest, AssistantChatMessage
from app.services.pdf_service import extract_pdf_sections
from app.services.pipeline import run_literature_review_pipeline, run_pipeline_on_selected_papers
from app.services.assistant_service import generate_assistant_response
import pymupdf

def test_reconstruct_abstract():
    inverted_index = {
        "Deep": [0],
        "learning": [1],
        "for": [2],
        "literature": [3],
        "review": [4]
    }
    result = reconstruct_openalex_abstract(inverted_index)
    assert result == "Deep learning for literature review"

def test_normalize_title():
    t1 = "AutoLit: Autonomous Literature Review (A Review!)"
    t2 = "autolit autonomous literature review a review"
    assert normalize_title(t1) == normalize_title(t2)

def test_deduplicate_papers():
    p1 = RawPaperMetadata(id="1", title="Paper One", doi="10.1234/sample", abstract="abc")
    p2 = RawPaperMetadata(id="2", title="Paper One - Alternate", doi="10.1234/sample", abstract="abc")
    p3 = RawPaperMetadata(id="3", title="Paper One", doi=None, abstract="def")
    p4 = RawPaperMetadata(id="4", title="Paper Two", doi="10.5678/other", abstract="ghi")

    deduped = deduplicate_papers([p1, p2, p3, p4])
    assert len(deduped) == 2
    assert deduped[0].id == "1"
    assert deduped[1].id == "4"

def test_pymupdf_slicing():
    doc = pymupdf.open()
    for i in range(4):
        page = doc.new_page()
        page.insert_text((50, 50), f"This is test page {i+1} content.")
    
    pdf_bytes = doc.tobytes()
    extracted = extract_pdf_sections(pdf_bytes)
    assert "PAGE 1" in extracted
    assert "PAGE 2" in extracted
    assert "PAGE 3" in extracted
    assert "PAGE 4" in extracted

async def test_deep_discovery_and_ranges():
    papers = await discover_academic_papers(
        topic="supercavitation",
        max_results=10,
        year_min=2021,
        year_max=2025,
        no_year_constraint=False
    )
    assert isinstance(papers, list)
    assert len(papers) > 0
    print(f"Deep Discovery with Range (2021-2025): Discovered {len(papers)} papers across engines.")

async def test_assistant_chat():
    messages = [
        AssistantChatMessage(role="user", content="I want to review how AI evaluates medical scans.")
    ]
    res = await generate_assistant_response(messages)
    assert res.assistant_reply is not None
    assert len(res.suggested_queries) > 0
    print("AI Research Assistant generated queries:", res.suggested_queries[:2])

async def test_selected_pipeline():
    papers = await discover_academic_papers("supercavitation", max_results=3, year_min=2021)
    req = SelectedPipelineRequest(
        topic="supercavitation",
        selected_papers=papers,
        relevance_threshold=3
    )
    result = await run_pipeline_on_selected_papers(req)
    assert result.total_selected > 0
    print(f"Step 2 Synthesis on Selected Papers: Successfully synthesized {result.total_selected} papers.")

async def run_all_async_tests():
    await test_deep_discovery_and_ranges()
    await test_assistant_chat()
    await test_selected_pipeline()

if __name__ == "__main__":
    test_reconstruct_abstract()
    test_normalize_title()
    test_deduplicate_papers()
    test_pymupdf_slicing()
    print("All unit tests passed successfully!")
    
    asyncio.run(run_all_async_tests())
    print("All v2.0 integration tests passed successfully!")
