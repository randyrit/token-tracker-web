"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
    router.push("/dashboard");
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
        <h1 className="text-center text-[1.4rem] font-bold mb-1 tracking-tight">Welcome back</h1>
        <p className="text-center text-[0.82rem] text-text-tertiary mb-7">Sign in to your Token Tracker account</p>

        {error && (
          <div className="text-[0.8rem] text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter password"
              className="w-full px-3.5 py-2.5 font-mono text-[0.82rem] bg-bg-deep border border-border-dim rounded-lg text-text-primary outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-text-tertiary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-[0.88rem] font-semibold border-none rounded-lg bg-gradient-to-br from-violet-600 to-violet-500 text-white cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-0.5 disabled:opacity-50 mt-1.5"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center mt-5 text-[0.8rem] text-text-tertiary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-violet-400 font-medium hover:text-violet-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
