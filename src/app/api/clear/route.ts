import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await requireAuth();
  await prisma.apiCall.deleteMany({ where: { userId: session.userId! } });
  return NextResponse.json({ ok: true });
}
