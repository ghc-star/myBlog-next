import { createOpenAI } from "@ai-sdk/openai";

export const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL! + "/v1",
});

export function getChatModel() {
  return deepseek.chat(process.env.DEEPSEEK_MODEL ?? "deepseek-chat");
}
