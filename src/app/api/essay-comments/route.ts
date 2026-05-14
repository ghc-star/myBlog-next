import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  createEssayComment,
  getEssayById,
  listEssayComments,
} from "@/lib/essay";

const MAX_COMMENT = 500;

export async function GET(request: NextRequest) {
  const essayIdParam = request.nextUrl.searchParams.get("essayId");
  const essayId = Number(essayIdParam);

  if (!Number.isInteger(essayId) || essayId <= 0) {
    return NextResponse.json(
      { message: "Invalid essayId" },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const comments = await listEssayComments(essayId);

  return NextResponse.json({
    comments,
    isLoggedIn: Boolean(user),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const essayId = Number(body?.essayId);
  const content = String(body?.content ?? "").trim();

  if (!Number.isInteger(essayId) || essayId <= 0) {
    return NextResponse.json(
      { message: "Invalid essayId" },
      { status: 400 },
    );
  }

  if (!content) {
    return NextResponse.json(
      { message: "评论内容不能为空" },
      { status: 400 },
    );
  }

  if (content.length > MAX_COMMENT) {
    return NextResponse.json(
      { message: `评论内容不能超过 ${MAX_COMMENT} 字` },
      { status: 400 },
    );
  }

  const essay = await getEssayById(essayId);
  if (!essay) {
    return NextResponse.json(
      { message: "随笔不存在" },
      { status: 404 },
    );
  }

  await createEssayComment({
    essayId,
    userId: user.id,
    content,
  });

  const comments = await listEssayComments(essayId);
  return NextResponse.json({ comments });
}
