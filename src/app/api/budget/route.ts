import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await requireAuth();
  const { budget } = await request.json();
  await prisma.user.update({
    where: { id: session.userId! },
    data: { dailyBudget: Number(budget) || 5.0 },
  });
  return NextResponse.json({ ok: true });
}
