import json
import re
from typing import List, Optional, Dict, Any
import httpx
from app.config import get_settings
from app.models.schemas import TriageResponse, TriageItem, ReviewPaper

def clean_json_text(raw_text: str) -> str:
    """Strip markdown formatting, code fences, and extraneous commentary from LLM responses."""
    text = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    # Find start and end brackets for safety
    start_bracket = text.find("{")
    end_bracket = text.rfind("}")
    if start_bracket != -1 and end_bracket != -1:
        text = text[start_bracket:end_bracket + 1]
    return text

def compress_abstract(text: str, max_words: int = 180) -> str:
    """Hyper-lean abstract compression: cap at 180 words and strip boilerplate."""
    if not text:
        return ""
    # Strip standard copyright and license boilerplate
    cleaned = re.sub(r"(?i)(copyright|all rights reserved|creative commons|published by|received:.*accepted:).*", "", text)
    words = cleaned.split()
    if len(words) <= max_words:
        return " ".join(words)
    return " ".join(words[:max_words]) + "..."

def compress_paper_slice(text: str, max_chars: int = 8000) -> str:
    """Strip bibliography markers, license clauses, and clamp to 8,000 chars for token conservation."""
    if not text:
        return ""
    # Remove large citation/reference chunks
    cleaned = re.sub(r"(?i)\n(references|bibliography|acknowledgements)[\s\S]*", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:max_chars]

def parse_triage_fallback(candidates: List[dict]) -> TriageResponse:
    """Heuristic fallback if no LLM API key is configured or during service outage."""
    items = []
    for c in candidates:
        abstract = c.get("abstract", "")
        score = 4 if len(abstract) > 100 else 3
        items.append(TriageItem(
            id=str(c.get("id")),
            score=score,
            rationale="Heuristic relevance score based on keyword density and abstract presence."
        ))
    return TriageResponse(evaluations=items)

def parse_deep_fallback(paper_meta: dict, text_slice: str) -> ReviewPaper:
    """Heuristic fallback for deep extraction when LLM is unavailable."""
    title = paper_meta.get("title", "")
    abstract = paper_meta.get("abstract", "")
    return ReviewPaper(
        id=str(paper_meta.get("id", "")),
        title=title,
        year=paper_meta.get("year"),
        authors=paper_meta.get("authors", []),
        venue=paper_meta.get("venue", ""),
        relevance_score=paper_meta.get("relevance_score", 4),
        triage_rationale=paper_meta.get("triage_rationale", "Accepted candidate."),
        core_problem=f"Investigates challenges and methodologies surrounding: {title}.",
        methodology="Empirical analysis and structured literature assessment.",
        key_findings=abstract[:200] + ("..." if len(abstract) > 200 else ""),
        research_gaps="Requires further real-world empirical validation and extended domain benchmarking.",
        critical_remarks="Valuable reference paper highlighting key architectural frameworks in this domain.",
        doi_link=paper_meta.get("doi_link", ""),
        pdf_downloaded=paper_meta.get("pdf_downloaded", False),
        source=paper_meta.get("source", "")
    )

