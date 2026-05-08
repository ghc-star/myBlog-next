import Link from "next/link";
import { getCategorySummaries } from "@/data/articles";

function CategoryPanel() {
  const categories = getCategorySummaries().slice(0, 6);

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border-normal)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-title)]">分类</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="rounded-full px-3 py-1 text-xs font-medium text-white transition hover:opacity-85"
            style={{ backgroundColor: category.color }}
          >
            {category.name} · {category.count}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoryPanel;
