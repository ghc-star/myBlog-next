-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS myblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myblog;

-- ========== 用户相关 ==========

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  github_id BIGINT UNSIGNED NOT NULL UNIQUE,
  github_login VARCHAR(64) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  profile_url VARCHAR(500) NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_github_id (github_id),
  INDEX idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_token_hash (token_hash),
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 文章相关 ==========

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  `desc` TEXT,
  `date` DATE NOT NULL,
  tags JSON,
  category VARCHAR(255) NOT NULL,
  category_slug VARCHAR(255) NOT NULL,
  cover VARCHAR(500),
  content LONGTEXT NOT NULL,
  color VARCHAR(50) DEFAULT '#0ea5e9',
  published_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  visits INT DEFAULT 0,
  comments INT DEFAULT 0,
  INDEX idx_category_slug (category_slug),
  INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文章浏览记录表
CREATE TABLE IF NOT EXISTS article_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_article_id (article_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文章点赞表
CREATE TABLE IF NOT EXISTS article_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_article_ip (article_id, ip_address),
  INDEX idx_article_id (article_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文章反应表（点赞、收藏等）
CREATE TABLE IF NOT EXISTS article_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  reaction_type ENUM('like', 'love', 'wow', 'sad', 'angry') DEFAULT 'like',
  ip_address VARCHAR(45) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_article_ip_reaction (article_id, ip_address, reaction_type),
  INDEX idx_article_id (article_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id VARCHAR(255) NOT NULL,
  parent_id INT DEFAULT NULL,
  nickname VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  content TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_article_id (article_id),
  INDEX idx_parent_id (parent_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_comment_ip (comment_id, ip_address),
  INDEX idx_comment_id (comment_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 随笔相关 ==========

-- 随笔表
CREATE TABLE IF NOT EXISTS essays (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(32) NULL,
  status ENUM('published','deleted') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_essays_created (created_at),
  INDEX idx_essays_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 随笔点赞表
CREATE TABLE IF NOT EXISTS essay_likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  essay_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_essay_user (essay_id, user_id),
  INDEX idx_essay_likes_essay (essay_id),
  FOREIGN KEY (essay_id) REFERENCES essays(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 随笔评论表
CREATE TABLE IF NOT EXISTS essay_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  essay_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  status ENUM('published','deleted') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_essay_comments_essay (essay_id, created_at),
  FOREIGN KEY (essay_id) REFERENCES essays(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 友链相关 ==========

-- 友链表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 站点统计 ==========

-- 站点访问记录表
CREATE TABLE IF NOT EXISTS site_views (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_key VARCHAR(64) NOT NULL,
  path VARCHAR(255) NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  viewed_date DATE NOT NULL,
  INDEX idx_site_views_date (viewed_date),
  INDEX idx_site_views_visitor_date (visitor_key, viewed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== AI 相关 ==========

-- AI 聊天记录表
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  content MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_chat_messages_user_id (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI 用户记忆表
CREATE TABLE IF NOT EXISTS ai_user_memories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  memory_key VARCHAR(64) NOT NULL,
  memory_value TEXT NOT NULL,
  category ENUM('profile','learning','interest','preference','goal','other') NOT NULL DEFAULT 'other',
  confidence TINYINT UNSIGNED NOT NULL DEFAULT 80,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_ai_user_memory_key (user_id, memory_key),
  INDEX idx_ai_user_memories_category (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT '所有表创建完成！' as message;
