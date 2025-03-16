import axios from 'axios';
import { ChatRequest, ChatResponse, ConversationsResponse, HistoryResponse, ModelsResponse } from '../types';

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
  const wsUrl = `${protocol}//${window.location.host}/api/ws`;
  const ws = new WebSocket(wsUrl);
  return ws;
}; 