import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var __friendsReady: Promise<void> | undefined;
}

async function bootstrap() {
  // 初始建表（已存在则跳过）
  await db.query(`
    CREATE TABLE IF NOT EXISTS friends (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      description VARCHAR(255) NOT NULL DEFAULT '',
      url VARCHAR(500) NOT NULL,
      avatar_url VARCHAR(500) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      status ENUM('active', 'pending', 'hidden') NOT NULL DEFAULT 'active',
      applied_at TIMESTAMP NULL DEFAULT NULL,
      applicant_ip VARCHAR(64) NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_friends_status_order (status, sort_order DESC, id DESC),
      INDEX idx_friends_applied (applied_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 兼容已存在的旧表：增量加列、升级 status 枚举
  await migrateFriendsTable();
}

/**
 * 跨版本兼容的小型迁移：
 * - 老表里 status 可能只有 ('active','hidden')，要扩成 ('active','pending','hidden')
 * - 老表里没有 applied_at / applicant_ip 这两列，要补
 * - applied_at 索引也要补
 *
 * 用 information_schema 检测，做幂等升级（多次运行无副作用）
 */
async function migrateFriendsTable() {
  type ColRow = RowDataPacket & {
    COLUMN_NAME: string;
    COLUMN_TYPE: string;
  };
  const [cols] = await db.query<ColRow[]>(
    `SELECT COLUMN_NAME, COLUMN_TYPE
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'friends'`,
  );

  const colByName = new Map(cols.map((c) => [c.COLUMN_NAME, c]));

  // 升级 status 枚举
  const statusCol = colByName.get("status");
  if (statusCol && !statusCol.COLUMN_TYPE.includes("'pending'")) {
    await db.query(
      `ALTER TABLE friends
       MODIFY COLUMN status ENUM('active', 'pending', 'hidden')
       NOT NULL DEFAULT 'active'`,
    );
  }

  // 加 applied_at
  if (!colByName.has("applied_at")) {
    await db.query(
      `ALTER TABLE friends
       ADD COLUMN applied_at TIMESTAMP NULL DEFAULT NULL AFTER status`,
    );
  }

  // 加 applicant_ip
  if (!colByName.has("applicant_ip")) {
    await db.query(
      `ALTER TABLE friends
       ADD COLUMN applicant_ip VARCHAR(64) NULL DEFAULT NULL AFTER applied_at`,
    );
  }

  // 补索引（幂等）
  type IndexRow = RowDataPacket & { INDEX_NAME: string };
  const [indexes] = await db.query<IndexRow[]>(
    `SELECT INDEX_NAME FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'friends'`,
  );
  const indexNames = new Set(indexes.map((i) => i.INDEX_NAME));
  if (!indexNames.has("idx_friends_applied")) {
    await db.query(
      `ALTER TABLE friends ADD INDEX idx_friends_applied (applied_at)`,
    );
  }
}

function ensureTable() {
  if (!global.__friendsReady) {
    global.__friendsReady = bootstrap().catch((err) => {
      global.__friendsReady = undefined;
      throw err;
    });
  }
  return global.__friendsReady;
}

export interface FriendRecord {
  id: number;
  name: string;
  description: string;
  url: string;
  avatarUrl: string | null;
  sortOrder: number;
  status: "active" | "pending" | "hidden";
  appliedAt: string | null;
  applicantIp: string | null;
  createdAt: string;
  updatedAt: string;
}

type RawFriendRow = RowDataPacket & {
  id: number;
  name: string;
  description: string;
  url: string;
  avatar_url: string | null;
  sort_order: number;
  status: "active" | "pending" | "hidden";
  applied_at: Date | string | null;
  applicant_ip: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toFriend(row: RawFriendRow): FriendRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    avatarUrl: row.avatar_url,
    sortOrder: row.sort_order,
    status: row.status,
    appliedAt:
      row.applied_at == null
        ? null
        : typeof row.applied_at === "string"
          ? row.applied_at
          : row.applied_at.toISOString(),
    applicantIp: row.applicant_ip,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at.toISOString(),
  };
}

/** 前台用：只返回 active 的，按 sort_order DESC, id DESC */
export async function getActiveFriends(): Promise<FriendRecord[]> {
  await ensureTable();
  const [rows] = await db.query<RawFriendRow[]>(
    `SELECT * FROM friends WHERE status = 'active'
     ORDER BY sort_order DESC, id DESC`,
  );
  return rows.map(toFriend);
}

/** admin 用：所有，包括 hidden */
export async function getAllFriends(): Promise<FriendRecord[]> {
  await ensureTable();
  const [rows] = await db.query<RawFriendRow[]>(
    `SELECT * FROM friends ORDER BY sort_order DESC, id DESC`,
  );
  return rows.map(toFriend);
}

export async function getFriendById(id: number): Promise<FriendRecord | null> {
  await ensureTable();
  const [rows] = await db.query<RawFriendRow[]>(
    `SELECT * FROM friends WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? toFriend(rows[0]) : null;
}

export interface FriendInput {
  name: string;
  description: string;
  url: string;
  avatarUrl: string | null;
  sortOrder: number;
  status: "active" | "pending" | "hidden";
}

export async function createFriend(input: FriendInput): Promise<number> {
  await ensureTable();
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO friends (name, description, url, avatar_url, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.description,
      input.url,
      input.avatarUrl,
      input.sortOrder,
      input.status,
    ],
  );
  return result.insertId;
}

