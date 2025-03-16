import axios from 'axios';
import { ChatRequest, ChatResponse, ConversationsResponse, HistoryResponse, ModelsResponse, MultimodalChatRequest, ImageUploadResponse } from '../types';

// Use relative paths for API URLs in development
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchModels = async (): Promise<ModelsResponse> => {
  const response = await api.get<ModelsResponse>('/models');
  return response.data;
};

export const sendChatRequest = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', request);
  return response.data;
};

export const fetchConversations = async (): Promise<ConversationsResponse> => {
  const response = await api.get<ConversationsResponse>('/conversations');
  return response.data;
};

export const fetchConversationHistory = async (conversationId: string): Promise<HistoryResponse> => {
  const response = await api.get<HistoryResponse>(`/history/${conversationId}`);
  return response.data;
};

export const deleteConversation = async (conversationId: string): Promise<void> => {
  await api.delete(`/history/${conversationId}`);
};

export const createEventSource = (request: ChatRequest): EventSource => {
  const params = new URLSearchParams();
  params.append('model', request.model);
  
  const eventSource = new EventSource(`${API_URL}/chat/stream?${params.toString()}`);
  return eventSource;
};

export const createWebSocketConnection = (): WebSocket => {
  // Use the current host for WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/ws`;
  
  console.log('Creating WebSocket connection to:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  // Add connection event handlers
  ws.addEventListener('open', () => {
    console.log('WebSocket connection opened');
  });
  
  ws.addEventListener('error', (error) => {
    console.error('WebSocket connection error:', error);
  });
  
  ws.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
  });
  
  // Set a timeout to handle connection issues
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection timeout');
      // Force close the connection if it's still connecting
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  }, 5000); // 5 seconds timeout
  
  // Clear the timeout when the connection is established
  ws.addEventListener('open', () => {
    clearTimeout(connectionTimeout);
  });
  
  return ws;
};

export const createNewConversation = async (): Promise<{conversation_id: string}> => {
  const response = await api.post<{conversation_id: string}>('/conversations');
  return response.data;
};

// New functions for multimodal support
export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<ImageUploadResponse>(
    '/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const sendMultimodalChatRequest = async (request: MultimodalChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat/multimodal', request);
  return response.data;
}; 