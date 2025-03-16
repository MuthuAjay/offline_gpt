export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  conversation_id?: string;
}

export interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface ModelInfo {
  name: string;
  size: string;
  modified_at: string;
}

export interface ModelsResponse {
  models: ModelInfo[];
}

export interface ConversationsResponse {
  conversations: string[];
}

export interface HistoryResponse {
  messages: Message[];
} 