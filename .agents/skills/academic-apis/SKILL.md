---
name: academic-apis
description: >-
  Academic literature search and retrieval skill for AutoLit AI.
  Use when querying OpenAlex, Semantic Scholar, arXiv, and Unpaywall APIs,
  and executing deduplication by DOI or normalized title.
---

# Academic APIs & Deduplication Guide

This skill governs querying academic discovery APIs across all major publishers and preprint servers, handling rate limits, parsing responses cleanly, and deduplicating literature entries.

## 1. Primary Aggregators (Covering ScienceDirect, Springer, IEEE, Nature, Cell, Wiley)

### A. OpenAlex API (100% Free, 100k requests/day)
- **Base URL:** `https://api.openalex.org/works`
- **Coverage:** 250M+ papers indexing all major publishers (ScienceDirect/Elsevier, Scopus, Springer, IEEE, Wiley, PubMed).
- **Polite Pool:** Include `mailto=autolit@research.local` in parameters.
- **Filter Syntax:** `publication_year:>{year_min - 1}`.

### B. Crossref REST API (Official DOI Registry for All Publishers)
- **Base URL:** `https://api.crossref.org/works`
- **Coverage:** Official metadata registry for every publisher (Elsevier, IEEE, Springer Nature, Wiley, ACM, Oxford, Cambridge).
- **Query Parameters:** `query={topic}&rows={max_results}&select=DOI,title,author,published-print,published-online,container-title,abstract,link`
- **Polite Pool:** Include `User-Agent: AutoLit/1.0 (mailto:autolit@research.local)`.

### C. Europe PMC API (Biomedical & Life Sciences)
- **Base URL:** `https://www.ebi.ac.uk/europepmc/webservices/rest/search`
- **Query Parameters:** `query={topic} AND (FIRST_PDATE:[{year_min} TO 2026])&format=json&pageSize={max_results}&resultType=core`
- **Extracts:** Title, authors, journalTitle, pubYear, doi, fullTextUrlList.

### D. Semantic Scholar API
- **Base URL:** `https://api.semanticscholar.org/graph/v1/paper/search`
- **Query Parameters:** `query={topic}&limit={max_results}&fields=paperId,externalIds,title,abstract,year,authors,venue,citationCount,openAccessPdf`

---

## 2. Specialized & Publisher APIs (Optional Keys)

### E. arXiv API (100% Free Preprints)
- **Base URL:** `http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={max_results}`

### F. Elsevier ScienceDirect / Scopus API (Optional `ELSEVIER_API_KEY`)
- **Base URL:** `https://api.elsevier.com/content/search/scopus` or `/science/search`
- **Header:** `X-ELS-APIKey: {ELSEVIER_API_KEY}`

### G. IEEE Xplore API (Optional `IEEE_API_KEY`)
- **Base URL:** `https://ieeexploreapi.ieee.org/api/v1/search/articles`
- **Param:** `apikey={IEEE_API_KEY}&querytext={topic}`



---

## 4. Unpaywall API (OA DOI Resolver)
- **Base URL:** `https://api.unpaywall.org/v2/{doi}`
- **Query Param:** `email=autolit@research.local`
- **OA Resolution:** Check `is_oa == True` and extract `best_oa_location.url_for_pdf`.

---

## 5. Deduplication Protocol
Deduplicate incoming papers across all sources before triage:
```python
import re

def normalize_title(title: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', title.lower())
    return cleaned.strip()

def deduplicate_papers(papers: list[dict]) -> list[dict]:
    seen_dois = set()
    seen_titles = set()
    unique_papers = []

    for p in papers:
        doi = (p.get("doi") or "").lower().strip()
        title_key = normalize_title(p.get("title") or "")

        if doi and doi in seen_dois:
            continue
        if title_key and title_key in seen_titles:
            continue

        if doi:
            seen_dois.add(doi)
        if title_key:
            seen_titles.add(title_key)
        unique_papers.append(p)

    return unique_papers
```
