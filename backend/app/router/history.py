import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "history.json"
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
if not DATA_FILE.exists():
    DATA_FILE.write_text(json.dumps({"items": []}, ensure_ascii=False, indent=2), encoding="utf-8")


class HistoryItem(BaseModel):
    title: str | None = None
    filename: str | None = None
    summary: str | None = None
    when: str | None = None


@router.get("")
def list_history():
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        return data
    except Exception as e:
        raise HTTPException(500, f"Failed to read history: {e}")


@router.post("")
def add_history(item: HistoryItem):
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        items = data.get("items", [])
        if not item.when:
            item.when = datetime.utcnow().isoformat(timespec="seconds") + "Z"
        items.insert(0, item.dict())
        data["items"] = items[:200]  # cap
        DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(500, f"Failed to write history: {e}")
