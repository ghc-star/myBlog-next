export type GraphRouteType =
  | "rag"
  | "stats"
  | "list"
  | "recommend"
  | "category"
  | "read"
  | "hitokoto"
  | "weather"
  | "direct";

export interface RetrievedChunk {
  title: string;
  url: string;
  score: number;
  text: string;
}

export interface GraphState {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  query: string;
  routeType: GraphRouteType;
  retrievedChunks: RetrievedChunk[];
  answer: string;
}

export const initialGraphState: GraphState = {
  messages: [],
  query: "",
  routeType: "direct",
  retrievedChunks: [],
  answer: "",
};
