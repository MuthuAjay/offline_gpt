import React, { useEffect, useState, useCallback } from 'react';
import { Conversation } from '../types';
import { fetchConversations, deleteConversation } from '../services/api';

interface SidebarProps {
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentConversationId, 
  onSelectConversation,
  onNewChat
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Improved, safe date formatting function
  const formatDate = (dateString: string): string => {
    try {
      // Ensure we have a valid date string
      if (!dateString || typeof dateString !== 'string') {
        return 'Unknown date';
      }

      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Format the time portion
      const timeString = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      // If the date is today
      if (date.toDateString() === now.toDateString()) {
        return `Today at ${timeString}`;
      }
      
      // If the date is yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${timeString}`;
      }
      
      // If the date is within the current year
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric'
        }) + ` at ${timeString}`;
      }
      
      // Otherwise, return the full date with year
      return date.toLocaleDateString([], { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      }) + ` at ${timeString}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Memoize the loadConversations function to avoid recreating it on each render
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchConversations();
      
      // Sort conversations by timestamp (newest first)
      const sortedConversations = [...response.conversations].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load conversations on mount and when currentConversationId changes
  useEffect(() => {
    loadConversations();
    
    // Set up polling to refresh conversations every minute
    const intervalId = setInterval(() => {
      loadConversations();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [currentConversationId, loadConversations]);

  // Handle conversation deletion
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the conversation selection
    
    try {
      setIsDeleting(id);
      await deleteConversation(id);
      
      // If the current conversation was deleted, trigger new chat
      if (id === currentConversationId) {
        onNewChat();
      }
      
      // Refresh the conversation list
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => 
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 h-full flex flex-col">
      {/* Header with new chat button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Start a new chat"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
              clipRule="evenodd" 
            />
          </svg>
          New Chat
        </button>
      </div>
      
      {/* Search input */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            aria-label="Search conversations"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          {searchTerm && (
            <button
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm m-2 rounded">
          {error}
          <button 
            onClick={() => loadConversations()} 
            className="ml-2 text-red-600 dark:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            {searchTerm ? (
              <div className="text-gray-500 dark:text-gray-400">
                No conversations matching "{searchTerm}"
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                <p>No conversations yet</p>
                <p className="mt-2 text-sm">Start a new chat to begin</p>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-1 px-2 py-2">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                  } relative group`}
                  aria-current={currentConversationId === conversation.id ? 'page' : undefined}
                >
                  <div className="truncate font-medium">{conversation.title || 'Untitled Conversation'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {formatDate(conversation.timestamp)}
                  </div>
                  
                  {/* Delete button - only show on hover or for current conversation */}
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className={`absolute right-2 top-2 p-1 rounded-full ${
                      currentConversationId === conversation.id 
                        ? 'opacity-100' 
                        : 'opacity-0 group-hover:opacity-100'
                    } hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500`}
                    aria-label={`Delete conversation: ${conversation.title}`}
                    disabled={isDeleting === conversation.id}
                  >
                    {isDeleting === conversation.id ? (
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <a 
          href="https://github.com/ollama/ollama" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Powered by Ollama
        </a>
      </div>
    </div>
  );
};

export default Sidebar;