"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function UploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
        Upload your Claude Code session files to see your usage dashboard.
      </p>

      {/* Upload form */}
      <div
        className={`bg-bg-surface border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
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
        <svg viewBox="0 0 48 48" className="w-12 h-12 mx-auto mb-4 stroke-violet-400 fill-none" strokeWidth={1.5}>
          <path d="M24 6v28M14 16l10-10 10 10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 32v6a4 4 0 01-4 4H12a4 4 0 01-4-4v-6" strokeLinecap="round" />
        </svg>
        <div className="text-base font-semibold mb-1.5">Drop session files here</div>
        <div className="text-[0.8rem] text-text-tertiary mb-4">
          .jsonl files or a .zip of your ~/.claude/projects/ folder
        </div>
        <span className="inline-block text-[0.78rem] font-semibold px-5 py-2 rounded-md bg-bg-elevated border border-border-dim text-violet-300 hover:border-violet-500 transition-all">
          Browse Files
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jsonl,.zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2 bg-bg-elevated rounded-md font-mono text-[0.72rem]">
              <span className="text-text-secondary">{f.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary">{(f.size / 1024).toFixed(1)} KB</span>
                <button
                  className="text-rose-400 hover:text-rose-300"
                  onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, j) => j !== i)); }}
                >
                  x
                </button>
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

      {/* Status */}
      {status && (
        <div
          className={`mt-3 font-mono text-[0.72rem] px-4 py-2.5 rounded-lg ${
            status.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"
          }`}
        >
          {status.msg}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 mt-6">
        <h3 className="text-[0.82rem] font-semibold text-text-secondary mb-3">Where to find your session files</h3>
        <ol className="list-decimal pl-5 text-[0.78rem] text-text-tertiary space-y-1.5 leading-relaxed">
          <li><strong>macOS / Linux:</strong> <code className="font-mono text-[0.72rem] bg-bg-deep px-2 py-0.5 rounded text-violet-300">~/.claude/projects/</code></li>
          <li><strong>Windows:</strong> <code className="font-mono text-[0.72rem] bg-bg-deep px-2 py-0.5 rounded text-violet-300">C:\Users\&lt;you&gt;\.claude\projects\</code></li>
          <li>Zip the entire <code className="font-mono text-[0.72rem] bg-bg-deep px-2 py-0.5 rounded text-violet-300">projects</code> folder and upload the .zip</li>
          <li>Or select individual <code className="font-mono text-[0.72rem] bg-bg-deep px-2 py-0.5 rounded text-violet-300">.jsonl</code> session files</li>
        </ol>
      </div>

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
