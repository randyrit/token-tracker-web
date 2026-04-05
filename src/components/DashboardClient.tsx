"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtDate(iso: string) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function modelClass(m: string) {
  if (m.includes("opus")) return "opus";
  if (m.includes("sonnet")) return "sonnet";
  if (m.includes("haiku")) return "haiku";
  return "sonnet";
}

function modelLabel(m: string) {
  if (m.includes("opus")) return "Opus";
  if (m.includes("sonnet")) return "Sonnet";
  if (m.includes("haiku")) return "Haiku";
  return m;
}

const dotColor: Record<string, string> = {
  opus: "bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.4)]",
  sonnet: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]",
  haiku: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]",
};

const barColor: Record<string, string> = {
  opus: "from-violet-600 to-violet-400",
  sonnet: "from-amber-500 to-amber-400",
  haiku: "from-emerald-500 to-emerald-400",
};

const badgeColor: Record<string, string> = {
  opus: "bg-violet-500/12 text-violet-300",
  sonnet: "bg-amber-400/10 text-amber-400",
  haiku: "bg-emerald-400/10 text-emerald-400",
};

export default function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/data");
    setData(await res.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (data) renderChart();
    function handleResize() { if (data) renderChart(); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, range]);

  function renderChart() {
    const canvas = canvasRef.current;
    if (!canvas || !data?.daily) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const buckets: Record<string, any> = {};
    for (const [day, v] of Object.entries(data.daily) as [string, any][]) {
      let key = day;
      if (range === "weekly") {
        const d = new Date(day + "T00:00:00");
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        key = start.toISOString().slice(0, 10);
      }
      if (!buckets[key]) buckets[key] = { cost: 0, calls: 0 };
      buckets[key].cost += v.cost;
      buckets[key].calls += v.calls;
    }

    const labels = Object.keys(buckets).sort();
    if (!labels.length) {
      ctx.fillStyle = "#6b6280"; ctx.font = "13px Outfit, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("No data yet", W / 2, H / 2);
      return;
    }

    const costData = labels.map((k) => buckets[k].cost);
    const callsData = labels.map((k) => buckets[k].calls);
    const maxCost = Math.max(...costData, 0.01);
    const maxCalls = Math.max(...callsData, 1);
    const pT = 28, pB = 40, pL = 56, pR = 56;
    const cW = W - pL - pR, cH = H - pT - pB;

    function xPos(i: number) { return labels.length === 1 ? pL + cW / 2 : pL + (i / (labels.length - 1)) * cW; }
    function yCost(v: number) { return pT + cH - (v / maxCost) * cH; }
    function yCalls(v: number) { return pT + cH - (v / maxCalls) * cH; }

    // Grid
    ctx.strokeStyle = "rgba(139,92,246,0.06)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pT + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(W - pR, y); ctx.stroke();
      ctx.fillStyle = "#6b6280"; ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "right"; ctx.fillText("$" + (maxCost - (maxCost / 4) * i).toFixed(2), pL - 10, y + 3);
      ctx.textAlign = "left"; ctx.fillText(Math.round(maxCalls - (maxCalls / 4) * i).toLocaleString(), W - pR + 10, y + 3);
    }

    // Y labels
    ctx.save(); ctx.fillStyle = "#6b6280"; ctx.font = "9px JetBrains Mono"; ctx.textAlign = "center";
    ctx.translate(12, pT + cH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("COST ($)", 0, 0); ctx.restore();
    ctx.save(); ctx.fillStyle = "#6b6280"; ctx.font = "9px JetBrains Mono"; ctx.textAlign = "center";
    ctx.translate(W - 8, pT + cH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("CALLS", 0, 0); ctx.restore();

    if (labels.length === 1) {
      const barW = 40, x = xPos(0), h = (costData[0] / maxCost) * cH;
      ctx.fillStyle = "rgba(139,92,246,0.5)"; ctx.beginPath();
      ctx.roundRect(x - barW / 2, pT + cH - h, barW, h, [4, 4, 0, 0]); ctx.fill();
    } else {
      // Cost area
      ctx.beginPath(); ctx.moveTo(xPos(0), yCost(costData[0]));
      for (let i = 1; i < labels.length; i++) {
        const cx = (xPos(i - 1) + xPos(i)) / 2;
        ctx.bezierCurveTo(cx, yCost(costData[i - 1]), cx, yCost(costData[i]), xPos(i), yCost(costData[i]));
      }
      ctx.lineTo(xPos(labels.length - 1), pT + cH); ctx.lineTo(xPos(0), pT + cH); ctx.closePath();
      const grad = ctx.createLinearGradient(0, pT, 0, pT + cH);
      grad.addColorStop(0, "rgba(139,92,246,0.15)"); grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath(); ctx.moveTo(xPos(0), yCost(costData[0]));
      for (let i = 1; i < labels.length; i++) {
        const cx = (xPos(i - 1) + xPos(i)) / 2;
        ctx.bezierCurveTo(cx, yCost(costData[i - 1]), cx, yCost(costData[i]), xPos(i), yCost(costData[i]));
      }
      ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2; ctx.stroke();

      // Calls line
      ctx.beginPath(); ctx.moveTo(xPos(0), yCalls(callsData[0]));
      for (let i = 1; i < labels.length; i++) {
        const cx = (xPos(i - 1) + xPos(i)) / 2;
        ctx.bezierCurveTo(cx, yCalls(callsData[i - 1]), cx, yCalls(callsData[i]), xPos(i), yCalls(callsData[i]));
      }
      ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();

      costData.forEach((v, i) => {
        ctx.beginPath(); ctx.arc(xPos(i), yCost(v), 3, 0, Math.PI * 2);
        ctx.fillStyle = "#a78bfa"; ctx.fill();
      });
    }

    // X labels
    ctx.fillStyle = "#6b6280"; ctx.font = "10px JetBrains Mono, monospace"; ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(labels.length / 10));
    for (let i = 0; i < labels.length; i += step) {
      const d = new Date(labels[i] + "T00:00:00");
      ctx.fillText(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), xPos(i), H - 8);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-border-dim border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const t = data.totals;
  const td = data.today;
  const pct = td.pct_used;
  const tier = pct >= 90 ? "danger" : pct >= 65 ? "warn" : "good";
  const tierColor = { good: "text-emerald-400", warn: "text-amber-400", danger: "text-rose-400" }[tier];
  const gaugeColor = { good: "from-emerald-500 to-emerald-400", warn: "from-amber-500 to-amber-400", danger: "from-rose-400 to-rose-300" }[tier];
  const convos = t.conversations || 0;
  const agents = t.subagents || 0;
  const allTokens = t.input + t.output + t.cache_create + t.cache_read;
  const avgCost = convos > 0 ? t.cost / convos : 0;
  const avgCalls = convos > 0 ? Math.round(t.api_calls / convos) : 0;

  const modelEntries = Object.entries(data.models as Record<string, any>)
    .filter(([k]) => k !== "<synthetic>")
    .sort((a, b) => {
      const ta = a[1].input + a[1].output + a[1].cache_create + a[1].cache_read;
      const tb = b[1].input + b[1].output + b[1].cache_create + b[1].cache_read;
      return tb - ta;
    });
  const maxTok = modelEntries.length
    ? Math.max(...modelEntries.map(([, v]) => v.input + v.output + v.cache_create + v.cache_read))
    : 0;

  const todayModels = Object.entries(td.by_model || {}).filter(([k]) => k !== "<synthetic>");

  if (t.api_calls === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-7 py-12 relative z-10">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-12 text-center">
          <h2 className="text-xl font-bold mb-2">No data yet</h2>
          <p className="text-text-tertiary mb-4">Upload your Claude session files to get started.</p>
          <Link href="/upload" className="inline-block px-6 py-2.5 rounded-lg bg-gradient-to-br from-violet-600 to-violet-500 text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all">
            Upload Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-7 py-8 relative z-10">
      {/* Budget bar */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 mb-5 animate-in hover:border-border-accent hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all">
        <div className="flex items-end justify-between mb-3.5">
          <div>
            <div className="text-[0.7rem] font-medium uppercase tracking-wider text-text-tertiary mb-1">Remaining Today</div>
            <div className={`font-mono text-3xl font-bold tracking-tight leading-none ${tierColor}`}>
              ${td.remaining.toFixed(2)}<span className="text-xs font-normal text-text-tertiary ml-1">left</span>
            </div>
          </div>
          <div className="flex gap-5">
            {[
              ["Spent Today", `$${td.cost.toFixed(2)} / $${td.budget.toFixed(2)}`],
              ["Today's Tokens", fmt(td.tokens)],
              ["API Calls Today", td.calls.toLocaleString()],
            ].map(([label, val]) => (
              <div key={label} className="text-right">
                <div className="text-[0.62rem] uppercase tracking-wider text-text-tertiary mb-0.5">{label}</div>
                <div className="font-mono text-[0.85rem] font-semibold text-text-secondary">{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-2 bg-bg-deep rounded overflow-hidden">
          <div className={`h-full rounded bg-gradient-to-r ${gaugeColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
        {todayModels.length > 0 && (
          <div className="flex gap-4 mt-2.5 font-mono text-[0.63rem] text-text-tertiary">
            {todayModels.map(([m, v]: any) => (
              <span key={m} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor[modelClass(m)]}`} />
                {modelLabel(m)}: ${v.cost.toFixed(2)} &middot; {fmt(v.tokens)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4 mb-7 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
        {[
          { label: "Total Tokens", value: fmt(allTokens), unit: "tokens", sub: <><span className="text-cyan-400">IN {fmt(t.input)}</span> <span className="text-violet-400">OUT {fmt(t.output)}</span> <span className="text-emerald-400">CACHE {fmt(t.cache_create + t.cache_read)}</span></> },
          { label: "Estimated Cost", value: "$" + t.cost.toFixed(2), sub: `avg $${avgCost.toFixed(2)}/conversation` },
          { label: "API Calls", value: t.api_calls.toLocaleString(), unit: "calls", sub: `avg ${avgCalls}/conversation` },
          { label: "Sessions", value: String(convos), unit: "conversations", sub: agents > 0 ? `+ ${agents} subagent sessions` : "" },
        ].map((card, i) => (
          <div key={i} className="bg-bg-surface border border-border-subtle rounded-xl p-5 hover:border-border-accent hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="text-[0.7rem] font-medium uppercase tracking-wider text-text-tertiary mb-2.5">{card.label}</div>
            <div className="font-mono text-[1.7rem] font-semibold tracking-tight leading-none">
              {card.value}{card.unit && <span className="text-[0.7rem] font-normal text-text-tertiary ml-1">{card.unit}</span>}
            </div>
            <div className="font-mono text-[0.68rem] text-text-tertiary mt-2 flex gap-2.5 flex-wrap">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Models */}
      <div className="grid grid-cols-[1fr_360px] gap-4 mb-7 max-[1100px]:grid-cols-1">
        <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <span className="text-[0.82rem] font-semibold">Usage Over Time</span>
            <div className="flex bg-bg-deep rounded-md p-0.5 gap-0.5">
              {(["daily", "weekly"] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`font-mono text-[0.65rem] font-medium px-3 py-1 rounded transition-all ${range === r ? "bg-violet-700 text-white shadow-[0_0_12px_rgba(139,92,246,0.2)]" : "text-text-tertiary hover:text-text-secondary"}`}>
                  {r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            <div className="relative h-[280px]">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <span className="text-[0.82rem] font-semibold">Model Breakdown</span>
          </div>
          <div className="p-5 flex flex-col gap-5">
            {modelEntries.map(([model, v]: any) => {
              const cls = modelClass(model);
              const tot = v.input + v.output + v.cache_create + v.cache_read;
              const pctBar = maxTok > 0 ? (tot / maxTok) * 100 : 0;
              return (
                <div key={model}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[0.8rem] font-semibold">
                      <span className={`w-2 h-2 rounded-full ${dotColor[cls]}`} />
                      {modelLabel(model)}
                    </div>
                    <span className="font-mono text-[0.72rem] text-text-secondary">{fmt(tot)} tokens</span>
                  </div>
                  <div className="h-1.5 bg-bg-deep rounded-sm overflow-hidden">
                    <div className={`h-full rounded-sm bg-gradient-to-r ${barColor[cls]} transition-all duration-700`} style={{ width: `${pctBar}%` }} />
                  </div>
                  <div className="font-mono text-[0.63rem] text-text-tertiary mt-1.5 flex gap-2.5 flex-wrap">
                    <span>{v.calls.toLocaleString()} calls</span>
                    <span>${v.cost.toFixed(2)}</span>
                    <span>IN {fmt(v.input)}</span>
                    <span>OUT {fmt(v.output)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sessions table */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden animate-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <span className="text-[0.82rem] font-semibold">Sessions</span>
          <span className="font-mono text-[0.72rem] text-text-tertiary">{data.sessions.length} sessions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.78rem]">
            <thead>
              <tr>
                {["Date", "Type", "Model", "Calls", "Input", "Output", "Cache Write", "Cache Read", "Total", "Cost"].map((h) => (
                  <th key={h} className="font-mono text-[0.63rem] font-medium uppercase tracking-wider text-text-tertiary text-left px-3.5 py-3 border-b border-border-subtle whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((s: any, i: number) => {
                const total = s.input + s.output + s.cache_create + s.cache_read;
                const cls = modelClass(s.model);
                return (
                  <tr key={i} className={`border-b border-violet-500/5 hover:bg-bg-hover transition-colors ${s.is_agent ? "opacity-60 hover:opacity-85" : ""}`}>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem] text-text-tertiary whitespace-nowrap">{fmtDate(s.last_ts)}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`inline-flex text-[0.62rem] font-medium px-1.5 py-0.5 rounded font-mono ${s.is_agent ? "bg-amber-400/10 text-amber-400" : "bg-violet-500/10 text-violet-300"}`}>
                        {s.is_agent ? "subagent" : "conversation"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5"><span className={`inline-flex items-center gap-1 text-[0.7rem] font-medium px-2.5 py-0.5 rounded ${badgeColor[cls]}`}>{modelLabel(s.model)}</span></td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem]">{s.calls}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem]">{fmt(s.input)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem]">{fmt(s.output)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem]">{fmt(s.cache_create)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem]">{fmt(s.cache_read)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem] text-text-primary font-medium">{fmt(total)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[0.73rem] text-text-primary font-medium">${s.cost.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
