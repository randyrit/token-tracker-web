import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CallPayload {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_create_tokens: number;
  cache_read_tokens: number;
  cost: number;
  timestamp: string;
  session_id: string;
  project: string;
  is_agent: boolean;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const user = await prisma.user.findUnique({ where: { syncToken: token } });
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();
  const calls: CallPayload[] = body.calls;

  if (!Array.isArray(calls) || !calls.length) {
    return NextResponse.json({ error: "No calls in payload" }, { status: 400 });
  }

  // Clear old data and re-import
  await prisma.apiCall.deleteMany({ where: { userId: user.id } });

  await prisma.apiCall.createMany({
    data: calls.map((c) => ({
      userId: user.id,
      model: c.model,
      inputTokens: c.input_tokens,
      outputTokens: c.output_tokens,
      cacheCreateTokens: c.cache_create_tokens,
      cacheReadTokens: c.cache_read_tokens,
      cost: c.cost,
      timestamp: c.timestamp,
      sessionId: c.session_id,
      project: c.project,
      isAgent: c.is_agent,
    })),
  });

  return NextResponse.json({ ok: true, imported: calls.length });
}