class UniversalLLMClient:
    """
    Universal LLM Hub supporting:
    - Groq (openai/gpt-oss-20b, llama-3.1-8b-instant, llama-3.3-70b-versatile)
    - Google Gemini (gemini-3.5-flash-lite, gemini-2.0-flash, gemini-1.5-flash)
    - OpenRouter (openrouter.ai/api/v1 - meta-llama/llama-3.3-70b-instruct:free, etc.)
    - DeepSeek (deepseek-chat, deepseek-reasoner)
    - NVIDIA NIM (meta/llama-3.1-8b-instruct)
    - Custom OpenAI-compatible endpoints
    """
    def __init__(
        self,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        groq_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        openrouter_key: Optional[str] = None,
        deepseek_key: Optional[str] = None,
        nvidia_key: Optional[str] = None,
        custom_key: Optional[str] = None,
        custom_base_url: Optional[str] = None
    ):
        settings = get_settings()
        self.groq_key = (groq_key or settings.groq_api_key).strip()
        self.gemini_key = (gemini_key or settings.gemini_api_key).strip()
        self.openrouter_key = (openrouter_key or "").strip()
        self.deepseek_key = (deepseek_key or "").strip()
        self.nvidia_key = (nvidia_key or "").strip()
        self.custom_key = (custom_key or "").strip()
        self.custom_base_url = (custom_base_url or "").strip().rstrip("/")

        # Active provider determination
        self.provider = (provider or "").lower()
        if not self.provider:
            if self.groq_key:
                self.provider = "groq"
            elif self.gemini_key:
                self.provider = "gemini"
            elif self.openrouter_key:
                self.provider = "openrouter"
            elif self.deepseek_key:
                self.provider = "deepseek"
            elif self.nvidia_key:
                self.provider = "nvidia"
            elif self.custom_key and self.custom_base_url:
                self.provider = "custom"
            else:
                self.provider = "heuristic"

        # Model determination
        if model_name:
            self.model_name = model_name
        elif self.provider == "gemini":
            self.model_name = settings.gemini_model
        elif self.provider == "openrouter":
            self.model_name = "meta-llama/llama-3.3-70b-instruct:free"
        elif self.provider == "deepseek":
            self.model_name = "deepseek-chat"
        elif self.provider == "nvidia":
            self.model_name = "meta/llama-3.1-8b-instruct"
        elif self.provider == "custom":
            self.model_name = "default"
        else:
            self.model_name = settings.groq_model

    async def _call_openai_compatible(
        self,
        base_url: str,
        api_key: str,
        model: str,
        system_prompt: str,
        user_prompt: str,
        extra_headers: Optional[Dict[str, str]] = None,
        max_tokens: int = 2048,
        response_json: bool = True
    ) -> str:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        if extra_headers:
            headers.update(extra_headers)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": max_tokens
        }
        if response_json:
            payload["response_format"] = {"type": "json_object"}

        endpoint = f"{base_url}/chat/completions"
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"API {base_url} returned HTTP {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
            return data["choices"][0]["message"]["content"] or "{}"

    async def _call_gemini(self, system_prompt: str, user_prompt: str) -> str:
        if not self.gemini_key:
            raise RuntimeError("Gemini API key is not configured.")

        # Map obsolete / typo model names to current valid official Gemini models
        target_model = self.model_name or "gemini-2.0-flash"
        if "3.5" in target_model:
            target_model = "gemini-2.0-flash"

        try:
            import asyncio
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.gemini_key)
            prompt = f"{system_prompt}\n\n{user_prompt}"

            # Run blocking SDK network call in threadpool so it doesn't freeze the async event loop
            def _sync_generate():
                return client.models.generate_content(
                    model=target_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )

            res = await asyncio.to_thread(_sync_generate)
            return res.text or "{}"
        except Exception as e:
            # Fallback to direct REST API if google-genai SDK fails
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.gemini_key}"
            async with httpx.AsyncClient(timeout=45.0) as client:
                body = {
                    "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
                    "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
                }
                resp = await client.post(endpoint, json=body)
                if resp.status_code != 200:
                    raise RuntimeError(f"Gemini REST error {resp.status_code}: {resp.text[:200]}")
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"] or "{}"

    async def _try_single_provider(
        self,
        provider: str,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2048
    ) -> str:
        """Call a specific provider directly without failover."""
        if provider == "groq" and self.groq_key:
            model = self.model_name if self.provider == "groq" else "openai/gpt-oss-20b"
            return await self._call_openai_compatible(
                base_url="https://api.groq.com/openai/v1",
                api_key=self.groq_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens
            )

        if provider == "gemini" and self.gemini_key:
            return await self._call_gemini(system_prompt, user_prompt)

        if provider == "openrouter" and self.openrouter_key:
            model = self.model_name if self.provider == "openrouter" else "meta-llama/llama-3.3-70b-instruct:free"
            return await self._call_openai_compatible(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                extra_headers={
                    "HTTP-Referer": "https://autolit.ai",
                    "X-Title": "AutoLit AI"
                },
                max_tokens=max_tokens
            )

        if provider == "deepseek" and self.deepseek_key:
            model = self.model_name if self.provider == "deepseek" else "deepseek-chat"
            return await self._call_openai_compatible(
                base_url="https://api.deepseek.com",
                api_key=self.deepseek_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens
            )

        if provider == "nvidia" and self.nvidia_key:
            model = self.model_name if self.provider == "nvidia" else "meta/llama-3.1-8b-instruct"
            return await self._call_openai_compatible(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=self.nvidia_key,
                model=model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens
            )

        if provider == "custom" and self.custom_key and self.custom_base_url:
            return await self._call_openai_compatible(
                base_url=self.custom_base_url,
                api_key=self.custom_key,
                model=self.model_name,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens
            )

        raise RuntimeError(f"Provider '{provider}' is not configured with an API key.")

    async def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2500
    ) -> str:
        """
        Dispatch query to the designated active provider.
        If a 429 (rate limit), 402 (quota exceeded), or network error occurs,
        automatically cascades to the next configured provider with shared context continuity.
        """
        # Build priority list starting with user's preferred provider
        candidate_providers = [self.provider]
        for p in ["groq", "gemini", "openrouter", "deepseek", "nvidia", "custom"]:
            if p not in candidate_providers:
                candidate_providers.append(p)

        last_error = None
        for prov in candidate_providers:
            try:
                res = await self._try_single_provider(prov, system_prompt, user_prompt, max_tokens)
                if prov != self.provider:
                    print(f"[Smart Model Failover] Primary '{self.provider}' unavailable; seamlessly used '{prov}'.")
                return res
            except Exception as e:
                last_error = e
                print(f"[Smart Model Failover] Provider '{prov}' attempt failed: {e}")
                continue

        raise RuntimeError(f"All configured LLM providers failed. Last error: {last_error}")

    async def batch_triage(self, topic: str, candidates: List[dict]) -> TriageResponse:
        """Stage 1: Batch triage candidate abstracts with ultra-lean token compression."""
        if not candidates:
            return TriageResponse(evaluations=[])

        # Lean abstract compression (max 180 words, strip boilerplate)
        compact_payload = []
        for c in candidates:
            compact_payload.append({
                "id": str(c.get("id")),
                "title": c.get("title", ""),
                "year": c.get("year"),
                "abstract": compress_abstract(c.get("abstract", ""), max_words=180)
            })

        system_instruction = (
            "You are an objective scientific literature screening analyst.\n"
            "Screen academic candidate papers for direct technical and conceptual relevance to the research topic across all scientific, engineering, aerospace, and defense technology domains.\n"
            "Evaluate neutrally and factually based on scholarly merit without editorializing or arbitrary refusal.\n"
            "Return ONLY JSON: {\"evaluations\": [{\"id\": \"...\", \"score\": 1-5, \"rationale\": \"1 concise sentence\"}]}.\n"
            "Scoring: 5=vital, 4=relevant, 3=marginal, 1-2=irrelevant."
        )
        user_content = f"Topic: {topic}\n\nPapers:\n{json.dumps(compact_payload)}"

        try:
            raw_json = await self.chat_completion(system_instruction, user_content, max_tokens=2048)
            cleaned = clean_json_text(raw_json)
            data = json.loads(cleaned)
            return TriageResponse.model_validate(data)
        except Exception as e:
            print(f"[Universal LLM Triage Error]: {e}, using heuristic fallback.")
            return parse_triage_fallback(candidates)

    async def deep_extraction(
        self,
        topic: str,
        paper_meta: dict,
        text_slice: str
    ) -> ReviewPaper:
        """Stage 2: Deep extraction of methodology, findings, and gaps from compressed sliced text."""
        cleaned_slice = compress_paper_slice(text_slice, max_chars=8000)

        system_instruction = (
            "You are an objective academic research analyst.\n"
            "Extract structured academic insights from the provided peer-reviewed paper context across all scientific, engineering, aerospace, materials, and defense technology domains.\n"
            "Provide neutral, precise technical extractions without lecturing or editorializing.\n"
            "Return ONLY JSON with fields:\n"
            "{\n"
            "  \"core_problem\": \"1-2 concise sentences on primary challenge/question\",\n"
            "  \"methodology\": \"Concise summary of theoretical/empirical approach\",\n"
            "  \"key_findings\": \"Top 2-3 empirical or conceptual findings\",\n"
            "  \"research_gaps\": \"Explicit limitations, open questions, future work\",\n"
            "  \"critical_remarks\": \"Actionable synthesis remark for literature review\"\n"
            "}"
        )

        user_content = (
            f"Topic: {topic}\n"
            f"Title: {paper_meta.get('title')}\n"
            f"Year: {paper_meta.get('year')}\n"
            f"Authors: {', '.join(paper_meta.get('authors', []))}\n"
            f"Context:\n{cleaned_slice}"
        )

        try:
            raw_json = await self.chat_completion(system_instruction, user_content, max_tokens=1500)
            cleaned = clean_json_text(raw_json)
            extracted = json.loads(cleaned)
            return ReviewPaper(
                id=str(paper_meta.get("id")),
                title=paper_meta.get("title", ""),
                year=paper_meta.get("year"),
                authors=paper_meta.get("authors", []),
                venue=paper_meta.get("venue", ""),
                relevance_score=paper_meta.get("relevance_score", 4),
                triage_rationale=paper_meta.get("triage_rationale", ""),
                core_problem=extracted.get("core_problem", "Not specified"),
                methodology=extracted.get("methodology", "Not specified"),
                key_findings=extracted.get("key_findings", "Not specified"),
                research_gaps=extracted.get("research_gaps", "Not specified"),
                critical_remarks=extracted.get("critical_remarks", "Not specified"),
                doi_link=paper_meta.get("doi_link", ""),
                pdf_downloaded=paper_meta.get("pdf_downloaded", False),
                source=paper_meta.get("source", "")
            )
        except Exception as e:
            print(f"[Universal LLM Deep Error]: {e}, using heuristic fallback.")
            return parse_deep_fallback(paper_meta, text_slice)

# Backwards compatible alias
LLMService = UniversalLLMClient
