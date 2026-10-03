from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    SearchRequest,
    PipelineResponse,
    DiscoveryResponse,
    SelectedPipelineRequest,
    HealthStatus
)
from app.services.pipeline import run_literature_review_pipeline, run_pipeline_on_selected_papers
from app.services.academic_search import discover_academic_papers
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["Literature Review"])

@router.post("/discover", response_model=DiscoveryResponse)
async def discover_papers(request: SearchRequest):
    """Step 1: Discover candidate literature across all engines before running LLM triage."""
    try:
        papers = await discover_academic_papers(
            topic=request.topic,
            max_results=request.max_results,
            offset=request.offset,
            exclude_dois=request.exclude_dois,
            year_min=request.year_min,
            year_max=request.year_max,
            no_year_constraint=request.no_year_constraint
        )
        warnings = []
        if not papers:
            warnings.append("No literature was found matching your query and year constraints.")

        return DiscoveryResponse(
            topic=request.topic,
            total_discovered=len(papers),
            papers=papers,
            warnings=warnings
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery failed: {str(e)}")

@router.post("/pipeline/selected", response_model=PipelineResponse)
async def execute_selected_pipeline(request: SelectedPipelineRequest):
    """Step 2: Execute Stage 1 Triage & Stage 2 Deep Extraction on user-selected papers."""
    try:
        response = await run_pipeline_on_selected_papers(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Selected synthesis failed: {str(e)}")

@router.post("/pipeline", response_model=PipelineResponse)
async def execute_pipeline(request: SearchRequest):
    """Autonomous end-to-end literature discovery, triage, and deep extraction."""
    try:
        response = await run_literature_review_pipeline(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

@router.get("/health", response_model=HealthStatus)
def health_check():
    """Verify backend status and cloud LLM configuration."""
    settings = get_settings()
    return HealthStatus(
        status="healthy",
        groq_configured=bool(settings.groq_api_key),
        gemini_configured=bool(settings.gemini_api_key),
        groq_model=settings.groq_model,
        gemini_model=settings.gemini_model
    )
