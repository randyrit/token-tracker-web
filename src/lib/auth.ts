import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: number;
  username?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "default-dev-secret-change-me-in-prod-32chars!",
  cookieName: "token-tracker-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }
  return session;
}
