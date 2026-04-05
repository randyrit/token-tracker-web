import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
  }

  const tokens: GoogleTokenResponse = await tokenRes.json();

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/login?error=user_info", request.url));
  }

  const googleUser: GoogleUserInfo = await userRes.json();

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

  if (!user) {
    // Create new user — use Google name as username, ensure uniqueness
    let username = googleUser.name.replace(/\s+/g, "").toLowerCase().slice(0, 20);
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      username = `${username}${Date.now().toString(36).slice(-4)}`;
    }

    user = await prisma.user.create({
      data: {
        username,
        email: googleUser.email,
        passwordHash: "", // Google SSO users have no password
      },
    });
  }

  // Set session
  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
