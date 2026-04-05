#!/usr/bin/env python3
"""Token Tracker Sync — Reads local Claude Code sessions and pushes to your dashboard."""

import json
import os
import glob
import sys
import urllib.request

CLAUDE_DIR = os.path.expanduser("~/.claude/projects")

PRICING = {
    "claude-opus-4-6":           {"input": 15.00, "output": 75.00, "cache_create": 18.75, "cache_read": 1.50},
    "claude-sonnet-4-6":         {"input":  3.00, "output": 15.00, "cache_create":  3.75, "cache_read": 0.30},
    "claude-haiku-4-5-20251001": {"input":  0.80, "output":  4.00, "cache_create":  1.00, "cache_read": 0.08},
}


def get_pricing(model):
    if model in PRICING:
        return PRICING[model]
    if "opus" in model:
        return PRICING["claude-opus-4-6"]
    if "sonnet" in model:
        return PRICING["claude-sonnet-4-6"]
    if "haiku" in model:
        return PRICING["claude-haiku-4-5-20251001"]
    return {"input": 3.0, "output": 15.0, "cache_create": 3.75, "cache_read": 0.30}


def parse_sessions():
    if not os.path.isdir(CLAUDE_DIR):
        print(f"  Error: {CLAUDE_DIR} not found.")
        sys.exit(1)

    jsonl_files = glob.glob(os.path.join(CLAUDE_DIR, "**", "*.jsonl"), recursive=True)
    print(f"  Found {len(jsonl_files)} session files")

    calls = []
    for fpath in jsonl_files:
        session_id = os.path.basename(fpath).replace(".jsonl", "")
        is_agent = session_id.startswith("agent-")
        rel = os.path.relpath(fpath, CLAUDE_DIR)
        project = rel.split(os.sep)[0] if os.sep in rel else "default"

        with open(fpath, "r", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    d = json.loads(line)
                except (json.JSONDecodeError, ValueError):
                    continue
                if d.get("type") != "assistant":
                    continue
                msg = d.get("message", {})
                usage = msg.get("usage", {})
                model = msg.get("model", "")
                ts = d.get("timestamp", "")
                if not usage or not model or model == "<synthetic>":
                    continue

                inp = usage.get("input_tokens", 0)
                out = usage.get("output_tokens", 0)
                cc = usage.get("cache_creation_input_tokens", 0)
                cr = usage.get("cache_read_input_tokens", 0)
                p = get_pricing(model)
                cost = (
                    (inp / 1e6) * p["input"]
                    + (out / 1e6) * p["output"]
                    + (cc / 1e6) * p["cache_create"]
                    + (cr / 1e6) * p["cache_read"]
                )

                calls.append({
                    "model": model,
                    "input_tokens": inp,
                    "output_tokens": out,
                    "cache_create_tokens": cc,
                    "cache_read_tokens": cr,
                    "cost": cost,
                    "timestamp": ts,
                    "session_id": session_id,
                    "project": project,
                    "is_agent": is_agent,
                })

    return calls


def main():
    if len(sys.argv) < 2:
        print("\n  Token Tracker Sync")
        print("  Usage: python3 sync.py YOUR_SYNC_TOKEN")
        print("  Get your token at: https://token-tracker-web.vercel.app/upload\n")
        sys.exit(1)

    token = sys.argv[1]
    server = sys.argv[2] if len(sys.argv) > 2 else "https://token-tracker-web.vercel.app"

    print("\n  Token Tracker Sync")
    print(f"  Reading from {CLAUDE_DIR} ...")

    calls = parse_sessions()
    print(f"  Parsed {len(calls):,} API calls")

    if not calls:
        print("  No data to sync.")
        sys.exit(0)

    print(f"  Pushing to {server} ...")
    payload = json.dumps({"calls": calls}).encode()
    req = urllib.request.Request(
        f"{server}/api/sync",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"  Synced {result.get('imported', 0):,} calls successfully!")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  Error {e.code}: {body}")
        sys.exit(1)

    print("  Done.\n")


if __name__ == "__main__":
    main()
