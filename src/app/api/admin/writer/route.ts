import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminUser } from "@/lib/admin";

import {
  continueWriting,
  draftArticle,
  generateArticleSummary,
  generateArticleTags,
  polishSelection,
} from "@/lib/ai/writer";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("summary"),
    title: z.string(),
    content: z.string().min(10),
  }),
  z.object({
    action: z.literal("tags"),
    title: z.string(),
    content: z.string().min(10),
  }),
  z.object({
    action: z.literal("polish"),
    selection: z.string().min(1),
    mode: z.enum(["rewrite", "shorten", "expand", "fix"]),
    contextHint: z.string().optional(),
  }),
  z.object({
    action: z.literal("continue"),
    before: z.string().min(1),
    approxLength: z.enum(["short", "medium", "long"]).optional(),
  }),
  z.object({
    action: z.literal("draft"),
    title: z.string().min(2),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    desc: z.string().optional(),
    approxLength: z.enum(["short", "medium", "long"]).optional(),
  }),
]);

async function getAllExistingTags(): Promise<string[]> {
  const [rows] = await db.query<RowDataPacket[]>(`SELECT tags FROM articles`);
  const set = new Set<string>();
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        for (const t of parsed) if (typeof t === "string") set.add(t);
      }
    } catch {}
  }
  return [...set];
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    // 把第一条 issue 拼成可读消息，方便前端 toast 直接展示
    const first = parsed.error.issues[0];
    const path = first?.path?.join(".") ?? "";
    const message = first
      ? `参数错误：${path ? `${path} ` : ""}${first.message}`
      : "参数错误";
    return NextResponse.json(
      { message, issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    if (data.action === "summary") {
      const result = await generateArticleSummary({
        title: data.title,
        content: data.content,
      });
      return NextResponse.json(result);
    }
    if (data.action === "tags") {
      const existing = await getAllExistingTags();
      const result = await generateArticleTags({
        title: data.title,
        content: data.content,
        existingTags: existing,
      });
      return NextResponse.json(result);
    }
    if (data.action === "polish") {
      const result = polishSelection({
        selection: data.selection,
        mode: data.mode,
        contextHint: data.contextHint,
      });
      return result.toTextStreamResponse();
    }

    if (data.action === "continue") {
      const result = continueWriting({
        before: data.before,
        approxLength: data.approxLength,
      });
      return result.toTextStreamResponse();
    }

    // draft
    const result = draftArticle({
      title: data.title,
      category: data.category,
      tags: data.tags,
      desc: data.desc,
      approxLength: data.approxLength,
    });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[writer] error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "AI 调用失败" },
      { status: 500 },
    );
  }
}
