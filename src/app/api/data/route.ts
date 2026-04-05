import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SessionAgg {
  model: string;
  project: string;
  first_ts: string;
  last_ts: string;
  calls: number;
  input: number;
  output: number;
  cache_create: number;
  cache_read: number;
  cost: number;
  is_agent: boolean;
}

export async function GET() {
  const session = await requireAuth();
  const uid = session.userId!;

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { dailyBudget: true } });
  const budget = user?.dailyBudget ?? 5.0;

  const rows = await prisma.apiCall.findMany({
    where: { userId: uid },
    orderBy: { timestamp: "asc" },
  });

  const sessions: Record<string, SessionAgg> = {};
  const daily: Record<string, { input: number; output: number; cache_create: number; cache_read: number; cost: number; calls: number }> = {};
  const modelTotals: Record<string, { input: number; output: number; cache_create: number; cache_read: number; cost: number; calls: number }> = {};

  let ti = 0, to = 0, tcc = 0, tcr = 0, tc = 0;

  for (const r of rows) {
    ti += r.inputTokens; to += r.outputTokens;
    tcc += r.cacheCreateTokens; tcr += r.cacheReadTokens;
    tc += r.cost;

    // Sessions
    const sid = r.sessionId;
    if (sid) {
      if (!sessions[sid]) {
        sessions[sid] = {
          model: r.model, project: r.project,
          first_ts: r.timestamp, last_ts: r.timestamp,
          calls: 0, input: 0, output: 0,
          cache_create: 0, cache_read: 0, cost: 0,
          is_agent: r.isAgent,
        };
      }
      const s = sessions[sid];
      s.calls++; s.input += r.inputTokens; s.output += r.outputTokens;
      s.cache_create += r.cacheCreateTokens; s.cache_read += r.cacheReadTokens;
      s.cost += r.cost; s.model = r.model;
      if (r.timestamp && r.timestamp < s.first_ts) s.first_ts = r.timestamp;
      if (r.timestamp && r.timestamp > s.last_ts) s.last_ts = r.timestamp;
    }

    // Daily
    const day = r.timestamp?.slice(0, 10);
    if (day) {
      if (!daily[day]) daily[day] = { input: 0, output: 0, cache_create: 0, cache_read: 0, cost: 0, calls: 0 };
      daily[day].input += r.inputTokens; daily[day].output += r.outputTokens;
      daily[day].cache_create += r.cacheCreateTokens; daily[day].cache_read += r.cacheReadTokens;
      daily[day].cost += r.cost; daily[day].calls++;
    }

    // Model totals
    const m = r.model;
    if (!modelTotals[m]) modelTotals[m] = { input: 0, output: 0, cache_create: 0, cache_read: 0, cost: 0, calls: 0 };
    modelTotals[m].input += r.inputTokens; modelTotals[m].output += r.outputTokens;
    modelTotals[m].cache_create += r.cacheCreateTokens; modelTotals[m].cache_read += r.cacheReadTokens;
    modelTotals[m].cost += r.cost; modelTotals[m].calls++;
  }

  const convos = Object.values(sessions).filter((s) => !s.is_agent);
  const subs = Object.values(sessions).filter((s) => s.is_agent);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter((r) => r.timestamp?.slice(0, 10) === todayStr);
  const tdCost = todayRows.reduce((a, r) => a + r.cost, 0);
  const tdInp = todayRows.reduce((a, r) => a + r.inputTokens, 0);
  const tdOut = todayRows.reduce((a, r) => a + r.outputTokens, 0);
  const tdCC = todayRows.reduce((a, r) => a + r.cacheCreateTokens, 0);
  const tdCR = todayRows.reduce((a, r) => a + r.cacheReadTokens, 0);

  const tdByModel: Record<string, { cost: number; tokens: number }> = {};
  for (const r of todayRows) {
    if (!tdByModel[r.model]) tdByModel[r.model] = { cost: 0, tokens: 0 };
    tdByModel[r.model].cost += r.cost;
    tdByModel[r.model].tokens += r.inputTokens + r.outputTokens + r.cacheCreateTokens + r.cacheReadTokens;
  }

  const rem = Math.max(0, budget - tdCost);
  const pct = budget > 0 ? Math.min(100, (tdCost / budget) * 100) : 0;

  const sortedDaily = Object.fromEntries(Object.entries(daily).sort());
  const sessionList = Object.values(sessions).sort((a, b) => (b.last_ts > a.last_ts ? 1 : -1)).slice(0, 200);

  return NextResponse.json({
    totals: {
      input: ti, output: to, cache_create: tcc, cache_read: tcr,
      cost: Math.round(tc * 10000) / 10000, api_calls: rows.length,
      sessions: Object.keys(sessions).length, conversations: convos.length, subagents: subs.length,
    },
    today: {
      cost: Math.round(tdCost * 10000) / 10000, tokens: tdInp + tdOut + tdCC + tdCR,
      input: tdInp, output: tdOut, cache_create: tdCC, cache_read: tdCR,
      calls: todayRows.length, budget,
      remaining: Math.round(rem * 10000) / 10000, pct_used: Math.round(pct * 100) / 100,
      by_model: tdByModel,
    },
    daily: sortedDaily,
    models: modelTotals,
    sessions: sessionList,
  });
}
