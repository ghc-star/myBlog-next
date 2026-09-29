import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { toggleEssayLike } from "@/lib/essay";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const essayId = Number(body?.essayId);
  if (!Number.isInteger(essayId) || essayId <= 0) {
    return NextResponse.json(
      { message: "Invalid essayId" },
      { status: 400 },
    );
  }

  const summary = await toggleEssayLike(essayId, user.id);
  revalidateTag("essays", "max");
  return NextResponse.json({ ...summary, isLoggedIn: true });
}
