
from typing import List, Dict, Any
from app.services.registry import REGISTRY
import statistics

class ActionExecutor:
    def deduplicate(self, dataset_id: str, key_columns: List[str], strategy: str, dry_run: bool = True):
        ds = REGISTRY.get(dataset_id)
        if not ds: raise ValueError("dataset not found")
        rows = ds.get("rows", [])
        keys = key_columns or ["email"]
        seen = set()
        keep, remove, affected = [], [], []
        for r in rows:
            key = tuple((r.get(k) or "").strip().lower() for k in keys)
            if key in seen:
                remove.append(r)
            else:
                keep.append(r); seen.add(key); affected.append(r)
        preview = {
            "will_remove": len(remove),
            "will_keep": len(keep),
            "affected_records": affected[:50],
            "execute_url": "/api/actions/deduplicate?confirm=true"
        }
        if not dry_run:
            ds["rows"] = keep
        return preview

    def fill_missing(self, dataset_id: str, strategy: str = "median"):
        ds = REGISTRY.get(dataset_id)
        if not ds: raise ValueError("dataset not found")
        headers = ds.get("headers", [])
        rows = ds.get("rows", [])
        # very naive: if numeric -> median, else -> 'N/A'
        for h in headers:
            col = [self._to_float(r.get(h)) for r in rows]
            numeric = [v for v in col if v is not None]
            if numeric:
                med = statistics.median(numeric)
                for r in rows:
                    if r.get(h) in (None, "", "NaN"):
                        r[h] = med
            else:
                for r in rows:
                    if r.get(h) in (None, "", "NaN"):
                        r[h] = "N/A"
        return {"status": "ok", "message": "Missing values filled"}

    def remove_outliers(self, dataset_id: str, column: str, z: float = 3.0):
        ds = REGISTRY.get(dataset_id)
        if not ds: raise ValueError("dataset not found")
        rows = ds.get("rows", [])
        vals = [self._to_float(r.get(column)) for r in rows]
        vals = [v for v in vals if v is not None]
        if not vals: return {"removed": 0}
        mean = statistics.mean(vals)
        stdev = statistics.pstdev(vals) or 1.0
        def is_outlier(v):
            return abs(v - mean) / stdev > z
        kept, removed = [], 0
        for r in rows:
            v = self._to_float(r.get(column))
            if v is not None and is_outlier(v):
                removed += 1
                continue
            kept.append(r)
        ds["rows"] = kept
        return {"removed": removed, "kept": len(kept)}

    def export_segment(self, dataset_id: str, filters: Dict[str, Any] = None):
        ds = REGISTRY.get(dataset_id)
        if not ds: raise ValueError("dataset not found")
        rows = ds.get("rows", [])
        headers = ds.get("headers", [])
        filters = filters or {}
        def ok(r):
            for k, v in filters.items():
                if str(r.get(k)) != str(v):
                    return False
            return True
        result = [r for r in rows if ok(r)]
        return {"rows": result, "count": len(result), "headers": headers}

    def _to_float(self, v):
        try:
            return float(v)
        except Exception:
            return None
