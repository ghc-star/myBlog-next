import "server-only";

import { blogAssistantGraph } from "./graph";
import { buildGenerationInput } from "./nodes";
import type { GraphState } from "./state";

export type LangGraphChatMessage = GraphState["messages"][number];

function createInitialState(messages: LangGraphChatMessage[]): GraphState {
  return {
    messages,
    query: "",
    routeType: "direct",
    retrievedChunks: [],
    answer: "",
  };
}

export async function prepareBlogAssistantStream(input: {
  messages: LangGraphChatMessage[];
}) {
  const state = await blogAssistantGraph.invoke(createInitialState(input.messages));

  if (state.answer) {
    return {
      fallbackAnswer: state.answer,
      routeType: state.routeType,
      retrievedChunks: state.retrievedChunks,
    };
  }

  const generationInput = buildGenerationInput(state);

  return {
    ...generationInput,
    routeType: state.routeType,
    retrievedChunks: state.retrievedChunks,
  };
}
