import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, CancelTokenSource } from 'axios';
import { 
  ChatRequest, 
  ChatResponse, 
  ConversationsResponse, 
  HistoryResponse, 
  ModelsResponse, 
  MultimodalChatRequest, 
  ImageUploadResponse,
  ApiError
} from '../types';

// Constants
const API_URL = '/api';
const TIMEOUT = 30000; // 30 seconds timeout
const WEBSOCKET_TIMEOUT = 5000; // 5 seconds timeout

/**
 * API class to handle all HTTP requests
 */
class ApiService {
  private instance: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource>;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    });
    
    this.cancelTokens = new Map();
    
    // Add request interceptor for logging and token handling
    this.instance.interceptors.request.use(
      (config) => {
        // Add any auth tokens if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          status: error.response?.status || 500,
          message: error.message,
          data: error.response?.data || {}
        };
        
        // Log errors in development
        if (process.env.NODE_ENV !== 'production') {
          console.error('API Error:', apiError);
        }
        
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Generate a cancellation token for requests
   */
  private getCancelToken(requestId: string): CancelTokenSource {
    // Cancel any existing request with the same ID
    if (this.cancelTokens.has(requestId)) {
      this.cancelTokens.get(requestId)?.cancel('Request superseded');
      this.cancelTokens.delete(requestId);
    }
    
    const source = axios.CancelToken.source();
    this.cancelTokens.set(requestId, source);
    return source;
  }

  /**
   * Remove a cancellation token from the map
   */
  private removeCancelToken(requestId: string): void {
    this.cancelTokens.delete(requestId);
  }

  /**
   * Fetch available models
   */
  async fetchModels(): Promise<ModelsResponse> {
    const requestId = 'fetchModels';
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      const response = await this.instance.get<ModelsResponse>('/models', { cancelToken });
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Send a chat request
   */
  async sendChatRequest(request: ChatRequest): Promise<ChatResponse> {
    const requestId = `chat-${Date.now()}`;
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      const response = await this.instance.post<ChatResponse>('/chat', request, { cancelToken });
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Fetch all conversations
   */
  async fetchConversations(): Promise<ConversationsResponse> {
    const requestId = 'fetchConversations';
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      const response = await this.instance.get<ConversationsResponse>('/conversations', { cancelToken });
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Fetch conversation history
   */
  async fetchConversationHistory(conversationId: string): Promise<HistoryResponse> {
    const requestId = `history-${conversationId}`;
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      const response = await this.instance.get<HistoryResponse>(`/history/${conversationId}`, { cancelToken });
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const requestId = `delete-${conversationId}`;
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      await this.instance.delete(`/history/${conversationId}`, { cancelToken });
      this.removeCancelToken(requestId);
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createNewConversation(): Promise<{conversation_id: string}> {
    const requestId = 'createConversation';
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      const response = await this.instance.post<{conversation_id: string}>('/conversations', {}, { cancelToken });
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Upload an image for multimodal chat
   */
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const requestId = `upload-${Date.now()}`;
    const cancelToken = this.getCancelToken(requestId).token;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.instance.post<ImageUploadResponse>(
        '/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          cancelToken,
          onUploadProgress: (progressEvent) => {
            // Could emit an event or update a store with upload progress
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Send a multimodal chat request
   */
  async sendMultimodalChatRequest(request: MultimodalChatRequest): Promise<ChatResponse> {
    const requestId = `multimodal-chat-${Date.now()}`;
    const cancelToken = this.getCancelToken(requestId).token;
    
    try {
      const response = await this.instance.post<ChatResponse>('/chat/multimodal', request, { cancelToken });
      this.removeCancelToken(requestId);
      return response.data;
    } catch (error) {
      this.removeCancelToken(requestId);
      throw error;
    }
  }

  /**
   * Create an EventSource for server-sent events
   */
  createEventSource(request: ChatRequest): EventSource {
    const params = new URLSearchParams();
    params.append('model', request.model);
    
    const eventSource = new EventSource(`${API_URL}/chat/stream?${params.toString()}`);
    
    // Add default error handler
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };
    
    return eventSource;
  }

  /**
   * Create a WebSocket connection
   */
  createWebSocketConnection(): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;
    
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
    }, WEBSOCKET_TIMEOUT);
    
    // Clear the timeout when the connection is established
    ws.addEventListener('open', () => {
      clearTimeout(connectionTimeout);
    });
    
    return ws;
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    for (const [id, source] of this.cancelTokens.entries()) {
      source.cancel('Operation canceled');
      this.cancelTokens.delete(id);
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual functions to maintain backward compatibility
export const fetchModels = (): Promise<ModelsResponse> => apiService.fetchModels();
export const sendChatRequest = (request: ChatRequest): Promise<ChatResponse> => apiService.sendChatRequest(request);
export const fetchConversations = (): Promise<ConversationsResponse> => apiService.fetchConversations();
export const fetchConversationHistory = (conversationId: string): Promise<HistoryResponse> => apiService.fetchConversationHistory(conversationId);
export const deleteConversation = (conversationId: string): Promise<void> => apiService.deleteConversation(conversationId);
export const createEventSource = (request: ChatRequest): EventSource => apiService.createEventSource(request);
export const createWebSocketConnection = (): WebSocket => apiService.createWebSocketConnection();
export const createNewConversation = (): Promise<{conversation_id: string}> => apiService.createNewConversation();
export const uploadImage = (file: File): Promise<ImageUploadResponse> => apiService.uploadImage(file);
export const sendMultimodalChatRequest = (request: MultimodalChatRequest): Promise<ChatResponse> => apiService.sendMultimodalChatRequest(request);