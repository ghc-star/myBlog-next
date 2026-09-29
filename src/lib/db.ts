import "server-only";
import mysql from "mysql2/promise";

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

// TiDB Cloud 等托管数据库强制 TLS 连接；本地 MySQL 未启用 SSL，不能开
const host = process.env.DB_HOST ?? "127.0.0.1";
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);

export const db =
  global.__mysqlPool ??
  mysql.createPool({
    host,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(isLocal
      ? {}
      : { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }),
  });

if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool = db;
}
