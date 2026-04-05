"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/sync/token").then((r) => r.json()).then((d) => setSyncToken(d.token));
  }, []);

  async function generateToken() {
    setTokenLoading(true);
    const res = await fetch("/api/sync/token", { method: "POST" });
    const data = await res.json();
    setSyncToken(data.token);
    setTokenLoading(false);
  }

  function copyCommand() {
    const cmd = `curl -sL ${window.location.origin}/sync.py | python3 - ${syncToken}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(
      (f) => f.name.endsWith(".jsonl") || f.name.endsWith(".zip")
    );
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setStatus(null);
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (data.error) {
      setStatus({ type: "error", msg: data.error });
    } else {
      setStatus({ type: "success", msg: `Imported ${data.imported.toLocaleString()} API calls.` });
      setFiles([]);
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  }

  async function handleClear() {
    if (!confirm("This will delete all your imported data. Continue?")) return;
    await fetch("/api/clear", { method: "POST" });
    setStatus({ type: "success", msg: "All data cleared." });
  }

  return (
    <div className="max-w-[720px] mx-auto px-7 py-12 relative z-10">
      <h1 className="text-2xl font-bold mb-1.5 tracking-tight">Link Your Claude Data</h1>
      <p className="text-[0.88rem] text-text-secondary mb-8">
        Connect your machine to automatically sync your Claude Code usage.
      </p>

      {/* === SYNC COMMAND (Primary) === */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold mb-1">Sync from Terminal</h2>
            <p className="text-[0.78rem] text-text-tertiary">
              Run this command on any machine with Claude Code installed. It reads your local session data and syncs it here.
            </p>
          </div>
        </div>

        {syncToken ? (
          <>
            <div className="bg-bg-deep rounded-lg p-4 font-mono text-[0.72rem] text-emerald-400 leading-relaxed break-all select-all">
              curl -sL {typeof window !== "undefined" ? window.location.origin : ""}/sync.py | python3 - {syncToken}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={copyCommand}
                className="text-[0.75rem] font-medium px-4 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 transition-all"
              >
                {copied ? "Copied!" : "Copy Command"}
              </button>
              <button
                onClick={generateToken}
                disabled={tokenLoading}
                className="text-[0.72rem] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Regenerate token
              </button>
            </div>
            <div className="mt-4 text-[0.7rem] text-text-tertiary leading-relaxed">
              <strong className="text-text-secondary">Works on:</strong> macOS, Linux, Windows (WSL/PowerShell with Python).
              Re-run anytime to sync latest data. Set up a cron job for automatic syncing.
            </div>
          </>
        ) : (
          <button
            onClick={generateToken}
            disabled={tokenLoading}
            className="w-full py-3 text-[0.88rem] font-semibold rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 text-white cursor-pointer transition-all hover:shadow-[0_0_16px_rgba(52,211,153,0.25)] hover:-translate-y-0.5 disabled:opacity-50"
          >
            {tokenLoading ? "Generating..." : "Generate Sync Command"}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-[0.7rem] text-text-tertiary uppercase tracking-wider">or upload manually</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      {/* === FILE UPLOAD (Secondary) === */}
      <div
        className={`bg-bg-surface border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
          dragOver ? "border-violet-500 bg-violet-500/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-border-dim"
        }`}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto mb-3 stroke-violet-400 fill-none" strokeWidth={1.5}>
          <path d="M24 6v28M14 16l10-10 10 10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 32v6a4 4 0 01-4 4H12a4 4 0 01-4-4v-6" strokeLinecap="round" />
        </svg>
        <div className="text-[0.9rem] font-semibold mb-1">Drop .jsonl or .zip files</div>
        <div className="text-[0.75rem] text-text-tertiary">
          From ~/.claude/projects/ (macOS/Linux) or C:\Users\you\.claude\projects\ (Windows)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jsonl,.zip"
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2 bg-bg-elevated rounded-md font-mono text-[0.72rem]">
              <span className="text-text-secondary">{f.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary">{(f.size / 1024).toFixed(1)} KB</span>
                <button className="text-rose-400 hover:text-rose-300" onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, j) => j !== i)); }}>x</button>
              </div>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 text-[0.88rem] font-semibold rounded-lg bg-gradient-to-br from-violet-600 to-violet-500 text-white cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-0.5 disabled:opacity-50 mt-4"
          >
            {uploading ? "Uploading..." : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {status && (
        <div className={`mt-3 font-mono text-[0.72rem] px-4 py-2.5 rounded-lg ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}>
          {status.msg}
        </div>
      )}

      {/* Clear data */}
      <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
        <p className="text-[0.78rem] text-text-tertiary">Clear all imported data and start fresh.</p>
        <button
          onClick={handleClear}
          className="font-mono text-[0.7rem] font-medium px-4 py-1.5 bg-rose-400/10 border border-rose-400/20 rounded-md text-rose-400 hover:bg-rose-400/15 hover:border-rose-400/40 transition-all"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}
