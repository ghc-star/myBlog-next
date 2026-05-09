import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();

  let visitorKey = cookieStore.get("visitor_key")?.value;
  if (!visitorKey) {
    visitorKey = crypto.randomUUID();
  }

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `
        INSERT IGNORE INTO article_views (article_id, visitor_key, viewed_date)
        VALUES (?, ?, CURDATE())
        `,
        [id, visitorKey],
      );
      const insertResult = result as { affectedRows: number };
      if (insertResult.affectedRows > 0) {
        await conn.execute(
          ` 
          UPDATE articles SET visits=visits+1 WHERE id=?
          `,
          [id],
        );
        revalidatePath("/");
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    const response = NextResponse.json({ success: true });
    if (!cookieStore.get("visitor_key")) {
      response.cookies.set("visitor_key", visitorKey, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("record article view failed:", error);
    return NextResponse.json(
      { success: false, message: "failed to record view" },
      { status: 500 },
    );
  }
}
