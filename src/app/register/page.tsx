"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/upload");
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-5 relative z-10">
      <div className="w-full max-w-[400px] bg-bg-surface border border-border-subtle rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-700 to-violet-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <svg viewBox="0 0 24 24" className="w-[26px] h-[26px] fill-white">
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
          </svg>
        </div>
        <h1 className="text-center text-[1.4rem] font-bold mb-1 tracking-tight">Create account</h1>
        <p className="text-center text-[0.82rem] text-text-tertiary mb-7">Start tracking your Claude token usage</p>

        {error && (
          <div className="text-[0.8rem] text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg bg-white text-[0.85rem] font-medium text-gray-700 hover:bg-gray-50 transition-all mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-[0.7rem] text-text-tertiary uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[0.7rem] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">Username</label>
            <input
              name="username"
              type="text"
              required
              placeholder="Choose a username"
              className="w-full px-3.5 py-2.5 font-mono text-[0.82rem] bg-bg-deep border border-border-dim rounded-lg text-text-primary outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-text-tertiary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[0.7rem] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 font-mono text-[0.82rem] bg-bg-deep border border-border-dim rounded-lg text-text-primary outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-text-tertiary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[0.7rem] font-medium uppercase tracking-wider text-text-tertiary mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 font-mono text-[0.82rem] bg-bg-deep border border-border-dim rounded-lg text-text-primary outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-text-tertiary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-[0.88rem] font-semibold border-none rounded-lg bg-gradient-to-br from-violet-600 to-violet-500 text-white cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-0.5 disabled:opacity-50 mt-1.5"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="text-center mt-5 text-[0.8rem] text-text-tertiary">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 font-medium hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
