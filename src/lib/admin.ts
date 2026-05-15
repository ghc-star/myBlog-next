import "server-only";
import { redirect } from "next/navigation";

import { getCurrentUser } from "./auth";

export async function requireAdmin(returnTo: string = "/admin") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
