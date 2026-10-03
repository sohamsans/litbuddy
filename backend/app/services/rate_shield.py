import asyncio
import functools
import random
from typing import Callable, Any
import httpx

async def polite_delay(min_ms: int = 250, max_ms: int = 400):
    """Introduce a jittered polite delay to prevent bursting academic APIs."""
    delay = random.uniform(min_ms / 1000.0, max_ms / 1000.0)
    await asyncio.sleep(delay)

def rate_limit_shield(max_retries: int = 3, base_delay: float = 1.5):
    """
    Decorator that intercepts HTTP 429 (Too Many Requests) or network timeouts,
    respects 'Retry-After' header if present, and applies exponential backoff.
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            delay = base_delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429:
                        # Inspect Retry-After header
                        retry_after = e.response.headers.get("Retry-After")
                        wait_time = float(retry_after) if retry_after and retry_after.isdigit() else delay
                        print(f"[RateLimitShield] 429 encountered in {func.__name__}. Backing off for {wait_time:.1f}s (Attempt {attempt+1}/{max_retries})")
                        await asyncio.sleep(wait_time)
                        delay *= 2.0
                        last_exception = e
                    else:
                        raise e
                except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.NetworkError) as e:
                    print(f"[RateLimitShield] Network error in {func.__name__}: {e}. Retrying in {delay:.1f}s...")
                    await asyncio.sleep(delay)
                    delay *= 1.8
                    last_exception = e

            print(f"[RateLimitShield] Max retries exceeded for {func.__name__}.")
            raise last_exception or Exception(f"Failed after {max_retries} retries in {func.__name__}")
        return wrapper
    return decorator
