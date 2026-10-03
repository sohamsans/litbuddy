import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from app.db.database import get_db
from app.db.models import User, ChatHistory, DiscoveryCache
from app.models.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    OAuthDemoRequest,
    AuthTokenResponse,
    UserProfileResponse,
    UpdateKeysRequest,
    SaveChatHistoryRequest,
    ChatHistoryResponse,
    AssistantChatMessage
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    encrypt_key,
    decrypt_key,
    mask_key,
    PROVIDERS_METADATA,
    SECURITY_ASSURANCE
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & BYOK"])

async def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Helper to extract user from Bearer JWT token if present."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = verify_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_current_user_required(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
) -> User:
    user = await get_current_user_optional(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication token required or expired.")
    return user

@router.get("/providers-info")
def get_providers_info():
    """Returns directory of AI providers, direct key links, free tier limits, and privacy assurance."""
    return {
        "providers": PROVIDERS_METADATA,
        "security_assurance": SECURITY_ASSURANCE
    }

@router.post("/register", response_model=AuthTokenResponse)
async def register_user(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create new account with email & password."""
    # Check if user already exists
    stmt = select(User).where(User.email == req.email.lower().strip())
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        email=req.email.lower().strip(),
        name=req.name or "Researcher",
        password_hash=hash_password(req.password),
        auth_provider="local"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(user_id=new_user.id, email=new_user.email)
    return AuthTokenResponse(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        name=new_user.name
    )

@router.post("/login", response_model=AuthTokenResponse)
async def login_user(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Sign in with email and password."""
    stmt = select(User).where(User.email == req.email.lower().strip())
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user_id=user.id, email=user.email)
    return AuthTokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        name=user.name
    )

@router.post("/oauth-mock", response_model=AuthTokenResponse)
async def oauth_mock_signin(req: OAuthDemoRequest, db: AsyncSession = Depends(get_db)):
    """Instant 1-click authentication for Google, Apple, or Quick Demo sessions."""
    provider = req.provider.lower()
    email = req.email.lower().strip() if req.email else f"{provider}_user_{datetime.now().strftime('%Y%m%d%H%M%S')}@autolit.local"
    name = req.name or f"{provider.capitalize()} User"

    # Find or create
    stmt = select(User).where(User.email == email)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            name=name,
            auth_provider=provider
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email)
    return AuthTokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        name=user.name
    )

@router.get("/me", response_model=UserProfileResponse)
async def get_current_profile(user: User = Depends(get_current_user_required)):
    """Return user profile and masked configured keys (protecting plain keys)."""
    # Decrypt and mask
    groq_plain = decrypt_key(user.groq_key_encrypted)
    gemini_plain = decrypt_key(user.gemini_key_encrypted)
    openrouter_plain = decrypt_key(user.openrouter_key_encrypted)
    deepseek_plain = decrypt_key(user.deepseek_key_encrypted)
    nvidia_plain = decrypt_key(user.nvidia_key_encrypted)
    custom_plain = decrypt_key(user.custom_api_key_encrypted)

    configured_keys = {
        "groq": mask_key(groq_plain),
        "gemini": mask_key(gemini_plain),
        "openrouter": mask_key(openrouter_plain),
        "deepseek": mask_key(deepseek_plain),
        "nvidia": mask_key(nvidia_plain),
        "custom": mask_key(custom_plain),
        "custom_base_url": user.custom_base_url or ""
    }

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        auth_provider=user.auth_provider or "local",
        selected_model=user.selected_model or "openai/gpt-oss-20b",
        theme_pref=user.theme_pref or "emerald",
        save_chat_history=bool(user.save_chat_history if user.save_chat_history is not None else True),
        contribute_public_cache=bool(user.contribute_public_cache if user.contribute_public_cache is not None else True),
        configured_keys=configured_keys
    )

