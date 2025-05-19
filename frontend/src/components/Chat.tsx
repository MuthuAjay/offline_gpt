import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ContentPart, MultimodalMessage } from '../types';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import ThemeToggle from './ThemeToggle';
import { 
  createWebSocketConnection, 
  createEnhancedWebSocketConnection,
  fetchConversationHistory, 
  createNewConversation, 
  sendMultimodalChatRequest, 
  webSearch
} from '../services/api';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Search, Image as ImageIcon } from 'lucide-react';
import WallpaperPicker from './WallpaperPicker';

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
  
  // Web search related state
  const [useWebSearch, setUseWebSearch] = useState(() => {
    const saved = localStorage.getItem('useWebSearch');
    return saved === 'true';
  });
  const [searchStatus, setSearchStatus] = useState<string>('');
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wallpaper, setWallpaper] = useState<string | null>(() => {
    return localStorage.getItem('chatWallpaper') || null;
  });
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  // Initialize WebSocket connection handler
  const initializeWebSocket = useCallback(() => {
    if (!selectedModel) return null;
    
    // Close existing connection if any
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    
    // Use enhanced WebSocket if web search is enabled
    const newWs = useWebSearch ? createEnhancedWebSocketConnection() : createWebSocketConnection();
    
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
        
        // Handle web search status updates
        if (data.status) {
          if (data.status === 'searching') {
            setSearchStatus(`Searching the web for: ${data.message?.split(':')[1] || 'information'}`);
          } 
          else if (data.status === 'search_complete') {
            if (data.results_count && data.results_count > 0) {
              setSearchStatus(`Found ${data.results_count} results. Generating response...`);
            } else {
              setSearchStatus('No search results found. Using model knowledge...');
            }
          }
          else if (data.status === 'generating') {
            setSearchStatus('Generating response...');
          }
          else if (data.status === 'search_error') {
            setSearchStatus(`Search error: ${data.error || 'Unknown error'}`);
            setError(`Search error: ${data.error || 'Unknown error'}`);
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
          setSearchStatus('');
          
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
  }, [selectedModel, useWebSearch]);

  // Save web search preference to localStorage
  useEffect(() => {
    localStorage.setItem('useWebSearch', useWebSearch.toString());
  }, [useWebSearch]);

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

  // Initialize or reinitialize WebSocket when model changes or web search setting changes
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
  }, [selectedModel, useWebSearch, initializeWebSocket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handler for sending messages
  const handleSendMessage = useCallback(async (content: string, imageBase64?: string, customSearchQuery?: string) => {
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
          
          // Add web search parameters if enabled
          if (useWebSearch) {
            Object.assign(payload, {
              use_web_search: true,
              web_search_query: customSearchQuery || content
            });
            
            // Update search status
            setSearchStatus('Preparing to search...');
          }
          
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
              
              // Add web search parameters if enabled
              if (useWebSearch) {
                Object.assign(payload, {
                  use_web_search: true,
                  web_search_query: customSearchQuery || content
                });
                
                // Update search status
                setSearchStatus('Preparing to search...');
              }
              
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
  }, [conversationId, initializeWebSocket, messages, selectedModel, useWebSearch]);

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

  // Toggle web search feature
  const toggleWebSearch = useCallback(() => {
    try {
      // Close existing WebSocket connection
      if (ws.current) {
        ws.current.close();
      }
      
      // Toggle web search state
      const newState = !useWebSearch;
      setUseWebSearch(newState);
      
      // Update localStorage
      localStorage.setItem('useWebSearch', newState.toString());
      
      // Reconnect WebSocket with new settings
      setTimeout(() => {
        ws.current = initializeWebSocket();
      }, 100);
    } catch (error) {
      console.error('Error toggling web search:', error);
      setError('Failed to toggle web search. Please try again.');
    }
  }, [useWebSearch, initializeWebSocket]);

  // Handler for wallpaper change
  const handleWallpaperChange = (img: string | null) => {
    setWallpaper(img);
    if (img) {
      localStorage.setItem('chatWallpaper', img);
    } else {
      localStorage.removeItem('chatWallpaper');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        currentConversationId={conversationId}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Wallpaper background */}
        {wallpaper && (
          <>
            <div className="absolute inset-0 z-0">
              <img
                src={wallpaper}
                alt="Chat wallpaper"
                className="w-full h-full object-cover object-center"
                style={{ filter: 'brightness(0.5) blur(0px)' }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          </>
        )}
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b bg-card relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-muted rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowWallpaperPicker(true)}
              title="Set chat wallpaper"
              className="hover:bg-cosmic-pink/20"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        {/* Wallpaper Picker Modal */}
        {showWallpaperPicker && (
          <WallpaperPicker
            currentWallpaper={wallpaper}
            onChange={handleWallpaperChange}
            onClose={() => setShowWallpaperPicker(false)}
          />
        )}
        {/* Chat messages area */}
        <div className="flex-grow overflow-y-auto px-4 md:px-8 py-4 bg-white dark:bg-gray-900 relative z-10" style={wallpaper ? { background: 'transparent' } : {}}>
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
                {useWebSearch && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4 text-sm text-blue-600 dark:text-blue-400">
                    <strong>Web search is enabled!</strong> Your AI can now search the web for information.
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
                  isSearchEnabled={useWebSearch}
                />
              ))}
              {isLoading && (
                <div className="search-status my-4">
                  {searchStatus ? (
                    <div className="flex items-center">
                      <div className="search-status-spinner"></div>
                      <div className="text-sm">{searchStatus}</div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="search-status-spinner"></div>
                      <div className="text-sm">Processing your request...</div>
                    </div>
                  )}
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
              placeholder={
                !selectedModel 
                  ? "Please select a model to start chatting" 
                  : useWebSearch 
                    ? "Ask anything (web search enabled)..." 
                    : "Type your message..."
              }
              showSearchInput={useWebSearch}
              webSearchEnabled={useWebSearch}
              onToggleWebSearch={toggleWebSearch}
              isLoading={isLoading}
            />
            {useWebSearch && !isLoading && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                Web search powered by DuckDuckGo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;