import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Brain,
  FileText,
  Zap,
  Layers,
  FileSpreadsheet,
  Mail,
  Shield,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import FeatureModal from "@components/ui/FeatureModal.jsx";

const FEATURES = [
  {
    id: "analyzer",
    title: "Data Analyzer",
    desc: "Upload any dataset and get instant insights, charts, and summaries.",
    route: "/analyze",
    icon: BarChart3,
    bullets: ["Instant KPIs & trends", "Correlation heatmaps", "Export-ready visuals"],
  },
  {
    id: "generator",
    title: "Document Generator",
    desc: "Turn Excel rows into thousands of personalized PDFs/Word docs.",
    route: "/upload",
    icon: FileText,
    bullets: ["Smart placeholders", "Bulk creation", "PDF/Word export"],
  },
  {
    id: "ai",
    title: "AI Assistant",
    desc: "Ask questions in plain English; get summaries, fixes, and insights.",
    route: "/analyze",
    icon: Brain,
    bullets: ["Natural language Q&A", "Auto summaries", "Error detection tips"],
  },
  {
    id: "workflows",
    title: "Workflow Automation",
    desc: "Chain tasks: import → generate → email → archive, on schedule.",
    route: "/reports",
    icon: Layers,
    bullets: ["Visual builder (soon)", "Schedulers", "Email routing"],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--background)] text-[var(--text)]">
      {/* Hero */}
      <section className="section pt-10 pb-8">
        <div className="max-w-6xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 border border-[var(--brand1)]/30 bg-[var(--brand1)]/10 text-[var(--brand1)]">
            <Shield size={14} /> Free to start • No credit card
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Automate Documents & <span className="text-gradient">Analyze Data</span> —
            all in one place.
          </h1>

          <p className="mt-3 text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Upload Excel/CSV, map placeholders, generate thousands of docs, and get
            instant insights. Created as a hobby, inspired by Kiran Paudel, Produced by Sagar ( Personal Project).
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/upload" className="btn btn-primary flex items-center gap-2">
              Upload file to experience <ArrowRight size={16} />
            </Link>
            <Link to="/demo" className="btn btn-secondary flex items-center gap-2">
              <PlayCircle size={16} /> Watch demo
            </Link>
            <Link to="/pricing" className="btn btn-ghost">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="section py-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
          {[
            { value: "500K+", label: "Docs Generated", icon: FileSpreadsheet },
            { value: "99.8%", label: "Accuracy Rate", icon: Shield },
            { value: "10K+", label: "Active Users", icon: Mail },
            { value: "<30s", label: "Avg Processing", icon: Zap },
          ].map((k, i) => (
            <div key={i} className="card flex items-center gap-3 p-4">
              <k.icon className="w-6 h-6 text-[var(--brand1)]" />
              <div>
                <div className="font-semibold">{k.value}</div>
                <div className="text-sm text-[var(--text-secondary)]">{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="section pb-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Explore features</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="card text-left p-4 border hover:shadow-lg transition group"
                aria-label={`Open ${f.title} details`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand1)]/10 text-[var(--brand1)]">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="opacity-0 group-hover:opacity-100 transition" size={16} />
                </div>
                <h3 className="text-lg font-semibold mt-3">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{f.desc}</p>
                <ul className="mt-3 space-y-1">
                  {f.bullets.map((b, idx) => (
                    <li key={idx} className="text-xs text-[var(--text-tertiary)]">• {b}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Secondary strip */}
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {[
              {
                icon: Mail,
                title: "Auto Email",
                desc: "Send generated docs to recipients with one click.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "Role-based access & audit logs (coming soon).",
              },
              {
                icon: FileSpreadsheet,
                title: "Industry Templates",
                desc: "Prebuilt kits for retail, healthcare, education.",
              },
            ].map((x, i) => (
              <div key={i} className="card p-4 flex items-start gap-3">
                <x.icon className="w-5 h-5 text-[var(--brand1)] mt-1" />
                <div>
                  <div className="font-semibold">{x.title}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{x.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA strip */}
      <section className="section pb-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Start free — upgrade anytime</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Free tier for individuals; pro & enterprise when you grow.
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/pricing" className="btn btn-outline">View pricing (Free For KIRAN PAUDEL)</Link>
              <Link to="/upload" className="btn btn-primary flex items-center gap-2">
                Upload file <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      <FeatureModal
        isOpen={!!selected}
        feature={selected}
        onClose={() => setSelected(null)}
        onTry={() => {
          if (selected?.route) navigate(selected.route);
        }}
        onLearn={() => selected && navigate(`/features/${selected.id}`)}
      />
    </div>
  );
}