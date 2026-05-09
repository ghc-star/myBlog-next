export type CommentSort = "oldest" | "latest";

export type ApiComment = {
  id: number;
  article_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  author: string;
  avatar_url: string | null;
  like_count: number;
  liked_by_me: 0 | 1 | boolean;
};

export type ReplyNode = ApiComment & {
  replyToAuthor: string;
};

export type CommentNode = ApiComment & {
  replies: ReplyNode[];
};
