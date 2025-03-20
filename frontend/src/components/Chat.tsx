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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''} shadow-lg`}>
        <Sidebar 
          currentConversationId={conversationId}
          onSelectConversation={(id) => {
            setConversationId(id);
            localStorage.setItem('currentConversationId', id);
            setSidebarOpen(false); // Close sidebar on mobile after selection
          }}
          onNewChat={() => {
            const newId = uuidv4();
            createNewConversation(newId)
              .then(() => {
                setConversationId(newId);
                localStorage.setItem('currentConversationId', newId);
                setMessages([]);
                setSidebarOpen(false); // Close sidebar on mobile after new chat
              })
              .catch(err => {
                console.error('Error creating new conversation:', err);
                setError('Failed to create new conversation');
              });
          }}
        />
      </div>
      
      {/* Sidebar overlay (mobile) */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header with model selector and burger menu */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              {/* Hamburger menu for mobile */}
              <button 
                className="mr-3 md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo or brand name */}
              <h1 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                OfflineGPT
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Model selector */}
              <ModelSelector 
                selectedModel={selectedModel} 
                onModelChange={setSelectedModel}
              />
              
              {/* Theme toggle */}
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        {/* Chat messages area */}
        <div className="flex-grow overflow-y-auto px-4 md:px-8 py-4 bg-white dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-md p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Welcome to OfflineGPT</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Start a conversation with your local AI assistant. Ask questions, get creative, or discuss ideas.
                </p>
                {!selectedModel && (
                  <div className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg mb-4 text-sm">
                    <strong>Please select a model</strong> to start chatting.
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Your conversations are stored locally and never leave your device.
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <MessageItem 
                  key={index} 
                  message={message}
                />
              ))}
              {isLoading && (
                <div className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                  <div className="flex items-center">
                    <div className="h-4 w-4 mr-2 rounded-full bg-indigo-400 dark:bg-indigo-600"></div>
                    <div className="h-4 flex-grow rounded bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Chat input area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading || !selectedModel}
              placeholder={selectedModel ? "Type your message..." : "Please select a model to start chatting"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;