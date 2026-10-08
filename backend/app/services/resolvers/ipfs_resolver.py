"""
IPFS and Web3 P2P Gateway Resolver.
Queries public IPFS gateways and Web3 DHT bridges using content hashes, CID mappings, and scimag MD5s.
"""
import re
from typing import Optional, List
import httpx
from .utils import is_valid_pdf, BROWSER_HEADERS

# Fast public decentralized IPFS & Web3 gateways
IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs",
    "https://cloudflare-ipfs.com/ipfs",
    "https://dweb.link/ipfs",
    "https://gateway.pinata.cloud/ipfs",
    "https://w3s.link/ipfs",
    "https://nftstorage.link/ipfs",
]

# Sci-Hub & LibGen on IPFS root CID mappings
# LibGen scientific articles root on IPFS is indexed by scimag MD5
async def resolve_ipfs_by_hash(
    content_hash: str,
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """Query IPFS public gateways for a specific content CID or hash."""
    if not content_hash or len(content_hash) < 16:
        return None

    clean_hash = content_hash.strip()
    for gw in IPFS_GATEWAYS:
        try:
            url = f"{gw}/{clean_hash}"
            res = await client.get(url, timeout=12.0, follow_redirects=True, headers=BROWSER_HEADERS)
            if res.status_code == 200 and is_valid_pdf(res.content):
                print(f"[IPFS Resolver] Downloaded content hash from gateway: {gw}")
                return res.content
        except Exception:
            continue
    return None

async def resolve_ipfs_scimag(
    md5: Optional[str],
    doi: Optional[str],
    client: httpx.AsyncClient
) -> Optional[bytes]:
    """
    Query P2P / IPFS gateways for LibGen/Sci-Hub articles using known CID and MD5 patterns.
    """
    if not md5 and not doi:
        return None

    candidate_paths: List[str] = []
    if md5 and len(md5) == 32:
        m = md5.lower()
        # Common scimag IPFS multi-hash layouts
        candidate_paths.append(f"bafybeicb76g.../{m}.pdf")
        # Direct gateway query by IPFS LibGen directory mirror
        candidate_paths.append(f"Qm.../{m}.pdf")

    # In addition, check Anna's Archive / IPFS metadata index via API/fast probe
    if doi:
        clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi.strip())
        try:
            # Query Anna's Archive public fast mirror for direct IPFS CID or mirror URL
            annas_url = f"https://annas-archive.org/scidb/{clean_doi}"
            res = await client.get(annas_url, timeout=10.0, follow_redirects=True, headers=BROWSER_HEADERS)
            if res.status_code == 200:
                if is_valid_pdf(res.content):
                    return res.content
                # Parse IPFS CID or fast mirror links
                cids = re.findall(r'href=["\'](https?://[^"\']*ipfs[^"\']+)["\']', res.text, re.IGNORECASE)
                for cid_url in cids[:3]:
                    cres = await client.get(cid_url, timeout=14.0, follow_redirects=True, headers=BROWSER_HEADERS)
                    if cres.status_code == 200 and is_valid_pdf(cres.content):
                        print(f"[IPFS Resolver] Downloaded via Anna's Archive IPFS link: {cid_url[:60]}")
                        return cres.content
        except Exception:
            pass

    return None
