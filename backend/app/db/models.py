import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from app.db.database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, default="Researcher")
    password_hash = Column(String(255), nullable=True)
    auth_provider = Column(String(50), default="local") # "local", "google", "apple", "demo"

    # Encrypted BYOK Keys
    groq_key_encrypted = Column(Text, nullable=True)
    gemini_key_encrypted = Column(Text, nullable=True)
    openrouter_key_encrypted = Column(Text, nullable=True)
    deepseek_key_encrypted = Column(Text, nullable=True)
    nvidia_key_encrypted = Column(Text, nullable=True)
    custom_api_key_encrypted = Column(Text, nullable=True)
    custom_base_url = Column(String(500), nullable=True)

    selected_model = Column(String(100), default="openai/gpt-oss-20b")
    theme_pref = Column(String(50), default="emerald")
    save_chat_history = Column(Boolean, default=True) # Privacy control toggle
    contribute_public_cache = Column(Boolean, default=True) # Shared paper knowledge base
    created_at = Column(DateTime, default=get_utc_now)

class DiscoveryCache(Base):
    """Tier 1 Cache: Raw candidate paper pool discovered from academic APIs."""
    __tablename__ = "discovery_cache"

    query_hash = Column(String(64), primary_key=True, index=True)
    topic = Column(String(500), nullable=False)
    filters_json = Column(Text, nullable=False)
    papers_json = Column(Text, nullable=False) # JSON serialized List[RawPaperMetadata]
    total_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=get_utc_now)
    access_count = Column(Integer, default=1)

class PaperCache(Base):
    """Tier 2 Cache: Synthesized literature reviews keyed by normalized DOI / Title."""
    __tablename__ = "papers_cache"

    cache_key = Column(String(128), primary_key=True, index=True) # Normalized DOI or title hash
    doi = Column(String(255), nullable=True)
    title = Column(String(500), nullable=False)
    authors_json = Column(Text, nullable=False)
    year = Column(Integer, nullable=True)
    venue = Column(String(255), nullable=True)
    abstract = Column(Text, nullable=True)
    is_oa = Column(Boolean, default=False)
    pdf_url = Column(String(1000), nullable=True)

    # Synthesis fields
    relevance_score = Column(Integer, default=4)
    triage_rationale = Column(Text, nullable=True)
    core_problem = Column(Text, nullable=False)
    methodology = Column(Text, nullable=False)
    key_findings = Column(Text, nullable=False)
    research_gaps = Column(Text, nullable=False)
    critical_remarks = Column(Text, nullable=False)
    source = Column(String(50), default="openalex")

    created_at = Column(DateTime, default=get_utc_now)
    access_count = Column(Integer, default=1)

class PaperDocumentVault(Base):
    """Tier 3 Document Vault: Persistent binary PDF store, extracted layouts, and figure images."""
    __tablename__ = "paper_document_vault"

    id = Column(String(64), primary_key=True, index=True) # Normalized DOI or Title SHA-256
    doi = Column(String(255), index=True, nullable=True)
    title = Column(String(500), nullable=False)
    file_path = Column(String(500), nullable=False) # app_data/pdf_vault/{safe_id}.pdf
    file_size_bytes = Column(Integer, default=0)
    file_sha256 = Column(String(64), nullable=False)
    source_resolved = Column(String(50), default="direct_oa") # arxiv, openalex, unpaywall, europe_pmc, scihub
    
    # Deep Parsing Cache
    parsed_fulltext = Column(Text, nullable=True)
    figures_json = Column(Text, nullable=True) # JSON list of {id, page, img_path, caption}
    sections_json = Column(Text, nullable=True) # JSON dictionary of section contents
    
    download_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=get_utc_now)

class ChatHistory(Base):
    """Saved research assistant conversation transcripts."""
    __tablename__ = "chat_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=True)
    title = Column(String(255), default="New Research Inquiry")
    messages_json = Column(Text, nullable=False) # JSON list of messages
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
