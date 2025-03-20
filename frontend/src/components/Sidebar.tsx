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

  // Group conversations by month
  const groupConversationsByMonth = (convs: Conversation[]) => {
    const grouped: { [key: string]: Conversation[] } = {};
    
    convs.forEach(conv => {
      const date = new Date(conv.timestamp);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(conv);
    });
    
    return grouped;
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
  
  // Group the filtered conversations by month
  const groupedConversations = groupConversationsByMonth(filteredConversations);

  return (
    <div className="flex-1 overflow-y-auto pb-4">      
      {/* Search input */}
      <div className="px-3 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-8 bg-sidebar-800 text-white border border-sidebar-700 rounded-lg text-sm focus:outline-none"
            aria-label="Search conversations"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
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
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
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
        <div className="p-2 mx-3 mb-2 bg-red-900/30 text-red-200 text-sm rounded-lg">
          {error}
          <button 
            onClick={() => loadConversations()} 
            className="ml-2 text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Conversation list by month */}
      <div className="px-2">
        {loading && conversations.length === 0 ? (
          <div className="text-center py-4 text-gray-400 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            {searchTerm ? (
              <div className="text-gray-400">
                No conversations matching "{searchTerm}"
              </div>
            ) : (
              <div className="text-gray-400">
                No conversations yet.<br />
                Start a new chat to begin.
              </div>
            )}
          </div>
        ) : (
          Object.entries(groupedConversations).map(([month, monthConversations]) => (
            <div key={month} className="mb-4">
              <div className="px-2 py-1 mb-1">
                <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  {month.toUpperCase()}
                </h2>
              </div>
              <ul className="space-y-1">
                {monthConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                        conversation.id === currentConversationId
                          ? 'bg-sidebar-700 text-white'
                          : 'text-gray-300 hover:bg-sidebar-800'
                      }`}
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      <span className="truncate">{conversation.title}</span>
                      <button
                        className={`p-1 rounded-full opacity-0 group-hover:opacity-100 ${
                          conversation.id === currentConversationId ? 'text-white hover:bg-sidebar-600' : 'text-gray-400 hover:bg-sidebar-700'
                        } transition-opacity`}
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        disabled={isDeleting === conversation.id}
                        aria-label="Delete conversation"
                      >
                        {isDeleting === conversation.id ? (
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;