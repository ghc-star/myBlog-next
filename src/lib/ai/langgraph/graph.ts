import "server-only";

import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { getLangChainChatModel } from "@/lib/ai/provider";

import { blogAssistantTools } from "./tools";

const BLOG_ASSISTANT_PROMPT = `你是博客 AI 助手，也可以陪用户日常聊天。

规则：
1. 普通寒暄、闲聊、通用问题可以直接回答，不需要调用工具。
2. 用户询问博客事实、文章列表、分类、文章内容、推荐文章时，必须优先调用工具，不要凭空编造。
3. 用户询问博客有哪些文章时，调用 list_blog_articles。
4. 用户要求推荐文章时，调用 recommend_blog_article，按浏览量推荐。
5. 用户询问某个分类有哪些文章时，调用 list_articles_by_category，不要要求用户提供 slug。
6. 用户询问博客内容、技术点、某主题是否在博客中出现时，调用 search_blog_content。
7. 用户要求阅读或查看某篇文章时，调用 read_blog_article。
8. 用户询问天气时，调用 get_weather。
9. 用户要一句话、一言、句子时，调用 get_hitokoto。
10. 工具结果不足时，要明确说明博客中没有检索到足够信息，再给出通用建议。
11. 如果系统上下文提供了用户长期记忆，可以自然参考这些信息，但不要主动说“我从数据库读到了记忆”。
12. 如果用户长期记忆和当前用户消息冲突，以当前用户消息为准。
13. 不要复述敏感信息，除非用户明确询问且上下文确实需要。
14. 回答使用中文，格式清晰、简洁、有帮助。
15. 涉及文章时尽量使用工具返回的 Markdown 链接，不要把内部 ID 当作字段展示给用户。`;

const modelWithTools = getLangChainChatModel().bindTools(blogAssistantTools);
const toolNode = new ToolNode(blogAssistantTools);

async function agentNode(state: typeof MessagesAnnotation.State) {
  const response = await modelWithTools.invoke([
    ["system", BLOG_ASSISTANT_PROMPT],
    ...state.messages,
  ]);

  return { messages: [response] };
}

export const blogAssistantAgent = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", "agent")
  .compile();
