import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var __siteViewsReady: Promise<void> | undefined;
}

async function bootstrap() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS site_views (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      visitor_key VARCHAR(64) NOT NULL,
      path VARCHAR(255) NOT NULL,
      viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      viewed_date DATE NOT NULL,
      INDEX idx_site_views_date (viewed_date),
      INDEX idx_site_views_visitor_date (visitor_key, viewed_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function ensureTable() {
  if (!global.__siteViewsReady) {
    global.__siteViewsReady = bootstrap().catch((err) => {
      global.__siteViewsReady = undefined;
      throw err;
    });
  }
  return global.__siteViewsReady;
}

export async function recordSiteView(input: {
  visitorKey: string;
  path: string;
}) {
  await ensureTable();
  await db.execute<ResultSetHeader>(
    `INSERT INTO site_views (visitor_key, path, viewed_date) VALUES (?, ?, CURDATE())`,
    [input.visitorKey, input.path],
  );
}

export interface SiteStats {
  totalPv: number;
  totalUv: number;
  todayPv: number;
  todayUv: number;
}

// 会话超时时间（分钟）：与上一次访问间隔 >= 该值视为新会话
const SESSION_TIMEOUT_MINUTES = 30;

export async function getSiteStats(): Promise<SiteStats> {
  await ensureTable();
  // 总 PV / UV、今日 UV 仍按原口径；今日访问改为"今日开始的会话数"
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total_pv,
       COUNT(DISTINCT visitor_key) AS total_uv,
       COUNT(DISTINCT CASE WHEN viewed_date = CURDATE() THEN visitor_key END) AS today_uv
     FROM site_views`,
  );
  const row = rows[0] ?? {};

  const [sessionRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS today_sessions
     FROM (
       SELECT
         viewed_date,
         viewed_at,
         LAG(viewed_at) OVER (PARTITION BY visitor_key ORDER BY viewed_at) AS prev_at
       FROM site_views
     ) t
     WHERE t.viewed_date = CURDATE()
       AND (t.prev_at IS NULL
            OR TIMESTAMPDIFF(MINUTE, t.prev_at, t.viewed_at) >= ?)`,
    [SESSION_TIMEOUT_MINUTES],
  );
  const todayPv = Number(sessionRows[0]?.today_sessions ?? 0);

  return {
    totalPv: Number(row.total_pv ?? 0),
    totalUv: Number(row.total_uv ?? 0),
    todayPv,
    todayUv: Number(row.today_uv ?? 0),
  };
}

export interface DailyTrend {
  date: string;
  pv: number;
  uv: number;
}

export async function getDailyTrend(days: number = 30): Promise<DailyTrend[]> {
  await ensureTable();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       DATE_FORMAT(viewed_date, '%Y-%m-%d') AS date,
       COUNT(*) AS pv,
       COUNT(DISTINCT visitor_key) AS uv
     FROM site_views
     WHERE viewed_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY viewed_date
     ORDER BY viewed_date ASC`,
    [days - 1],
  );
  return rows.map((r) => ({
    date: String(r.date),
    pv: Number(r.pv),
    uv: Number(r.uv),
  }));
}
