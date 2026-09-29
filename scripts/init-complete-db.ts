/**
 * 一键初始化博客数据库：
 *   1. 重建 myblog 库（先 DROP 再 CREATE，会清空数据）
 *   2. 按 complete-schema.sql 建表
 *   3. 给应用账号授权
 *
 * 用法：npm run db:init
 * 需要能连上 MySQL 管理员账号，默认 root / root，可用环境变量覆盖：
 *   DB_ADMIN_USER / DB_ADMIN_PASSWORD
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

import type { RowDataPacket } from "mysql2/promise";

config({ path: ".env" });
config();

const dbName = process.env.DB_NAME || "myblog";
const appUser = process.env.DB_USER || "dianping";
const adminUser = process.env.DB_ADMIN_USER || "root";
const adminPassword = process.env.DB_ADMIN_PASSWORD ?? "root";

async function main() {
  console.log(`正在以 ${adminUser} 连接 MySQL...`);
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: adminUser,
    password: adminPassword,
  });
  console.log("✅ 已连接 MySQL");

  console.log(`\n正在重建数据库 ${dbName} ...`);
  await conn.query(`DROP DATABASE IF EXISTS ${dbName}`);
  await conn.query(
    `CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.query(`USE ${dbName}`);
  console.log("✓ 数据库已创建");

  const schema = fs.readFileSync(
    path.join(process.cwd(), "scripts", "complete-schema.sql"),
    "utf-8",
  );

  // 逐条执行 CREATE TABLE（schema 里除建表语句外只有注释和 USE/GRANT）
  const statements = schema
    .split(";")
    .map((stmt) =>
      stmt
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((stmt) => stmt.toUpperCase().startsWith("CREATE TABLE"));

  console.log(`\n正在创建 ${statements.length} 张表...`);
  for (const stmt of statements) {
    const name = /CREATE TABLE IF NOT EXISTS (\w+)/i.exec(stmt)?.[1] ?? "?";
    await conn.query(stmt);
    console.log(`✓ ${name}`);
  }

  console.log(`\n正在给 ${appUser} 授权...`);
  await conn.query(
    `GRANT ALL PRIVILEGES ON ${dbName}.* TO ?@'localhost'`,
    [appUser],
  );
  await conn.query("FLUSH PRIVILEGES");
  console.log("✓ 授权完成");

  const [tables] = await conn.query<RowDataPacket[]>(
    `SELECT TABLE_NAME FROM information_schema.tables
     WHERE table_schema = ? ORDER BY TABLE_NAME`,
    [dbName],
  );
  console.log(`\n🎉 完成，共 ${tables.length} 张表：`);
  console.log(`  ${tables.map((t) => t.TABLE_NAME).join(", ")}`);

  await conn.end();
}

main().catch((err) => {
  console.error("\n❌ 失败:", err instanceof Error ? err.message : err);
  process.exit(1);
});
