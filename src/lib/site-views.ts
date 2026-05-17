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

export async function getSiteStats(): Promise<SiteStats> {
  await ensureTable();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total_pv,
       COUNT(DISTINCT visitor_key) AS total_uv,
       COUNT(CASE WHEN viewed_date = CURDATE() THEN 1 END) AS today_pv,
       COUNT(DISTINCT CASE WHEN viewed_date = CURDATE() THEN visitor_key END) AS today_uv
     FROM site_views`,
  );
  const row = rows[0] ?? {};
  return {
    totalPv: Number(row.total_pv ?? 0),
    totalUv: Number(row.total_uv ?? 0),
    todayPv: Number(row.today_pv ?? 0),
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
