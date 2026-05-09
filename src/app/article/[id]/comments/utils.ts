import type { ApiComment, CommentNode, CommentSort, ReplyNode } from "./types";

export function formatDate(date: string) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function redirectToGithubLogin() {
  window.location.href = `/api/auth/github?returnTo=${encodeURIComponent(
    window.location.pathname,
  )}`;
}

export function buildDouyinCommentTree(comments: ApiComment[]): CommentNode[] {
  const commentMap = new Map<number, ApiComment>();
  const childrenMap = new Map<number, ApiComment[]>();
  const roots: CommentNode[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, comment);

    if (comment.parent_id !== null) {
      const list = childrenMap.get(comment.parent_id) ?? [];
      list.push(comment);
      childrenMap.set(comment.parent_id, list);
    }
  }

  function collectReplies(rootId: number): ReplyNode[] {
    const result: ReplyNode[] = [];

    function dfs(parentId: number) {
      const children = childrenMap.get(parentId) ?? [];

      for (const child of children) {
        const parent = child.parent_id ? commentMap.get(child.parent_id) : null;

        result.push({
          ...child,
          replyToAuthor: parent?.author ?? "",
        });

        dfs(child.id);
      }
    }

    dfs(rootId);

    return result;
  }

  for (const comment of comments) {
    if (comment.parent_id === null) {
      roots.push({
        ...comment,
        replies: collectReplies(comment.id),
      });
    }
  }

  return roots;
}

export function sortComments(
  comments: CommentNode[],
  sort: CommentSort,
): CommentNode[] {
  return [...comments].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();

    return sort === "latest" ? bTime - aTime : aTime - bTime;
  });
}

export function sortReplies(
  replies: ReplyNode[],
  sort: CommentSort,
): ReplyNode[] {
  return [...replies].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();

    return sort === "latest" ? bTime - aTime : aTime - bTime;
  });
}
