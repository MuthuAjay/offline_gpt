/**
 * Core types for message handling
 */

// Basic content types
export type ContentType = 'text' | 'image_url' | 'file_url' | 'code';

export interface BaseContentPart {
  type: ContentType;
}

export interface TextContent extends BaseContentPart {
  type: 'text';
  text: string;
}

export interface ImageUrlContent extends BaseContentPart {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
    alt_text?: string;
  };
}

export interface FileUrlContent extends BaseContentPart {
  type: 'file_url';
  file_url: {
    url: string;
    mime_type: string;
  };
}

export interface CodeContent extends BaseContentPart {
  type: 'code';
  code: {
    text: string;
    language: string;
  };
}

// Union of all content part types
export type ContentPart = TextContent | ImageUrlContent | FileUrlContent | CodeContent;

// Message roles
export type MessageRole = 'user' | 'assistant' | 'system';

// Basic message format
export interface Message {
  role: MessageRole;
  content: string;
  id?: string;
  timestamp?: string;
}

// Multimodal message format
export interface MultimodalMessage {
  role: MessageRole;
  content: ContentPart[];
  id?: string;
  timestamp?: string;
}

/**
 * Request types
 */

// Base request type
export interface BaseRequest {
  model: string;
  stream?: boolean;
  conversation_id?: string;
  temperature?: number;
  max_tokens?: number;
}

// Standard chat request
export interface ChatRequest extends BaseRequest {
  messages: Message[];
}

// Multimodal chat request
export interface MultimodalChatRequest extends BaseRequest {
  messages: MultimodalMessage[];
}

/**
 * Response types
 */

// API error response
export interface ApiError {
  status: number;
  message: string;
  data: any;
}

// Basic message response
export interface ChatResponse {
  message: {
    role: string;
    content: string;
    id?: string;
  };
  done: boolean;
  conversation_id?: string;
  created_at?: string;
}

// Streaming response chunk
export interface StreamResponseChunk {
  id: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

// Image upload response
export interface ImageUploadResponse {
  filename: string;
  content_type: string;
  base64_data: string;
  url?: string;
  size?: number;
}

// File upload response
export interface FileUploadResponse {
  filename: string;
  content_type: string;
  url: string;
  size: number;
}

/**
 * Model information
 */
export interface ModelInfo {
  name: string;
  size: string;
  modified_at: string;
  capabilities?: {
    multimodal?: boolean;
    code?: boolean;
    vision?: boolean;
  };
  context_length?: number;
  default_parameters?: {
    temperature: number;
    max_tokens: number;
  };
}

export interface ModelsResponse {
  models: ModelInfo[];
}

/**
 * Conversation management
 */
export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  model?: string;
  message_count?: number;
  last_message?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  };
}

export interface HistoryResponse {
  messages: Message[];
  conversation_id: string;
  title?: string;
  model?: string;
}

/**
 * WebSocket and EventSource related types
 */
export interface WebSocketMessage {
  type: 'message' | 'error' | 'info';
  payload: any;
}

export interface EventSourceMessage {
  id?: string;
  data: string;
  event?: string;
}

/**
 * UI State related types
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversation_id: string | null;
  model: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  files: {
    [filename: string]: {
      type: string;
      url: string;
      size: number;
    };
  };
}