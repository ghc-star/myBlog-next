"use client";

import { useState } from "react";

type PolishMode = "rewrite" | "shorten" | "expand" | "fix";
type ContinueLen = "short" | "medium" | "long";
type DraftLen = "short" | "medium" | "long";

/** 优先解 JSON 取 message；否则退回 text；都没有就给 HTTP 状态 */
async function readErrorMessage(res: Response): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const data = (await res.json()) as { message?: string };
      if (data?.message) return data.message;
    }
    const text = await res.text();
    if (text) return text;
  } catch {
    // ignore
  }
  return `HTTP ${res.status}`;
}

export function useWriterAi() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postJson<T>(body: unknown): Promise<T> {
    const res = await fetch("/api/admin/writer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  }

  async function streamPlain(
    body: unknown,
    onDelta: (full: string) => void,
  ): Promise<string> {
    const res = await fetch("/api/admin/writer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      throw new Error(await readErrorMessage(res));
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      onDelta(full);
    }
    return full;
  }

  async function safe<T>(
    label: string,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    try {
      setPending(label);
      setError(null);
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setPending(null);
    }
  }

  return {
    pending,
    error,
    clearError: () => setError(null),

    genSummary(title: string, content: string) {
      return safe("summary", () =>
        postJson<{ desc: string }>({ action: "summary", title, content }),
      );
    },

    genTags(title: string, content: string) {
      return safe("tags", () =>
        postJson<{ tags: string[] }>({ action: "tags", title, content }),
      );
    },

    polish(
      selection: string,
      mode: PolishMode,
      onDelta: (full: string) => void,
    ) {
      return safe(`polish:${mode}`, () =>
        streamPlain({ action: "polish", selection, mode }, onDelta),
      );
    },

    continueAt(
      before: string,
      approxLength: ContinueLen,
      onDelta: (full: string) => void,
    ) {
      return safe(`continue:${approxLength}`, () =>
        streamPlain({ action: "continue", before, approxLength }, onDelta),
      );
    },

    draftAt(
      input: {
        title: string;
        category?: string;
        tags?: string[];
        desc?: string;
        approxLength: DraftLen;
      },
      onDelta: (full: string) => void,
    ) {
      return safe(`draft:${input.approxLength}`, () =>
        streamPlain({ action: "draft", ...input }, onDelta),
      );
    },
  };
}