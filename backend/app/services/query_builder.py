from typing import Any, Dict, List

from app.services.registry import REGISTRY


def run_explore_query(dataset_id: str, query: Dict[str, Any]) -> Dict[str, Any]:
    ds = REGISTRY.get(dataset_id)
    if not ds:
        raise ValueError("dataset not found")
    headers = ds.get("headers", [])
    rows: List[dict] = ds.get("rows", [])
    q = query or {}
    filters = q.get("filters", [])
    group_by = q.get("group_by")
    aggregate = q.get("aggregate") or {}
    sort = q.get("sort") or {}
    limit = q.get("limit") or 100

    def match(r):
        for f in filters:
            col = f.get("column")
            op = f.get("operator")
            val = f.get("value")
            rv = r.get(col)
            if op == ">":
                try:
                    if float(rv) <= float(val):
                        return False
                except Exception:
                    return False
            elif op == "<":
                try:
                    if float(rv) >= float(val):
                        return False
                except Exception:
                    return False
            elif op == "between":
                lo, hi = val
                if not (str(lo) <= str(rv) <= str(hi)):
                    return False
            elif op == "eq" or op is None:
                if str(rv) != str(val):
                    return False
        return True

    filtered = [r for r in rows if match(r)]

    results = filtered
    sql_equiv = "SELECT * FROM data"
    if group_by and aggregate:
        # naive group + sum/avg only
        op_col, op = next(iter(aggregate.items()))
        buckets = {}
        for r in filtered:
            key = r.get(group_by)
            try:
                v = float(r.get(op_col))
            except Exception:
                v = 0.0
            buckets.setdefault(key, []).append(v)
        agg_rows = []
        for k, vals in buckets.items():
            if op.lower() == "sum":
                agg_rows.append({group_by: k, f"{op_col}_sum": sum(vals)})
            elif op.lower() == "avg":
                avg = (sum(vals) / len(vals)) if vals else 0
                agg_rows.append({group_by: k, f"{op_col}_avg": avg})
        results = agg_rows
        sql_equiv = f"SELECT {group_by}, {op.upper()}({op_col}) FROM data GROUP BY {group_by}"

    # sort
    if sort:
        col, direction = next(iter(sort.items()))
        results = sorted(results, key=lambda r: r.get(col), reverse=(direction.lower() == "desc"))
    # limit
    results = results[:limit]
    return {"results": results, "total_matched": len(filtered), "sql_equivalent": sql_equiv}
