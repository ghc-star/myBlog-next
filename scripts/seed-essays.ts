/**
 * 写入几条示例随笔（含示例作者和一条示例评论），方便本地查看随笔页效果。
 * 可重复执行：每次会先清掉旧的示例随笔再重新写入。
 *
 * 用法：npm run seed:essays
 * 清掉示例数据：npm run db:init  （会重建整个库）
 */
import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: ".env.local" });
config();

// 示例账号：用不可能撞上真实 GitHub id 的值，
// 这样你真正用 GitHub 登录后会拿到自己的账号，不会和示例数据混在一起。
const DEMO_USERS = [
  {
    githubId: 1,
    login: "ghc",
    avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    profile: "https://github.com/ghc-star",
  },
  {
    githubId: 2,
    login: "visitor",
    avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    profile: "https://github.com/ghc-star",
  },
];

const essays = [
  {
    content:
      "把博客从「读 Markdown 文件」改成「读数据库」，折腾了一晚上。\n最大的感受是：文章终于能带评论、点赞和浏览量了，静态生成那套心法到这里就得换一套。",
    mood: "thinking",
    daysAgo: 0,
    liked: true,
    comments: ["这篇说到点子上了，静态生成那套确实得换。"],
  },
  {
    content:
      "重写 BFS 模板的时候突然想明白一件事：队列里存的不是「点」，而是「这一轮能走到哪」。\n把这个念头放进代码里，迷宫题一下子就顺了。",
    mood: "happy",
    daysAgo: 2,
    liked: false,
    comments: [],
  },
  {
    content: "深夜的代码总是写得又快又自信，第二天的自己负责沉默。",
    mood: "tired",
    daysAgo: 6,
    liked: true,
    comments: ["第二天的我：这不是我写的。"],
  },
];

async function main() {
  // 托管数据库（如 TiDB Cloud）强制 TLS；本地 MySQL 没开 SSL，不能带上
  const host = process.env.DB_HOST ?? "";
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
  const conn = await mysql.createConnection({
    host,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(isLocal
      ? {}
      : { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }),
  });

  // 1. 确保示例账号存在，拿到 id
  const userIds = new Map<string, number>();
  for (const user of DEMO_USERS) {
    await conn.execute(
      `INSERT INTO users (github_id, github_login, avatar_url, profile_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         github_login = VALUES(github_login),
         avatar_url = VALUES(avatar_url)`,
      [user.githubId, user.login, user.avatar, user.profile],
    );

    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE github_id = ?",
      [user.githubId],
    );
    userIds.set(user.login, rows[0].id);
  }

  const authorId = userIds.get("ghc")!;
  const visitorId = userIds.get("visitor")!;

  // 2. 清掉旧的示例随笔（点赞/评论随外键级联删除）
  await conn.execute("DELETE FROM essays WHERE user_id IN (?, ?)", [
    authorId,
    visitorId,
  ]);

  // 3. 重新写入
  for (const essay of essays) {
    const ago = Number(essay.daysAgo);
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO essays (user_id, content, mood, created_at, updated_at)
       VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ${ago} DAY),
                          DATE_SUB(NOW(), INTERVAL ${ago} DAY))`,
      [authorId, essay.content, essay.mood],
    );
    const essayId = result.insertId;

    if (essay.liked) {
      await conn.execute(
        "INSERT IGNORE INTO essay_likes (essay_id, user_id) VALUES (?, ?)",
        [essayId, visitorId],
      );
    }

    for (const comment of essay.comments) {
      await conn.execute(
        "INSERT INTO essay_comments (essay_id, user_id, content) VALUES (?, ?, ?)",
        [essayId, visitorId, comment],
      );
    }
  }

  await conn.end();
  console.log(`✅ 已写入 ${essays.length} 条示例随笔（作者 ghc / 访客 visitor）`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
