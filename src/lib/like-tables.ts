import "server-only";
import type { RowDataPacket } from "mysql2";

import { db } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var __likeTablesReady: Promise<void> | undefined;
}

type ColumnRow = RowDataPacket & { COLUMN_NAME: string };
type IndexRow = RowDataPacket & { INDEX_NAME: string };

/**
 * 点赞/评论相关表经历过一轮"IP 匿名 → 登录用户"的改版，代码按 user_id、
 * comments.status、article_reactions.reaction 读写，但老库没有这些列，
 * 导致 /api/comments、点赞、表情接口引用不存在的列而 500。
 * 这里做幂等迁移：缺列补列、缺索引补索引（多次运行无副作用）。
 * 同时 scripts/complete-schema.sql 已同步更新，新库不会缺。
 */
async function bootstrap() {
  await ensureUserIdColumn(
    "article_likes",
    "idx_article_user",
    "(article_id, user_id)",
  );
  await ensureUserIdColumn(
    "comment_likes",
    "idx_comment_user",
    "(comment_id, user_id)",
  );
  await ensureUserIdColumn(
    "article_reactions",
    "idx_reaction_user",
    "(article_id, user_id)",
  );

  // comments：登录用户评论 + 软删除（老数据全是匿名，user_id 置空，默认视为已发布）。
  // nickname/email 是匿名时代的遗留列；新评论的作者来自 users 表 JOIN，
  // nickname 必须放开 NOT NULL（无默认值），否则评论 POST 在严格模式下必失败。
  const [commentCols] = await db.query<ColumnRow[]>(
    `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'comments'`,
  );
  const commentColByName = new Map(commentCols.map((c) => [c.COLUMN_NAME, c]));
  if (!commentColByName.has("user_id")) {
    await db.query(`ALTER TABLE \`comments\` ADD COLUMN user_id INT UNSIGNED NULL`);
  }
  if (!commentColByName.has("status")) {
    await db.query(
      `ALTER TABLE \`comments\` ADD COLUMN status ENUM('published','deleted') NOT NULL DEFAULT 'published'`,
    );
  }
  const nicknameCol = commentColByName.get("nickname");
  if (nicknameCol && nicknameCol.IS_NULLABLE === "NO" && !nicknameCol.COLUMN_DEFAULT) {
    await db.query(
      `ALTER TABLE \`comments\` MODIFY COLUMN nickname VARCHAR(100) NULL DEFAULT ''`,
    );
  }

  // article_reactions：代码按 reaction 列读写（GitHub 风格反应类型），
  // 老列叫 reaction_type 且是窄 ENUM，改名并放宽成 VARCHAR，旧值原样保留
  const [reactionCols] = await db.query<ColumnRow[]>(
    `SELECT COLUMN_NAME FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'article_reactions'`,
  );
  const reactionColNames = new Set(reactionCols.map((c) => c.COLUMN_NAME));
  if (!reactionColNames.has("reaction") && reactionColNames.has("reaction_type")) {
    await db.query(
      `ALTER TABLE \`article_reactions\` CHANGE COLUMN reaction_type reaction VARCHAR(32) NULL DEFAULT 'like'`,
    );
  }
}

async function ensureUserIdColumn(
  table: string,
  indexName: string,
  indexColumns: string,
) {
  const [cols] = await db.query<ColumnRow[]>(
    `SELECT COLUMN_NAME FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  );
  const hasUserId = cols.some((c) => c.COLUMN_NAME === "user_id");
  if (!hasUserId) {
    await db.query(
      `ALTER TABLE \`${table}\` ADD COLUMN user_id INT UNSIGNED NULL`,
    );
  }

  const [indexes] = await db.query<IndexRow[]>(
    `SELECT INDEX_NAME FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  );
  const hasIndex = indexes.some((i) => i.INDEX_NAME === indexName);
  if (!hasIndex) {
    await db.query(
      `ALTER TABLE \`${table}\` ADD INDEX ${indexName} ${indexColumns}`,
    );
  }
}

export function ensureLikeTableSchema(): Promise<void> {
  if (!global.__likeTablesReady) {
    global.__likeTablesReady = bootstrap().catch((error) => {
      global.__likeTablesReady = undefined;
      throw error;
    });
  }
  return global.__likeTablesReady;
}
