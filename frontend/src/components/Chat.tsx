import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ContentPart, MultimodalMessage } from '../types';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import ThemeToggle from './ThemeToggle';
import { 
  createWebSocketConnection, 
  fetchConversationHistory, 
  createNewConversation, 
  sendMultimodalChatRequest 
} from '../services/api';
import Sidebar from './Sidebar';

const LOADING_TIMEOUT = 30000; // 30 seconds timeout

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('selectedModel') || '';
  });
  const [conversationId, setConversationId] = useState<string>(() => {
    // Generate a new conversation ID or use one from localStorage
    const savedId = localStorage.getItem('currentConversationId');
    return savedId || uuidv4();
  });
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection handler
  const initializeWebSocket = useCallback(() => {
    if (!selectedModel) return null;
    
    // Close existing connection if any
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    
    const newWs = createWebSocketConnection();
    
    newWs.onopen = () => {
      console.log('WebSocket connection established');
      setError(null);
    };
    
    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
      setError('Failed to connect to the server. Please check your network connection.');
    };
    
    newWs.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setIsLoading(false);
      
      // Only set error if it wasn't a normal closure
      if (event.code !== 1000) {
        setError('Connection to server was lost. Please refresh the page.');
      }
    };
    
    // WebSocket message handler
    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          console.error('WebSocket error:', data.error);
          setIsLoading(false);
          setError(`Server error: ${data.error}`);
          
          // Clear the loading timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          return;
        }
        
        // Check for done flag - Ollama may send it in different ways
        const isDone = data.done === true || data.done === "true" || data.done === 1;
        
        if (data.message && data.message.content) {
          setMessages(prevMessages => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant') {
              // For streaming, we need to APPEND the new content, not replace it
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                // Append the new content to the existing content
                content: lastMessage.content + data.message.content,
              };
              return updatedMessages;
            } else {
              // If this is the first chunk, create a new message
              return [
                ...prevMessages,
                {
                  role: 'assistant',
                  content: data.message.content,
                },
              ];
            }
          });
        }
        
        // Set loading to false when we receive the done flag
        if (isDone) {
          setIsLoading(false);
          
          // Clear the loading timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setIsLoading(false);
        setError('Failed to process server response. Please try again.');
        
        // Clear the loading timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    };
    
    return newWs;
  }, [selectedModel]);

  // Load conversation history when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetchConversationHistory(conversationId);
        if (response.messages && response.messages.length > 0) {
          setMessages(response.messages);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
        setError('Failed to load conversation history. Please try again.');
      }
    };

    loadHistory();
  }, [conversationId]);

  // Initialize or reinitialize WebSocket when model changes
  useEffect(() => {
    // Save selected model to localStorage
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
    
    ws.current = initializeWebSocket();
    
    // Clean up WebSocket connection when component unmounts or model changes
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      // Clear any pending timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [selectedModel, initializeWebSocket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handler for sending messages
  const handleSendMessage = useCallback(async (content: string, imageBase64?: string) => {
    if (!content.trim() && !imageBase64) return;
    
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Create user message for display
    const userMessage: Message = {
      role: 'user',
      content: imageBase64 
        ? `${content} [Image attached]` 
        : content,
    };
    
    // Add to messages for display
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Set a timeout to reset loading state in case of issues
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      setError('Request timed out. Please try again.');
      loadingTimeoutRef.current = null;
    }, LOADING_TIMEOUT);
    
    // Save conversation ID to localStorage
    localStorage.setItem('currentConversationId', conversationId);
    
    try {
      if (imageBase64) {
        // For multimodal messages, use the REST API
        
        // Create content parts
        const contentParts: ContentPart[] = [];
        
        // Add text if provided
        if (content.trim()) {
          contentParts.push({
            type: 'text',
            text: content
          });
        }
        
        // Add image
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        });
        
        // Prepare multimodal message format for the API
        const multimodalMessages: MultimodalMessage[] = messages.map(msg => {
          // Convert regular messages to multimodal format
          return {
            role: msg.role,
            content: [{
              type: 'text',
              text: msg.content
            }]
          };
        });
        
        // Add the new user message in multimodal format
        multimodalMessages.push({
          role: 'user',
          content: contentParts
        });
        
        // Send multimodal request
        const response = await sendMultimodalChatRequest({
          model: selectedModel,
          messages: multimodalMessages,
          conversation_id: conversationId
        });
        
        // Handle the response
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: 'assistant',
            content: response.message.content
          }
        ]);
        setIsLoading(false);
        
        // Clear the loading timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      } else {
        // For text-only, use WebSocket
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          const payload = {
            model: selectedModel,
            messages: [...messages, userMessage],
            conversation_id: conversationId,
          };
          ws.current.send(JSON.stringify(payload));
        } else {
          // If WebSocket is not connected, try to reconnect
          ws.current = initializeWebSocket();
          
          setTimeout(() => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              const payload = {
                model: selectedModel,
                messages: [...messages, userMessage],
                conversation_id: conversationId,
              };
              ws.current.send(JSON.stringify(payload));
            } else {
              throw new Error('WebSocket connection failed');
            }
          }, 1000); // Wait 1 second for connection
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setError('Failed to send message. Please try again.');
      
      // Clear the loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [conversationId, initializeWebSocket, messages, selectedModel]);

  // Handler for clearing chat
  const handleClearChat = useCallback(() => {
    setMessages([]);
    // Generate a new conversation ID
    const newId = uuidv4();
    setConversationId(newId);
    localStorage.setItem('currentConversationId', newId);
    setError(null);
  }, []);

  // Handler for creating a new chat
  const handleNewChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Close any existing WebSocket connection
      if (ws.current) {
        ws.current.close();
      }
      
      // Create a new conversation
      const response = await createNewConversation();
      const newId = response.conversation_id;
      
      // Update state
      setConversationId(newId);
      setMessages([]);
      localStorage.setItem('currentConversationId', newId);
      
      // Reconnect WebSocket
      ws.current = initializeWebSocket();
      
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating new conversation:', error);
      setError('Failed to create a new conversation');
      setIsLoading(false);
    }
  }, [initializeWebSocket]);

  // Handler for selecting a conversation
  const handleSelectConversation = useCallback(async (id: string) => {
    if (id === conversationId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Close any existing WebSocket connection
      if (ws.current) {
        ws.current.close();
      }
      
      // Update state
      setConversationId(id);
      localStorage.setItem('currentConversationId', id);
      
      // Load conversation history
      const response = await fetchConversationHistory(id);
      if (response.messages && response.messages.length > 0) {
        setMessages(response.messages);
        
        // Scroll to bottom after messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setMessages([]);
      }
      
      // Reconnect WebSocket
      ws.current = initializeWebSocket();
      
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation');
      setIsLoading(false);
    }
  }, [conversationId, initializeWebSocket]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-200 dark:bg-gray-700"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-10 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition duration-200 ease-in-out
        bg-white dark:bg-gray-800 w-64 shadow-lg
      `}>
        <Sidebar
          currentConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Offline GPT</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 justify-center md:justify-end">
              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
              />
              <ThemeToggle />
              <button
                onClick={handleClearChat}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                disabled={isLoading || messages.length === 0}
                aria-label="Clear chat"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </header>
        
        {/* Error banner */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="absolute top-1 right-1 text-red-700"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Welcome to Offline GPT
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Start a conversation with an AI assistant powered by Ollama.
                </p>
                {!selectedModel && (
                  <p className="text-blue-600 dark:text-blue-400 mt-4">
                    Please select a model from the dropdown above to begin.
                  </p>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageItem key={`${index}-${message.content.substring(0, 10)}`} message={message} />
              ))
            )}
            
            {isLoading && (
              <div className="p-4 rounded-lg my-2 message-assistant">
                <div className="font-bold mb-1">Assistant</div>
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Chat Input */}
        <div className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700">
          <div className="container mx-auto max-w-4xl">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading || !selectedModel} 
              placeholder={selectedModel ? "Type a message..." : "Please select a model first"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;