"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import {
  createFriend,
  deleteFriend,
  getFriendById,
  updateFriend,
  type FriendInput,
} from "@/lib/friends";

export interface FriendFormState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function parseFields(formData: FormData): FriendInput & {
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const avatarRaw = String(formData.get("avatarUrl") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "0").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!name) fieldErrors.name = "站名必填";
  if (name.length > 64) fieldErrors.name = "站名最长 64 字符";
  if (description.length > 255)
    fieldErrors.description = "简介最长 255 字符";
  if (!url) fieldErrors.url = "链接必填";
  else {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) {
        fieldErrors.url = "链接必须以 http(s) 开头";
      }
    } catch {
      fieldErrors.url = "链接格式不合法";
    }
  }
  if (avatarRaw) {
    try {
      const u = new URL(avatarRaw);
      if (!/^https?:$/.test(u.protocol)) {
        fieldErrors.avatarUrl = "头像链接必须以 http(s) 开头";
      }
    } catch {
      fieldErrors.avatarUrl = "头像链接格式不合法";
    }
  }

  const sortOrder = Number.isFinite(Number(sortOrderRaw))
    ? Math.trunc(Number(sortOrderRaw))
    : 0;

  if (status !== "active" && status !== "pending" && status !== "hidden") {
    fieldErrors.status = "状态值不合法";
  }

  return {
    name,
    description,
    url,
    avatarUrl: avatarRaw || null,
    sortOrder,
    status: status as "active" | "pending" | "hidden",
    fieldErrors,
  };
}

function revalidateFriendsPaths() {
  revalidatePath("/friends");
  revalidatePath("/admin/friends");
}

export async function createFriendAction(
  _prev: FriendFormState,
  formData: FormData,
): Promise<FriendFormState> {
  await requireAdmin();
  const { fieldErrors, ...input } = parseFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, message: "请检查字段" };
  }

  await createFriend(input);
  revalidateFriendsPaths();
  redirect("/admin/friends");
}

export async function updateFriendAction(
  id: number,
  _prev: FriendFormState,
  formData: FormData,
): Promise<FriendFormState> {
  await requireAdmin();
  const existing = await getFriendById(id);
  if (!existing) return { ok: false, message: "友链不存在" };

  const { fieldErrors, ...input } = parseFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, message: "请检查字段" };
  }

  await updateFriend(id, input);
  revalidateFriendsPaths();
  return { ok: true, message: "已保存" };
}

export async function deleteFriendAction(formData: FormData) {
  await requireAdmin();
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) return;
  await deleteFriend(id);
  revalidateFriendsPaths();
}
