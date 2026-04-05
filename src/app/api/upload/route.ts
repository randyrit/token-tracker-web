import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonlContent } from "@/lib/parse";
import JSZip from "jszip";

export async function POST(request: Request) {
  const session = await requireAuth();
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files." }, { status: 400 });
  }

  let total = 0;

  for (const file of files) {
    const name = file.name;

    if (name.endsWith(".zip")) {
      const buf = await file.arrayBuffer();
      let zip: JSZip;
      try {
        zip = await JSZip.loadAsync(buf);
      } catch {
        continue;
      }
      const entries = Object.entries(zip.files).filter(
        ([n]) => n.endsWith(".jsonl") && !zip.files[n].dir
      );
      for (const [entryName, entry] of entries) {
        const content = await entry.async("string");
        const sid = entryName.split("/").pop()?.replace(".jsonl", "") || "";
        const parts = entryName.replace(/\\/g, "/").split("/");
        const project = parts.length > 1 ? parts[0] : "default";
        const isAgent = sid.startsWith("agent-");
        const calls = parseJsonlContent(content);
        if (calls.length) {
          await prisma.apiCall.createMany({
            data: calls.map((c) => ({
              userId: session.userId!,
              model: c.model,
              inputTokens: c.inputTokens,
              outputTokens: c.outputTokens,
              cacheCreateTokens: c.cacheCreateTokens,
              cacheReadTokens: c.cacheReadTokens,
              cost: c.cost,
              timestamp: c.timestamp,
              sessionId: sid,
              project,
              isAgent,
            })),
          });
          total += calls.length;
        }
      }
    } else if (name.endsWith(".jsonl")) {
      const content = await file.text();
      const sid = name.replace(".jsonl", "");
      const isAgent = sid.startsWith("agent-");
      const calls = parseJsonlContent(content);
      if (calls.length) {
        await prisma.apiCall.createMany({
          data: calls.map((c) => ({
            userId: session.userId!,
            model: c.model,
            inputTokens: c.inputTokens,
            outputTokens: c.outputTokens,
            cacheCreateTokens: c.cacheCreateTokens,
            cacheReadTokens: c.cacheReadTokens,
            cost: c.cost,
            timestamp: c.timestamp,
            sessionId: sid,
            project: "default",
            isAgent,
          })),
        });
        total += calls.length;
      }
    }
  }

  return NextResponse.json({ ok: true, imported: total });
}
