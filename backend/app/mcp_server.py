"""
AutoLit AI - Model Context Protocol (MCP) Server
Allows external tools (Claude Desktop, Cursor, Antigravity, custom agents)
to connect directly to AutoLit AI's academic discovery, triage, and synthesis engines.
"""

import sys
import json
import asyncio
from typing import Any, Dict, List
from app.services.academic_search import discover_academic_papers
from app.services.llm_provider import UniversalLLMClient
from app.services.pdf_service import get_paper_content_slices
from app.models.schemas import RawPaperMetadata, ReviewPaper

MCP_PROTOCOL_VERSION = "2024-11-05"

TOOLS = [
    {
        "name": "autolit_search_literature",
        "description": "Search academic literature across OpenAlex, Crossref, Europe PMC, arXiv, and Semantic Scholar with dual-layer caching and rate-shield.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Academic search query or topic."},
                "max_results": {"type": "integer", "description": "Max candidates to retrieve (20, 50, 100, 200). Default 30.", "default": 30},
                "year_min": {"type": "integer", "description": "Start publication year (optional)."},
                "year_max": {"type": "integer", "description": "End publication year (optional)."},
                "no_year_constraint": {"type": "boolean", "description": "Whether to ignore year constraints. Default false.", "default": False}
            },
            "required": ["topic"]
        }
    },
    {
        "name": "autolit_triage_candidates",
        "description": "Stage 1: Batch triage paper abstracts for relevance scoring (1-5) and rationale using token-compressed LLM screening.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Research topic"},
                "candidates": {
                    "type": "array",
                    "description": "List of candidate objects with id, title, abstract",
                    "items": {"type": "object"}
                },
                "provider": {"type": "string", "description": "LLM provider: groq, gemini, openrouter, deepseek, nvidia. Default groq.", "default": "groq"},
                "api_key": {"type": "string", "description": "Optional provider API key."}
            },
            "required": ["topic", "candidates"]
        }
    },
    {
        "name": "autolit_deep_extract",
        "description": "Stage 2: Deep extraction of core problem, methodology, findings, and research gaps from sliced paper content.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Research topic"},
                "paper": {"type": "object", "description": "Candidate paper object with title, doi, abstract, etc."},
                "provider": {"type": "string", "description": "LLM provider (groq, gemini, deepseek, etc.). Default groq.", "default": "groq"},
                "api_key": {"type": "string", "description": "Optional provider API key."}
            },
            "required": ["topic", "paper"]
        }
    },
    {
        "name": "autolit_export_matrix",
        "description": "Format a list of synthesized papers into a literature review matrix markdown table.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "papers": {
                    "type": "array",
                    "description": "List of synthesized review papers",
                    "items": {"type": "object"}
                }
            },
            "required": ["papers"]
        }
    }
]

async def handle_tool_call(name: str, arguments: Dict[str, Any]) -> Any:
    if name == "autolit_search_literature":
        topic = arguments.get("topic", "")
        max_results = arguments.get("max_results", 30)
        year_min = arguments.get("year_min")
        year_max = arguments.get("year_max")
        no_year_constraint = arguments.get("no_year_constraint", False)

        papers = await discover_academic_papers(
            topic=topic,
            max_results=max_results,
            year_min=year_min,
            year_max=year_max,
            no_year_constraint=no_year_constraint
        )
        return [p.model_dump() for p in papers]

    elif name == "autolit_triage_candidates":
        topic = arguments.get("topic", "")
        candidates = arguments.get("candidates", [])
        provider = arguments.get("provider", "groq")
        api_key = arguments.get("api_key")

        llm_kwargs = {"provider": provider}
        if provider == "groq" and api_key:
            llm_kwargs["groq_key"] = api_key
        elif provider == "gemini" and api_key:
            llm_kwargs["gemini_key"] = api_key
        elif provider == "openrouter" and api_key:
            llm_kwargs["openrouter_key"] = api_key
        elif provider == "deepseek" and api_key:
            llm_kwargs["deepseek_key"] = api_key

        client = UniversalLLMClient(**llm_kwargs)
        triage_resp = await client.batch_triage(topic=topic, candidates=candidates)
        return triage_resp.model_dump()

    elif name == "autolit_deep_extract":
        topic = arguments.get("topic", "")
        paper_dict = arguments.get("paper", {})
        provider = arguments.get("provider", "groq")
        api_key = arguments.get("api_key")

        doi = paper_dict.get("doi")
        pdf_url = paper_dict.get("pdf_url")
        abstract = paper_dict.get("abstract", "")

        sliced_text, pdf_downloaded = await get_paper_content_slices(
            doi=doi,
            pdf_url=pdf_url,
            abstract=abstract
        )
        paper_dict["pdf_downloaded"] = pdf_downloaded

        llm_kwargs = {"provider": provider}
        if provider == "groq" and api_key:
            llm_kwargs["groq_key"] = api_key
        elif provider == "gemini" and api_key:
            llm_kwargs["gemini_key"] = api_key
        elif provider == "openrouter" and api_key:
            llm_kwargs["openrouter_key"] = api_key
        elif provider == "deepseek" and api_key:
            llm_kwargs["deepseek_key"] = api_key

        client = UniversalLLMClient(**llm_kwargs)
        result = await client.deep_extraction(topic=topic, paper_meta=paper_dict, text_slice=sliced_text)
        return result.model_dump()

    elif name == "autolit_export_matrix":
        papers = arguments.get("papers", [])
        md_lines = [
            "| Title | Year | Score | Core Problem | Methodology | Key Findings | Research Gaps | DOI |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
        ]
        for p in papers:
            title = p.get("title", "").replace("|", "\\|")
            year = str(p.get("year", ""))
            score = str(p.get("relevance_score", ""))
            problem = p.get("core_problem", "").replace("|", "\\|")
            method = p.get("methodology", "").replace("|", "\\|")
            findings = p.get("key_findings", "").replace("|", "\\|")
            gaps = p.get("research_gaps", "").replace("|", "\\|")
            doi = p.get("doi_link", "")
            md_lines.append(f"| {title} | {year} | {score} | {problem} | {method} | {findings} | {gaps} | [{doi}]({doi}) |")
        return {"markdown_matrix": "\n".join(md_lines)}

    raise ValueError(f"Unknown MCP tool: {name}")

async def run_mcp_server():
    """Run standard stdio JSON-RPC loop for Model Context Protocol."""
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break
        text = line.decode("utf-8").strip()
        if not text:
            continue
        try:
            req = json.loads(text)
        except Exception:
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        response: Dict[str, Any] = {"jsonrpc": "2.0", "id": req_id}

        if method == "initialize":
            response["result"] = {
                "protocolVersion": MCP_PROTOCOL_VERSION,
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "autolit-ai-mcp",
                    "version": "3.0.0"
                }
            }
        elif method == "notifications/initialized":
            continue
        elif method == "ping":
            response["result"] = {}
        elif method == "tools/list":
            response["result"] = {"tools": TOOLS}
        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            try:
                result_data = await handle_tool_call(tool_name, tool_args)
                response["result"] = {
                    "content": [
                        {"type": "text", "text": json.dumps(result_data, indent=2)}
                    ]
                }
            except Exception as e:
                response["error"] = {"code": -32000, "message": str(e)}
        else:
            response["error"] = {"code": -32601, "message": f"Method '{method}' not found"}

        out = json.dumps(response) + "\n"
        sys.stdout.write(out)
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(run_mcp_server())
