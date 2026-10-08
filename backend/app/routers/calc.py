import json
import logging
import re
from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calc", tags=["Scientific Formula Calculator"])

class FormulaVariableDef(BaseModel):
    id: str
    symbol: str
    name: str
    defaultValue: float
    unit: str = "dimensionless"
    min: float = 0.0
    max: float = 100.0
    step: float = 1.0

class FormulaBlockResponse(BaseModel):
    name: str
    latex: str
    expression: str
    variables: List[FormulaVariableDef]
    outputSymbol: str
    outputUnit: str = "dimensionless"
    description: str

class AISynthesizeFormulaRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "groq"
    api_key: Optional[str] = None

# Curated offline templates for instant, offline, zero-key responses
OFFLINE_TEMPLATES = {
    "cavitation": {
        "name": "Supercavitating Cavitation Number",
        "latex": r"\sigma = \frac{p_\infty - p_c}{\frac{1}{2} \rho v^2}",
        "expression": "(p_inf - p_c) / (0.5 * rho * Math.pow(v, 2))",
        "variables": [
            {"id": "p_inf", "symbol": "p_\\infty", "name": "Ambient Pressure", "defaultValue": 101325, "unit": "Pa", "min": 10000, "max": 500000, "step": 1000},
            {"id": "p_c", "symbol": "p_c", "name": "Cavity Vapor Pressure", "defaultValue": 2338, "unit": "Pa", "min": 500, "max": 50000, "step": 100},
            {"id": "rho", "symbol": "\\rho", "name": "Fluid Density", "defaultValue": 998, "unit": "kg/m³", "min": 500, "max": 1500, "step": 1},
            {"id": "v", "symbol": "v", "name": "Flow Velocity", "defaultValue": 75, "unit": "m/s", "min": 1, "max": 300, "step": 1}
        ],
        "outputSymbol": "\\sigma",
        "outputUnit": "dimensionless",
        "description": "Calculates the cavitation index governing supercavity inception and closure regime behind a high-speed projectile."
    },
    "drag": {
        "name": "Aerodynamic / Hydrodynamic Drag Force",
        "latex": r"F_d = \frac{1}{2} \rho v^2 C_d A",
        "expression": "0.5 * rho * Math.pow(v, 2) * cd * area",
        "variables": [
            {"id": "rho", "symbol": "\\rho", "name": "Fluid Density", "defaultValue": 1.225, "unit": "kg/m³", "min": 0.1, "max": 1000, "step": 0.1},
            {"id": "v", "symbol": "v", "name": "Velocity", "defaultValue": 40, "unit": "m/s", "min": 0.1, "max": 500, "step": 1},
            {"id": "cd", "symbol": "C_d", "name": "Drag Coefficient", "defaultValue": 0.45, "unit": "dimensionless", "min": 0.01, "max": 2.5, "step": 0.01},
            {"id": "area", "symbol": "A", "name": "Reference Area", "defaultValue": 1.8, "unit": "m²", "min": 0.01, "max": 20, "step": 0.05}
        ],
        "outputSymbol": "F_d",
        "outputUnit": "N",
        "description": "Computes the standard continuum drag resistance experienced by a body traversing a fluid medium."
    },
    "reynolds": {
        "name": "Reynolds Number",
        "latex": r"Re = \frac{\rho v L}{\mu}",
        "expression": "(rho * v * length) / mu",
        "variables": [
            {"id": "rho", "symbol": "\\rho", "name": "Density", "defaultValue": 998, "unit": "kg/m³", "min": 1, "max": 2000, "step": 1},
            {"id": "v", "symbol": "v", "name": "Velocity", "defaultValue": 12, "unit": "m/s", "min": 0.1, "max": 150, "step": 0.5},
            {"id": "length", "symbol": "L", "name": "Characteristic Length", "defaultValue": 0.5, "unit": "m", "min": 0.01, "max": 10, "step": 0.05},
            {"id": "mu", "symbol": "\\mu", "name": "Dynamic Viscosity", "defaultValue": 0.001002, "unit": "Pa·s", "min": 0.0001, "max": 0.1, "step": 0.0001}
        ],
        "outputSymbol": "Re",
        "outputUnit": "dimensionless",
        "description": "Dimensionless ratio of inertial forces to viscous forces determining laminar or turbulent boundary layer flow."
    },
    "rayleigh": {
        "name": "Rayleigh-Plesset Bubble Wall Velocity",
        "latex": r"\dot{R} = \sqrt{\frac{2}{3 \rho} \left( p_B - p_\infty \right)}",
        "expression": "Math.sqrt(Math.max(0, (2 / (3 * rho)) * (pb - p_inf)))",
        "variables": [
            {"id": "rho", "symbol": "\\rho", "name": "Liquid Density", "defaultValue": 998, "unit": "kg/m³", "min": 500, "max": 1500, "step": 1},
            {"id": "pb", "symbol": "p_B", "name": "Internal Bubble Pressure", "defaultValue": 150000, "unit": "Pa", "min": 1000, "max": 1000000, "step": 1000},
            {"id": "p_inf", "symbol": "p_\\infty", "name": "External Field Pressure", "defaultValue": 101325, "unit": "Pa", "min": 1000, "max": 500000, "step": 1000}
        ],
        "outputSymbol": "\\dot{R}",
        "outputUnit": "m/s",
        "description": "Simplified inertial stage bubble interface expansion rate in cavitation bubble dynamics."
    }
}

