def narrate(result):
    lines = []
    s = result.get("summary", {})
    lines.append(f"Dataset has {s.get('rows',0)} rows and {s.get('columns',0)} columns.")
    corr = result.get("correlations", [])
    if corr:
        top = max(corr, key=lambda c: abs(c.get("r", 0)))
        lines.append(f"Strongest correlation: {top['a']} vs {top['b']} (r={top['r']:.2f}).")
    return lines