export async function updateFriend(id: number, input: FriendInput) {
  await ensureTable();
  await db.execute<ResultSetHeader>(
    `UPDATE friends
     SET name = ?, description = ?, url = ?, avatar_url = ?, sort_order = ?, status = ?
     WHERE id = ?`,
    [
      input.name,
      input.description,
      input.url,
      input.avatarUrl,
      input.sortOrder,
      input.status,
      id,
    ],
  );
}

export async function deleteFriend(id: number) {
  await ensureTable();
  await db.execute<ResultSetHeader>(`DELETE FROM friends WHERE id = ?`, [id]);
}

// ---------- 申请功能预留 ----------
// 这些 API 已经实现并可用；前台「申请友链」UI 暂未做，做的时候直接调即可。

/**
 * 后台审核用：列出 pending 申请，按申请时间倒序
 */
export async function getPendingFriends(): Promise<FriendRecord[]> {
  await ensureTable();
  const [rows] = await db.query<RawFriendRow[]>(
    `SELECT * FROM friends WHERE status = 'pending'
     ORDER BY applied_at DESC, id DESC`,
  );
  return rows.map(toFriend);
}

export interface FriendApplicationInput {
  name: string;
  description: string;
  url: string;
  avatarUrl: string | null;
  applicantIp: string | null;
}

/**
 * 访客提交申请：固定写入 pending，记录 applied_at 和 applicant_ip。
 * 不允许指定 status / sort_order，这两个字段由管理员审核时决定。
 */
export async function submitFriendApplication(
  input: FriendApplicationInput,
): Promise<number> {
  await ensureTable();
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO friends
       (name, description, url, avatar_url, sort_order, status, applied_at, applicant_ip)
     VALUES (?, ?, ?, ?, 0, 'pending', NOW(), ?)`,
    [
      input.name,
      input.description,
      input.url,
      input.avatarUrl,
      input.applicantIp,
    ],
  );
  return result.insertId;
}

/**
 * 审核通过：把 pending 改成 active，可以一并设置 sort_order
 */
export async function approveFriend(id: number, sortOrder = 0) {
  await ensureTable();
  await db.execute<ResultSetHeader>(
    `UPDATE friends SET status = 'active', sort_order = ?
     WHERE id = ? AND status = 'pending'`,
    [sortOrder, id],
  );
}

/**
 * 审核拒绝：直接物理删除该 pending 记录，避免数据库堆积垃圾申请
 */
export async function rejectFriend(id: number) {
  await ensureTable();
  await db.execute<ResultSetHeader>(
    `DELETE FROM friends WHERE id = ? AND status = 'pending'`,
    [id],
  );
}

/**
 * 反滥用辅助：检查该 IP 在最近 N 秒内提交过几次申请
 */
export async function countRecentApplicationsByIp(
  ip: string,
  withinSeconds: number,
): Promise<number> {
  await ensureTable();
  const [rows] = await db.query<(RowDataPacket & { c: number })[]>(
    `SELECT COUNT(*) AS c FROM friends
     WHERE applicant_ip = ? AND applied_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)`,
    [ip, withinSeconds],
  );
  return Number(rows[0]?.c ?? 0);
}
