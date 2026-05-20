import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "@/lib/db";

export type ChatMemoryRole = "user" | "assistant";

export type ChatMemoryMessage = {
  role: ChatMemoryRole;
  content: string;
};

export type UserMemoryCategory =
  | "profile"
  | "learning"
  | "interest"
  | "preference"
  | "goal"
  | "other";

export type UserMemory = {
  key: string;
  value: string;
  category: UserMemoryCategory;
  confidence: number;
};

type ChatMessageRow = RowDataPacket & {
  role: ChatMemoryRole;
  content: string;
};

type UserMemoryRow = RowDataPacket & {
  memory_key: string;
  memory_value: string;
  category: UserMemoryCategory;
  confidence: number;
};

declare global {
   
  var __aiMemoryTablesReady: Promise<void> | undefined;
}

const MEMORY_CATEGORIES = new Set<UserMemoryCategory>([
  "profile",
  "learning",
  "interest",
  "preference",
  "goal",
  "other",
]);

async function bootstrapAiMemoryTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_chat_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      role ENUM('user','assistant') NOT NULL,
      content MEDIUMTEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ai_chat_messages_user_id (user_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_user_memories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      memory_key VARCHAR(64) NOT NULL,
      memory_value TEXT NOT NULL,
      category ENUM('profile','learning','interest','preference','goal','other') NOT NULL DEFAULT 'other',
      confidence TINYINT UNSIGNED NOT NULL DEFAULT 80,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_ai_user_memory_key (user_id, memory_key),
      INDEX idx_ai_user_memories_category (user_id, category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function ensureAiMemoryTables() {
  if (!global.__aiMemoryTablesReady) {
    global.__aiMemoryTablesReady = bootstrapAiMemoryTables().catch((error) => {
      global.__aiMemoryTablesReady = undefined;
      throw error;
    });
  }

  return global.__aiMemoryTablesReady;
}

function cleanText(text: string, maxLength: number) {
  return text.trim().slice(0, maxLength);
}

export async function loadRecentChatMessages(
  userId: number,
  limit: number = 6,
): Promise<ChatMemoryMessage[]> {
  await ensureAiMemoryTables();

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  const [rows] = await db.query<ChatMessageRow[]>(
    `
    SELECT role, content
    FROM (
      SELECT id, role, content
      FROM ai_chat_messages
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ?
    ) recent_messages
    ORDER BY id ASC
    `,
    [userId, safeLimit],
  );

  return rows.map((row) => ({
    role: row.role,
    content: row.content,
  }));
}

export async function appendChatMessages(
  userId: number,
  messages: ChatMemoryMessage[],
) {
  const validMessages = messages
    .map((message) => ({
      role: message.role,
      content: cleanText(message.content, 12000),
    }))
    .filter((message) => message.content);

  if (!validMessages.length) return;

  await ensureAiMemoryTables();

  await db.query<ResultSetHeader>(
    `
    INSERT INTO ai_chat_messages (user_id, role, content)
    VALUES ${validMessages.map(() => "(?, ?, ?)").join(", ")}
    `,
    validMessages.flatMap((message) => [userId, message.role, message.content]),
  );
}

export async function loadUserMemories(userId: number): Promise<UserMemory[]> {
  await ensureAiMemoryTables();

  const [rows] = await db.query<UserMemoryRow[]>(
    `
    SELECT memory_key, memory_value, category, confidence
    FROM ai_user_memories
    WHERE user_id = ?
    ORDER BY FIELD(category, 'profile', 'learning', 'interest', 'preference', 'goal', 'other'), memory_key ASC
    `,
    [userId],
  );

  return rows.map((row) => ({
    key: row.memory_key,
    value: row.memory_value,
    category: MEMORY_CATEGORIES.has(row.category) ? row.category : "other",
    confidence: Number(row.confidence ?? 80),
  }));
}

export async function upsertUserMemories(
  userId: number,
  memories: UserMemory[],
) {
  const validMemories = memories
    .map((memory) => ({
      key: cleanText(memory.key, 64),
      value: cleanText(memory.value, 1000),
      category: MEMORY_CATEGORIES.has(memory.category)
        ? memory.category
        : "other",
      confidence: Math.min(
        Math.max(Math.floor(memory.confidence ?? 80), 1),
        100,
      ),
    }))
    .filter((memory) => memory.key && memory.value)
    .slice(0, 3);

  if (!validMemories.length) return;

  await ensureAiMemoryTables();

  await db.query<ResultSetHeader>(
    `
    INSERT INTO ai_user_memories (user_id, memory_key, memory_value, category, confidence)
    VALUES ${validMemories.map(() => "(?, ?, ?, ?, ?)").join(", ")}
    ON DUPLICATE KEY UPDATE
      memory_value = VALUES(memory_value),
      category = VALUES(category),
      confidence = VALUES(confidence)
    `,
    validMemories.flatMap((memory) => [
      userId,
      memory.key,
      memory.value,
      memory.category,
      memory.confidence,
    ]),
  );
}

export function formatUserMemoriesForPrompt(memories: UserMemory[]) {
  if (!memories.length) return "";

  const categoryNames: Record<UserMemoryCategory, string> = {
    profile: "基本信息",
    learning: "最近学习",
    interest: "兴趣方向",
    preference: "偏好",
    goal: "目标",
    other: "其他",
  };

  const lines = memories.map(
    (memory) =>
      `- ${categoryNames[memory.category]} / ${memory.key}：${memory.value}`,
  );

  return `用户长期记忆：\n${lines.join("\n")}`;
}
