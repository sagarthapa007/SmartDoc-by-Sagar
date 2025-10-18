/**
 * 🎨 DomainVisualRegistry — Phase G2
 * Maps each domain to a set of charts and descriptions.
 * Unknown domains fall back to "generic".
 */
export const DOMAIN_VISUALS = {
  finance: {
    charts: ["RevenueTrendChart", "TopPerformersChart"],
    title: "Financial Overview",
    description: "Revenue trends and top entities based on primary metric."
  },
  hr: {
    charts: ["TopPerformersChart"],
    title: "Human Resources",
    description: "Department totals or compensation distribution via ranking."
  },
  inventory: {
    charts: ["TopPerformersChart"],
    title: "Inventory Analytics",
    description: "Product quantities and movement patterns."
  },
  health: {
    charts: ["RevenueTrendChart"],
    title: "Health & Fitness",
    description: "Progress metrics tracked over time."
  },
  academic: {
    charts: ["TopPerformersChart"],
    title: "Academic Performance",
    description: "Subject/course averages and rankings."
  },
  generic: {
    charts: ["Heatmap", "Histogram"],
    title: "Generic Insights",
    description: "Correlation and distribution patterns across dataset."
  }
};
