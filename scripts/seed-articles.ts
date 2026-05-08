import { config } from "dotenv";
import mysql from "mysql2/promise";

import { articles } from "../src/data/articleSeed";

config({ path: ".env.local" });
config();

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  for (const article of articles) {
    await db.execute(
      `
      INSERT INTO articles(
        id, title, \`desc\`, \`date\`, tags, category, category_slug,
        cover, content, color, published_at, updated_at, visits, comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
        \`desc\` = VALUES(\`desc\`),
        \`date\` = VALUES(\`date\`),
        tags = VALUES(tags),
        category = VALUES(category),
        category_slug = VALUES(category_slug),
        cover = VALUES(cover),
        content = VALUES(content),
        color = VALUES(color),
        published_at = VALUES(published_at),
        updated_at = VALUES(updated_at),
        visits = VALUES(visits),
        comments = VALUES(comments)
      `,
      [
        article.id,
        article.title,
        article.desc,
        article.date,
        JSON.stringify(article.tags),
        article.category,
        article.categorySlug,
        article.cover ?? null,
        article.content,
        article.color,
        article.publishedAt.slice(0, 19).replace("T", " "),
        article.updatedAt.slice(0, 19).replace("T", " "),
        article.visits,
        article.comments,
      ],
    );
  }
  await db.end();
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
