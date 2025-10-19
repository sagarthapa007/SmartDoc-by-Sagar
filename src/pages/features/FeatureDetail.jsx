import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart3,
  Brain,
  FileText,
  Layers,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const FEATURE_INDEX = {
  analyzer: {
    title: "Data Analyzer",
    route: "/analyze",
    icon: BarChart3,
    overview:
      "Explore your dataset with instant KPIs, correlations, distributions, and narrative insights. Built for speed and clarity.",
    bullets: [
      "Smart header detection & quality scoring",
      "Heatmaps, histograms, and top performers",
      "Executive summaries and export options",
    ],
    tips: [
      "Upload CSV/XLSX with headers for best results.",
      "Use filters to narrow down segments before exporting.",
    ],
  },
  generator: {
    title: "Document Generator",
    route: "/upload",
    icon: FileText,
    overview:
      "Turn each row in your spreadsheet into a personalized document with placeholders and conditional logic.",
    bullets: ["PDF/Word export", "Bulk creation", "Email delivery (soon)"],
    tips: ["Use {{placeholders}} in your templates.", "Preview before bulk runs."],
  },
  ai: {
    title: "AI Assistant",
    route: "/analyze",
    icon: Brain,
    overview:
      "Ask plain-English questions about your data and get summaries, validations, and recommendations.",
    bullets: ["NLP queries", "Anomaly detection", "Readable narratives"],
    tips: ["Try 'show top 10 customers by revenue' to get started."],
  },
  workflows: {
    title: "Workflow Automation",
    route: "/reports",
    icon: Layers,
    overview:
      "Automate routine tasks via a simple builder: import → generate → email → archive, on schedule.",
    bullets: ["Visual builder (coming soon)", "Schedulers", "Routing rules"],
    tips: ["Start with a simple weekly schedule to test email delivery."],
  },
};

export default function FeatureDetail() {
  const { id } = useParams();
  const feat = FEATURE_INDEX[id];

  const Icon = useMemo(() => feat?.icon ?? BarChart3, [feat]);

  if (!feat) {
    return (
      <div className="section max-w-4xl mx-auto p-4">
        <div className="card p-6">
          <div className="text-lg font-semibold mb-2">Feature not found</div>
          <p className="text-sm text-[var(--text-secondary)]">
            The feature you’re looking for doesn’t exist. Go back and try again.
          </p>
          <div className="mt-4">
            <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="btn btn-ghost inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Home
        </Link>
        <Link to={feat.route} className="btn btn-primary inline-flex items-center gap-2">
          Try {feat.title} <ArrowRight size={16} />
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--brand1)]/10 text-[var(--brand1)]">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{feat.title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{feat.overview}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="card p-4">
            <div className="font-semibold mb-2">What you can do</div>
            <ul className="space-y-2">
              {feat.bullets.map((b, i) => (
                <li key={i} className="text-sm">• {b}</li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <div className="font-semibold mb-2">Quick tips</div>
            <ul className="space-y-2">
              {feat.tips.map((t, i) => (
                <li key={i} className="text-sm">• {t}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Placeholder for future screenshots/illustrations */}
        <div className="mt-6 p-6 rounded-xl border text-center text-sm text-[var(--text-secondary)]"
             style={{ borderColor: "var(--border)" }}>
          Add an illustration or short GIF here (workflow / UI preview).
        </div>
      </div>
    </div>
  );
}
