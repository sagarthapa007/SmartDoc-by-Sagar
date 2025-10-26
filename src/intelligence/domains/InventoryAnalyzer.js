export const InventoryAnalyzer = {
  analyzeDomain(data, context) {
    const rows = Array.isArray(data) ? data : data?.rows || [];
    const productKey =
      context.entities.product ||
      ["SKU", "Product", "Item", "sku", "product"].find(
        (k) => rows[0] && k in rows[0],
      );
    const qtyKey =
      context.metrics?.find((m) => /qty|quantity|units|stock/i.test(m)) ||
      "quantity";
    const byProduct = {};
    rows.forEach((r) => {
      const p = r[productKey] || "Unknown";
      const q = parseFloat(r[qtyKey]) || 0;
      byProduct[p] = (byProduct[p] || 0) + q;
    });
    const ranking = Object.entries(byProduct)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
    return {
      metrics: { primary: qtyKey },
      insights: { summary: `Inventory detected.` },
      visuals: { ranking },
    };
  },
};
