import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { getIndexStats } from "@/lib/ai/admin-index";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const stats = await getIndexStats();
  return NextResponse.json(stats);
}
