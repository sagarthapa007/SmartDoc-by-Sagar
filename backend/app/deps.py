from typing import Optional

from fastapi import Header


async def get_request_id(x_request_id: Optional[str] = Header(default=None)):
    return x_request_id or "no-request-id"
