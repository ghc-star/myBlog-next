import type { EssayCommentRecord, EssayRecord } from "@/lib/essay";

export type EssayDTO = EssayRecord;
export type EssayCommentDTO = EssayCommentRecord;

export type CurrentEssayUser = {
  id: number;
  author: string;
  avatarUrl: string | null;
  profileUrl: string | null;
} | null;
