"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between px-7 py-3.5 border-b border-border-subtle sticky top-0 bg-bg-deep/85 backdrop-blur-xl z-50">
      <div className="flex items-center gap-3">
        <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-violet-700 to-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
          </svg>
        </div>
        <span className="font-bold text-base tracking-tight">
          Token Tracker <span className="font-normal text-text-tertiary text-sm ml-1">Web</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className={`text-[0.78rem] font-medium px-3.5 py-1.5 rounded-md transition-all ${
            pathname === "/dashboard"
              ? "text-violet-400 bg-violet-500/10"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/upload"
          className={`text-[0.78rem] font-medium px-3.5 py-1.5 rounded-md transition-all ${
            pathname === "/upload"
              ? "text-violet-400 bg-violet-500/10"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          Upload
        </Link>
        <div className="flex items-center gap-2 font-mono text-[0.7rem] text-text-tertiary">
          <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-[0.65rem] font-semibold text-white">
            {username?.[0]?.toUpperCase() || "?"}
          </div>
          {username}
        </div>
        <button
          onClick={handleLogout}
          className="text-[0.78rem] font-medium text-text-tertiary px-3.5 py-1.5 rounded-md hover:text-text-primary hover:bg-bg-elevated transition-all"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
