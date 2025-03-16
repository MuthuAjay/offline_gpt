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

export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface HistoryResponse {
  messages: Message[];
}

// New types for multimodal support
export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface MultimodalMessage {
  role: 'user' | 'assistant' | 'system';
  content: ContentPart[];
}

export interface MultimodalChatRequest {
  model: string;
  messages: MultimodalMessage[];
  stream?: boolean;
  conversation_id?: string;
}

export interface ImageUploadResponse {
  filename: string;
  content_type: string;
  base64_data: string;
} 