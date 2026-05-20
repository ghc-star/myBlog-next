import "server-only";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import type { GraphRouteType, GraphState, RetrievedChunk } from "./state";
import {
  categoryArticlesNode,
  hitokotoNode,
  listArticlesNode,
  readArticleNode,
  recommendArticleNode,
  retrieveNode,
  routerNode,
  statsNode,
  weatherNode,
} from "./nodes";

function routeAfterRouter(
  state: typeof BlogAssistantAnnotation.State,
):
  | "retrieve"
  | "stats"
  | "list"
  | "recommend"
  | "category"
  | "read"
  | "hitokoto"
  | "weather"
  | "end" {
  if (state.routeType === "rag") return "retrieve";
  if (state.routeType === "stats") return "stats";
  if (state.routeType === "list") return "list";
  if (state.routeType === "recommend") return "recommend";
  if (state.routeType === "category") return "category";
  if (state.routeType === "read") return "read";
  if (state.routeType === "hitokoto") return "hitokoto";
  if (state.routeType === "weather") return "weather";
  return "end";
}

function routeAfterRetrieve(): "end" {
  return "end";
}

export const BlogAssistantAnnotation = Annotation.Root({
  messages: Annotation<GraphState["messages"]>(),
  query: Annotation<string>(),
  routeType: Annotation<GraphRouteType>(),
  retrievedChunks: Annotation<RetrievedChunk[]>(),
  answer: Annotation<string>(),
});

export const blogAssistantGraph = new StateGraph(BlogAssistantAnnotation)
  .addNode("router", routerNode)
  .addNode("stats", statsNode)
  .addNode("list", listArticlesNode)
  .addNode("recommend", recommendArticleNode)
  .addNode("category", categoryArticlesNode)
  .addNode("read", readArticleNode)
  .addNode("hitokoto", hitokotoNode)
  .addNode("weather", weatherNode)
  .addNode("retrieve", retrieveNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeAfterRouter, {
    retrieve: "retrieve",
    stats: "stats",
    list: "list",
    recommend: "recommend",
    category: "category",
    read: "read",
    hitokoto: "hitokoto",
    weather: "weather",
    end: END,
  })
  .addConditionalEdges("retrieve", routeAfterRetrieve, {
    end: END,
  })
  .addEdge("stats", END)
  .addEdge("list", END)
  .addEdge("recommend", END)
  .addEdge("category", END)
  .addEdge("read", END)
  .addEdge("hitokoto", END)
  .addEdge("weather", END)
  .compile();
