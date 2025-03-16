import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import ThemeToggle from './ThemeToggle';
import { createWebSocketConnection, fetchConversationHistory } from '../services/api';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [conversationId, setConversationId] = useState<string>(() => {
    // Generate a new conversation ID or use one from localStorage
    const savedId = localStorage.getItem('currentConversationId');
    return savedId || uuidv4();
  });
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Load conversation history if available
    const loadHistory = async () => {
      try {
        console.log('Loading conversation history for ID:', conversationId);
        const response = await fetchConversationHistory(conversationId);
        console.log('History response:', response);
        if (response.messages && response.messages.length > 0) {
          setMessages(response.messages);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    };

    loadHistory();

    // Setup WebSocket
    console.log('Creating WebSocket connection...');
    ws.current = createWebSocketConnection();
    
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          console.error('WebSocket error:', data.error);
          return;
        }
        
        if (data.message && data.message.content) {
          console.log('Updating messages with new content');
          setMessages(prevMessages => {
            // Check if we already have a response message from the assistant
            const lastMessage = prevMessages[prevMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant') {
              // Update the last message
              return [
                ...prevMessages.slice(0, -1),
                {
                  ...lastMessage,
                  content: data.message.content,
                },
              ];
            } else {
              // Add a new message
              return [
                ...prevMessages,
                {
                  role: 'assistant',
                  content: data.message.content,
                },
              ];
            }
          });
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      if (ws.current) {
        console.log('Closing WebSocket connection');
        ws.current.close();
      }
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!selectedModel) {
      alert('Please select a model first');
      return;
    }
    
    console.log('Sending message with model:', selectedModel);
    
    const userMessage: Message = {
      role: 'user',
      content,
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    // Save conversation ID to localStorage
    localStorage.setItem('currentConversationId', conversationId);
    
    // Send message via WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        model: selectedModel,
        messages: [...messages, userMessage],
        conversation_id: conversationId,
      };
      console.log('Sending WebSocket payload:', payload);
      ws.current.send(JSON.stringify(payload));
    } else {
      console.error('WebSocket is not connected. ReadyState:', ws.current?.readyState);
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    // Generate a new conversation ID
    const newId = uuidv4();
    setConversationId(newId);
    localStorage.setItem('currentConversationId', newId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Offline GPT</h1>
          <div className="flex items-center space-x-4">
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
            <ThemeToggle />
            <button
              onClick={handleClearChat}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </header>
      
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
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageItem key={index} message={message} />
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
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Chat; 