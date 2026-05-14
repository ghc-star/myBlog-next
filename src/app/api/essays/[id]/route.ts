import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deleteEssay, getEssayById } from "@/lib/essay";

function parseEssayId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = parseEssayId(idParam);

  if (!id) {
    return NextResponse.json({ message: "Invalid essay id" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const essay = await getEssayById(id, user?.id);

  if (!essay) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ essay });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = parseEssayId(idParam);

  if (!id) {
    return NextResponse.json({ message: "Invalid essay id" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ok = await deleteEssay(id, user.id);
  if (!ok) {
    return NextResponse.json(
      { message: "无权删除该随笔" },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
