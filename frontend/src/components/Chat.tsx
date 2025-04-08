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
const MAX_RECONNECT_ATTEMPTS = 3; // Maximum number of reconnection attempts

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize WebSocket connection handler with improved error handling
  const initializeWebSocket = useCallback(() => {
    if (!selectedModel) return null;
    
    // Close existing connection if any
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("Closing existing WebSocket connection");
      ws.current.close(1000, "Reconnecting");
    }
    
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    console.log("Creating new WebSocket connection");
    const newWs = createWebSocketConnection();
    
    newWs.onopen = () => {
      console.log('WebSocket connection established');
      setError(null);
      setConnectionAttempts(0); // Reset attempts on successful connection
    };
    
    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
      setIsTyping(false);
      setError('Failed to connect to the server. Please check your network connection.');
    };
    
    newWs.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setIsLoading(false);
      setIsTyping(false);
      
      // Only attempt to reconnect if it wasn't a normal closure and we haven't exceeded max attempts
      if (event.code !== 1000 && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        const nextAttempt = connectionAttempts + 1;
        setConnectionAttempts(nextAttempt);
        console.log(`Attempting to reconnect (${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        // Wait before reconnecting with exponential backoff
        const backoffTime = 1000 * Math.pow(2, connectionAttempts);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`Reconnecting after ${backoffTime}ms delay...`);
          ws.current = initializeWebSocket();
          reconnectTimeoutRef.current = null;
        }, backoffTime);
      } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS && event.code !== 1000) {
        setError('Connection to server was lost. Please refresh the page.');
      }
    };
    
    // WebSocket message handler
    newWs.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          console.error('WebSocket error:', data.error);
          setIsLoading(false);
          setIsTyping(false);
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
          // Show typing indicator
          if (!isTyping) {
            setIsTyping(true);
          }
          
          // THIS IS THE KEY CHANGE - Using the same pattern as your old component
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
                  // Add these for compatibility with the new codebase
                  id: data.message.id || uuidv4(),
                  reactions: [],
                },
              ];
            }
          });
        }
        
        // Set loading to false when we receive the done flag
        if (isDone) {
          console.log("Message stream complete (done flag received)");
          setIsLoading(false);
          setIsTyping(false);
          
          // Clear the loading timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setIsLoading(false);
        setIsTyping(false);
        setError('Failed to process server response. Please try again.');
        
        // Clear the loading timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    };
    
    return newWs;
  }, [selectedModel, connectionAttempts]);

  // Load conversation history when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetchConversationHistory(conversationId);
        if (response.messages && response.messages.length > 0) {
          // Make sure all messages have a reactions array and ID
          const messagesWithReactions = response.messages.map(msg => ({
            ...msg,
            id: msg.id || uuidv4(),
            reactions: msg.reactions || [],
          }));
          setMessages(messagesWithReactions);
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
    
    console.log("Selected model changed, initializing WebSocket");
    ws.current = initializeWebSocket();
    
    // Clean up WebSocket connection when component unmounts or model changes
    return () => {
      if (ws.current) {
        // Use code 1000 for normal closure to avoid reconnection attempts
        console.log("Cleanup: closing WebSocket connection");
        ws.current.close(1000, "Component unmounting or model changing");
        ws.current = null;
      }
      
      // Clear any pending timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [selectedModel, initializeWebSocket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
      id: uuidv4(),
      reactions: [],
    };
    
    console.log("Adding user message:", userMessage);
    // Add to messages for display using the simpler approach from your old component
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Set a timeout to reset loading state in case of issues
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      setIsTyping(false);
      setError('Request timed out. Please try again.');
      loadingTimeoutRef.current = null;
    }, LOADING_TIMEOUT);
    
    // Save conversation ID to localStorage
    localStorage.setItem('currentConversationId', conversationId);
    
    try {
      if (imageBase64) {
        // For multimodal messages, use the REST API
        console.log("Sending multimodal message via REST API");
        
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
        
        // Handle the response using the approach from your old component
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: 'assistant',
            content: response.message.content,
            id: response.message.id || uuidv4(),
            reactions: [],
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
          // Convert Message objects to plain objects for WebSocket, using your old approach
          const plainMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          // Add the new user message
          plainMessages.push({
            role: userMessage.role,
            content: userMessage.content
          });
          
          const payload = {
            model: selectedModel,
            messages: plainMessages,
            conversation_id: conversationId,
          };
          
          console.log("Sending message via WebSocket:", {
            readyState: ws.current.readyState,
            payload
          });
          
          ws.current.send(JSON.stringify(payload));
        } else {
          // If WebSocket is not connected, try to reconnect
          console.log("WebSocket not connected, attempting to reconnect");
          setConnectionAttempts(0); // Reset connection attempts
          ws.current = initializeWebSocket();
          
          setTimeout(() => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              // Use the approach from your old component
              const plainMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
              }));
              
              plainMessages.push({
                role: userMessage.role,
                content: userMessage.content
              });
              
              const payload = {
                model: selectedModel,
                messages: plainMessages,
                conversation_id: conversationId,
              };
              
              console.log("Sending message after reconnect:", payload);
              ws.current.send(JSON.stringify(payload));
            } else {
              console.error("Failed to reconnect WebSocket");
              throw new Error('WebSocket connection failed');
            }
          }, 1000); // Wait 1 second for connection
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setIsTyping(false);
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
        ws.current.close(1000, "Creating new chat"); // Normal closure
      }
      
      // Create a new conversation
      const response = await createNewConversation();
      const newId = response.conversation_id;
      
      // Update state
      setConversationId(newId);
      setMessages([]);
      localStorage.setItem('currentConversationId', newId);
      
      // Reconnect WebSocket
      setConnectionAttempts(0); // Reset connection attempts
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
        ws.current.close(1000, "Switching conversation"); // Normal closure
      }
      
      // Update state
      setConversationId(id);
      localStorage.setItem('currentConversationId', id);
      
      // Load conversation history
      const response = await fetchConversationHistory(id);
      if (response.messages && response.messages.length > 0) {
        // Make sure all messages have a reactions array and ID for the new codebase
        const messagesWithReactions = response.messages.map(msg => ({
          ...msg,
          id: msg.id || uuidv4(),
          reactions: msg.reactions || [],
        }));
        setMessages(messagesWithReactions);
        
        // Scroll to bottom after messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setMessages([]);
      }
      
      // Reconnect WebSocket
      setConnectionAttempts(0); // Reset connection attempts
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

  // Connection status indicator
  const connectionStatus = () => {
    if (!selectedModel) return null;
    
    if (error && error.includes('Connection to server was lost')) {
      return (
        <div className="flex items-center text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
          Disconnected
        </div>
      );
    }
    
    if (connectionAttempts > 0) {
      return (
        <div className="flex items-center text-xs text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-2"></span>
          Reconnecting...
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-xs text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
        Connected
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-neutral-900 dark:text-white">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''} bg-sidebar dark:bg-gray-800 text-white`}>
        <div className="flex flex-col h-full">
          {/* App Header */}
          <div className="p-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center">
              <span className="bg-neutrax-green text-white h-8 w-8 flex items-center justify-center rounded-md mr-2 text-sm font-bold">NT</span>
              OfflineGPT
            </h1>
          </div>
          
          {/* New Chat button */}
          <div className="p-3">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-neutrax-green hover:bg-neutrax-green/90 text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Conversation list */}
          <Sidebar 
            currentConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
          />
          
          {/* Bottom section with settings */}
          <div className="mt-auto border-t border-sidebar-700 p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-neutrax-green/20 flex items-center justify-center text-white">
                  <span className="text-sm font-medium">U</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">User</div>
                  <div className="text-xs text-gray-400">Free Plan</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar overlay (mobile) */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''} bg-black/50 backdrop-blur-sm`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header with model selector and burger menu */}
        <header className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              {/* Hamburger menu for mobile */}
              <button 
                className="mr-3 md:hidden text-neutral-800 dark:text-white hover:text-neutral-900 dark:hover:text-gray-300"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Clear chat button */}
              <button 
                onClick={handleClearChat}
                disabled={isLoading || messages.length === 0}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                  bg-neutral-100 dark:bg-gray-700 text-neutral-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Clear chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear chat
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Connection status indicator */}
              {connectionStatus()}
              
              {/* Model selector */}
              <ModelSelector 
                selectedModel={selectedModel} 
                onModelChange={setSelectedModel}
              />
            </div>
          </div>
        </header>
        
        {/* Chat messages area */}
        <div className="flex-grow overflow-y-auto px-4 md:px-8 py-4 bg-neutral-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-md p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neutrax-green/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutrax-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white">Welcome to OfflineGPT</h2>
                <p className="text-neutral-700 dark:text-gray-300 mb-6">
                  Start a conversation with your local AI assistant. Ask questions, get creative, or discuss ideas.
                </p>
                {!selectedModel && (
                  <div className="text-neutral-800 dark:text-gray-200 bg-neutral-100 dark:bg-gray-700 p-4 rounded-lg mb-4 text-sm border border-neutral-200 dark:border-gray-600">
                    <strong>Please select a model</strong> to start chatting.
                  </div>
                )}
                <div className="text-sm text-neutral-500 dark:text-gray-400 mt-4">
                  Your conversations are stored locally and never leave your device.
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <MessageItem 
                  key={message.id || index} 
                  message={message}
                  isConsecutive={index > 0 && messages[index - 1].role === message.role}
                  index={index}
                  messages={messages}
                  onToggleReaction={(emoji) => {
                    // If your MessageItem component requires this prop but you're not using reactions,
                    // provide a dummy implementation
                    console.log(`Toggle reaction ${emoji} for message ${index}`);
                  }}
                />
              ))}
              
              {isTyping && (
                <div className="flex mb-6">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-neutrax-green to-neutrax-green/90 mr-3 ring-1 ring-neutrax-green/30 shadow-sm">
                    <div className="text-white h-6 w-6 flex items-center justify-center text-xs font-bold drop-shadow-sm">GPT</div>
                  </div>
                  <div className="flex space-x-1 mt-2 px-3 py-2 bg-neutrax-light dark:bg-neutrax-green/10 rounded-bubble animate-fadeIn">
                    <div className="w-2 h-2 bg-neutrax-green rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-neutrax-green rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-neutrax-green rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Chat input area */}
        <div className="bg-white dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading || !selectedModel}
              placeholder="Ask to OfflineGPT anything...."
            />
            <div className="mt-2 text-xs text-neutral-500 dark:text-gray-400 text-center">
              Running on local models. Powered by OfflineGPT v1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;