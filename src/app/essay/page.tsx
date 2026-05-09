import Image from "next/image";
import essayImage from "@/assets/images/essay.png";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `随笔 | My Blog`,
    description: "这是我的随笔页面",
  };
}

export default function EssaysPage() {
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
          "bg-[size:48px_48px]",
        ].join(" ")}
      >
        <div
          className={[
            "absolute left-25 top-[-3.75rem] z-20 flex h-12 w-12 items-center",
            "rounded-md object-cover",
          ].join(" ")}
        >
          <Image
            src={essayImage}
            alt="随笔封面"
            className="h-12 w-12 rounded-md object-cover"
          />
          <span className="ml-4 text-lg font-semibold">Sara</span>
        </div>

        <section
          className={[
            "relative z-10 mx-auto max-w-[1250px] rounded-xl bg-[var(--card-bg)] px-10 py-4",
            "shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
          ].join(" ")}
        >
          <article className="border-b border-dashed border-gray-200 pb-10">
            <div className="flex items-start gap-4">
              <Image
                src={essayImage}
                alt="用户头像"
                className="h-12 w-12 rounded-md object-cover"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Sara</h2>
                  <span className="rounded bg-red-500 px-1.5 py-0.5 text-xs text-[var(--card-bg)]">
                    LV6
                  </span>
                  <span className="rounded border border-green-400 px-2 py-0.5 text-xs text-green-600">
                    太乙玄仙
                  </span>
                </div>

                <p className="mt-4 text-lg text-[var(--text-title)]">
                  最后还是要学会，慢慢把喜欢的事情做成长期项目。
                </p>

                <Image
                  src={essayImage}
                  alt="随笔插图"
                  className="mt-5 w-full max-w-[430px] rounded-md object-cover"
                />

                <div className="mt-8 flex items-center justify-between text-sm text-gray-500">
                  <span>2026-01-08</span>

                  <div className="flex items-center gap-4 rounded bg-gray-50 px-4 py-2">
                    <span>1</span>
                    <span>点赞</span>
                    <span>收藏</span>
                    <span>分享</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
