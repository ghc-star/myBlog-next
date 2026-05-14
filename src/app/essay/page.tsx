import Image from "next/image";
import type { Metadata } from "next";

import essayImage from "@/assets/images/essay.png";
import { getCurrentUser } from "@/lib/auth";
import { ESSAY_PAGE_LIMIT, listEssays } from "@/lib/essay";

import EssayFeedClient from "./EssayFeedClient";
import type { CurrentEssayUser } from "./types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `随笔 | My Blog`,
    description: "这是我的随笔页面",
  };
}

export default async function EssaysPage() {
  const user = await getCurrentUser();
  const { essays, nextCursor } = await listEssays({
    limit: ESSAY_PAGE_LIMIT,
    viewerId: user?.id,
  });

  const currentUser: CurrentEssayUser = user
    ? {
        id: user.id,
        author: user.github_login,
        avatarUrl: user.avatar_url,
        profileUrl: user.profile_url,
      }
    : null;

  return (
    <>
      <header
        className={[
          "relative h-[35vh] w-full",
          "bg-cover bg-center bg-no-repeat",
        ].join(" ")}
        style={{ backgroundImage: `url(${essayImage.src})` }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </header>

      <main
        className={[
          "relative -mt-10 min-h-screen overflow-visible px-4 pb-12 sm:px-6 md:px-10 lg:px-16",
          "bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px)]",
          "bg-size-[48px_48px]",
        ].join(" ")}
      >
        <div
          className={[
            "absolute left-25 -top-15 z-20 flex h-12 w-12 items-center",
            "rounded-md object-cover",
          ].join(" ")}
        >
          <Image
            src={essayImage}
            alt="随笔封面"
            className="h-12 w-12 rounded-md object-cover"
          />
          <span className="ml-4 text-lg font-semibold text-white">
            {currentUser?.author ?? "Sara"}
          </span>
        </div>

        <section
          className={[
            "relative z-10 mx-auto max-w-[1250px] rounded-xl bg-(--card-bg) px-10 py-4",
            "shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
          ].join(" ")}
        >
          <EssayFeedClient
            initialEssays={essays}
            initialNextCursor={nextCursor}
            isLoggedIn={Boolean(user)}
            currentUser={currentUser}
          />
        </section>
      </main>
    </>
  );
}