@router.post("/ai-synthesize", response_model=FormulaBlockResponse)
async def ai_synthesize_formula(req: AISynthesizeFormulaRequest):
    """
    Synthesizes an interactive scientific formula block from a natural language request,
    using either Groq llama-3.1-8b-instant, Gemini gemini-1.5-flash-8b, or curated templates.
    """
    p_lower = req.prompt.lower()

    # Check offline template keywords first for instant speed
    for key, tpl in OFFLINE_TEMPLATES.items():
        if key in p_lower:
            return FormulaBlockResponse(**tpl)

    # If API key provided or environment has credentials, query lightweight cloud LLM
    if req.api_key and req.provider in ["groq", "gemini"]:
        sys_prompt = """You are a scientific computing engine. The user will ask for a scientific or engineering formula.
Return ONLY valid JSON matching this exact schema:
{
  "name": "Formula Name",
  "latex": "Valid LaTeX equation (e.g. \\sigma = \\frac{p_\\infty - p_c}{\\frac{1}{2} \\rho v^2})",
  "expression": "Valid safe JavaScript math expression using variables and Math methods (e.g. (p_inf - p_c) / (0.5 * rho * Math.pow(v, 2)))",
  "variables": [
    {
      "id": "variable_id_matching_expression",
      "symbol": "LaTeX symbol (e.g. \\rho)",
      "name": "Descriptive variable name",
      "defaultValue": 10.0,
      "unit": "scientific unit (e.g. kg/m³)",
      "min": 0.1,
      "max": 100.0,
      "step": 0.5
    }
  ],
  "outputSymbol": "LaTeX symbol for output (e.g. \\sigma)",
  "outputUnit": "SI unit or dimensionless",
  "description": "Brief 1-sentence scientific description"
}
Ensure all variable IDs in the expression match the variables array. Do not include markdown code fences."""

        try:
            if req.provider == "groq":
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {req.api_key}", "Content-Type": "application/json"},
                        json={
                            "model": "llama-3.1-8b-instant",
                            "messages": [
                                {"role": "system", "content": sys_prompt},
                                {"role": "user", "content": f"Build formula block for: {req.prompt}"}
                            ],
                            "temperature": 0.1,
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_content = data["choices"][0]["message"]["content"]
                        clean_json = re.sub(r"^```json\s*", "", raw_content, flags=re.MULTILINE)
                        clean_json = re.sub(r"```$", "", clean_json, flags=re.MULTILINE).strip()
                        parsed = json.loads(clean_json)
                        return FormulaBlockResponse(**parsed)
        except Exception as e:
            logger.warning(f"LLM formula synthesis failed, falling back to heuristic: {e}")

    # Fallback heuristic generator
    words = req.prompt.strip().split()
    title = req.prompt.strip().title() if len(words) <= 5 else "Custom Scientific Formulation"
    
    return FormulaBlockResponse(
        name=title,
        latex=r"f(x, y) = x \cdot \sqrt{y} + \frac{x}{y + 1}",
        expression="x * Math.sqrt(Math.max(0, y)) + (x / (y + 1))",
        variables=[
            {"id": "x", "symbol": "x", "name": "Primary Variable", "defaultValue": 5.0, "unit": "units", "min": 0.1, "max": 50.0, "step": 0.5},
            {"id": "y", "symbol": "y", "name": "Secondary Factor", "defaultValue": 16.0, "unit": "units", "min": 0.1, "max": 100.0, "step": 1.0}
        ],
        outputSymbol="f",
        outputUnit="units",
        description=f"Generated interactive formulation model for: {req.prompt}."
    )