@router.post("/keys")
async def update_byok_keys(
    req: UpdateKeysRequest,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    """Save AES-256 encrypted API keys and privacy preferences for the authenticated user."""
    if req.groq_api_key is not None:
        user.groq_key_encrypted = encrypt_key(req.groq_api_key) if req.groq_api_key.strip() else None
    if req.gemini_api_key is not None:
        user.gemini_key_encrypted = encrypt_key(req.gemini_api_key) if req.gemini_api_key.strip() else None
    if req.openrouter_api_key is not None:
        user.openrouter_key_encrypted = encrypt_key(req.openrouter_api_key) if req.openrouter_api_key.strip() else None
    if req.deepseek_api_key is not None:
        user.deepseek_key_encrypted = encrypt_key(req.deepseek_api_key) if req.deepseek_api_key.strip() else None
    if req.nvidia_api_key is not None:
        user.nvidia_key_encrypted = encrypt_key(req.nvidia_api_key) if req.nvidia_api_key.strip() else None
    if req.custom_api_key is not None:
        user.custom_api_key_encrypted = encrypt_key(req.custom_api_key) if req.custom_api_key.strip() else None
    if req.custom_base_url is not None:
        user.custom_base_url = req.custom_base_url.strip() if req.custom_base_url.strip() else None
    if req.selected_model:
        user.selected_model = req.selected_model
    if req.theme_pref:
        user.theme_pref = req.theme_pref
    if req.save_chat_history is not None:
        user.save_chat_history = req.save_chat_history
    if req.contribute_public_cache is not None:
        user.contribute_public_cache = req.contribute_public_cache

    await db.commit()
    return {"status": "success", "message": "Preferences and API keys saved securely."}

@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_user_history(
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve saved assistant chat history for the user."""
    stmt = select(ChatHistory).where(ChatHistory.user_id == user.id).order_by(desc(ChatHistory.updated_at)).limit(25)
    result = await db.execute(stmt)
    records = result.scalars().all()

    items = []
    for r in records:
        try:
            msgs = json.loads(r.messages_json)
            parsed_msgs = [AssistantChatMessage(role=m.get("role"), content=m.get("content")) for m in msgs]
        except Exception:
            parsed_msgs = []
        items.append(ChatHistoryResponse(
            id=r.id,
            title=r.title,
            messages=parsed_msgs,
            created_at=r.created_at.isoformat() if r.created_at else ""
        ))
    return items

@router.post("/history", response_model=ChatHistoryResponse)
async def save_user_history(
    req: SaveChatHistoryRequest,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    """Persist conversation session in chat history if user privacy toggle allows."""
    if user.save_chat_history is False:
        # Privacy toggle active: do not write to persistent database
        return ChatHistoryResponse(
            id="ephemeral",
            title=req.title,
            messages=req.messages,
            created_at=datetime.now(timezone.utc).isoformat()
        )

    serialized = json.dumps([m.model_dump() for m in req.messages])
    history_entry = ChatHistory(
        user_id=user.id,
        title=req.title,
        messages_json=serialized
    )
    db.add(history_entry)
    await db.commit()
    await db.refresh(history_entry)

    return ChatHistoryResponse(
        id=history_entry.id,
        title=history_entry.title,
        messages=req.messages,
        created_at=history_entry.created_at.isoformat() if history_entry.created_at else ""
    )

@router.delete("/history/{history_id}")
async def delete_chat_history_item(
    history_id: str,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific chat conversation. Cached papers and vault documents remain untouched."""
    stmt = delete(ChatHistory).where(ChatHistory.id == history_id, ChatHistory.user_id == user.id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "Conversation removed. Paper vault caches preserved."}

@router.delete("/history")
async def clear_all_chat_history(
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    """Clear all chat history for the user. Paper vault caches remain untouched."""
    stmt = delete(ChatHistory).where(ChatHistory.user_id == user.id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "All conversations cleared. Paper vault caches preserved."}

@router.get("/saved-searches")
async def get_saved_searches(db: AsyncSession = Depends(get_db)):
    """Retrieve recent unique cached queries from Tier 1 Discovery Cache for 1-click replay."""
    stmt = select(DiscoveryCache).order_by(desc(DiscoveryCache.created_at)).limit(30)
    result = await db.execute(stmt)
    caches = result.scalars().all()

    seen_topics = set()
    unique_items = []
    for c in caches:
        clean_topic = c.topic.lower().strip()
        if clean_topic not in seen_topics:
            seen_topics.add(clean_topic)
            unique_items.append({
                "query_hash": c.query_hash,
                "topic": c.topic,
                "total_count": c.total_count,
                "created_at": c.created_at.isoformat() if c.created_at else "",
                "access_count": c.access_count
            })
            if len(unique_items) >= 12:
                break

    return unique_items

@router.delete("/saved-searches/{query_hash}")
async def delete_saved_search_item(
    query_hash: str,
    db: AsyncSession = Depends(get_db)
):
    """Remove search query from recent history suggestions. Cached papers remain in vault."""
    stmt = delete(DiscoveryCache).where(DiscoveryCache.query_hash == query_hash)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "Review suggestion removed from history."}
