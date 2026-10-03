import io
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import pandas as pd
from app.models.schemas import ReviewPaper

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.post("/excel")
async def export_to_excel(papers: List[ReviewPaper]):
    """Generate and stream formatted Excel (.xlsx) file from literature review results."""
    try:
        data = []
        for p in papers:
            data.append({
                "Title": p.title,
                "Year": p.year or "N/A",
                "Authors": ", ".join(p.authors),
                "Venue": p.venue or "N/A",
                "Relevance Score (1-5)": p.relevance_score,
                "Triage Rationale": p.triage_rationale,
                "Core Problem": p.core_problem,
                "Methodology": p.methodology,
                "Key Findings": p.key_findings,
                "Research Gaps": p.research_gaps,
                "Critical Remarks": p.critical_remarks,
                "DOI / Link": p.doi_link,
                "Open Access PDF": "Yes" if p.pdf_downloaded else "No",
                "Source": p.source
            })

        df = pd.DataFrame(data)
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Literature Review')
            worksheet = writer.sheets['Literature Review']
            
            # Format column widths
            for col in worksheet.columns:
                max_len = 0
                col_letter = col[0].column_letter
                for cell in col:
                    try:
                        if cell.value:
                            max_len = max(max_len, len(str(cell.value)))
                    except Exception:
                        pass
                worksheet.column_dimensions[col_letter].width = min(max_len + 4, 50)

        output.seek(0)
        headers = {
            'Content-Disposition': 'attachment; filename="AutoLit_Review_Matrix.xlsx"'
        }
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel sheet: {str(e)}")
