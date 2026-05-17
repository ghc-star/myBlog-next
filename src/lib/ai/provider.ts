import { createOpenAI } from "@ai-sdk/openai";

//前台对话
export const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL! + "/v1",
});

export function getChatModel() {
  return deepseek.chat(process.env.DEEPSEEK_MODEL ?? "deepseek-chat");
}

//后台写作

const writerProvider = createOpenAI({
  apiKey: process.env.WRITER_API_KEY ?? process.env.DEEPSEEK_API_KEY!,
  baseURL:
    (process.env.WRITER_BASE_URL ?? process.env.DEEPSEEK_BASE_URL!) + "/v1",
});

export function getWriterModel() {
  const model =
    process.env.WRITER_MODEL ??
    process.env.DEEPSEEK_MODEL ??
    "deepseek-chat";
  return writerProvider.chat(model);
}