import Link from "next/link";
import { articles } from "@/data/articles";

function getYear(date: string) {
  return new Date(date).getFullYear();
}

function getMonth(date: string) {
  return new Date(date).getMonth() + 1;
}

function getDayText(date: string) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${month}-${day}`;
}

export default function ArchivePage() {
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const archiveMap = sortedArticles.reduce(
    (map, article) => {
      const year = getYear(article.date);
      const month = getMonth(article.date);

      if (!map[year]) {
        map[year] = {};
      }

      if (!map[year][month]) {
        map[year][month] = [];
      }

      map[year][month].push(article);
      return map;
    },
    {} as Record<number, Record<number, typeof articles>>,
  );

  const years = Object.keys(archiveMap)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-md border border-[var(--border-normal)] bg-[var(--card-bg)] px-6 py-8 shadow-sm sm:px-8">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[var(--text-title)]">
            文章归档
          </h1>
          <p className="text-sm text-[var(--text-sub)]">
            共 {articles.length} 篇文章
          </p>
        </header>

        <div className="space-y-0">
          {years.map((year) => {
            const months = Object.keys(archiveMap[year])
              .map(Number)
              .sort((a, b) => b - a);

            return (
              <section
                key={year}
                className="border-l border-[var(--border-normal)] pl-6"
              >
                <div className="relative mb-1">
                  <span className="absolute top-1/2 -left-[27px] h-1 w-1 -translate-y-1/2 rounded-full bg-[var(--list-round)]" />

                  <h2 className="px-1 text-2xl font-bold text-[var(--text-title)]">
                    {year}
                  </h2>
                </div>

                <div className="space-y-0">
                  {months.map((month) => (
                    <div key={month}>
                      <ul className="space-y-0">
                        {archiveMap[year][month].map((article) => (
                          <li key={article.id} className="group relative">
                            <span className="absolute top-1/2 -left-[27px] h-1 w-1 -translate-y-1/2 rounded-full bg-[var(--list-round)]" />

                            <Link
                              href={`/article/${article.id}`}
                              className="flex items-center gap-3 rounded-2xl px-1 py-3 transition hover:bg-[var(--card-bg-soft)]"
                            >
                              <span className="text-xs text-[var(--text-sub)]">
                                {getDayText(article.date)}
                              </span>
                              <div>
                                <h4 className="text-xs font-medium text-[var(--text-title)] transition group-hover:text-[var(--theme-accent)]">
                                  {article.title}
                                </h4>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
