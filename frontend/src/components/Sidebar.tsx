import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Conversation } from '../types';
import { fetchConversations, deleteConversation } from '../services/api';
import { groupConversationsByMonth } from '../utils/SidebarUtils'; // Adjust path if needed
import ConversationItem from './ConversationItem'; // Adjust path if needed

// Constants
const POLLING_INTERVAL_MS = 60 * 1000; // 1 minute
const SEARCH_DEBOUNCE_MS = 250; // Optional: Debounce search input

interface SidebarProps {
  currentConversationId: string | null; // Allow null if no conversation is selected
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewChat
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Renamed for clarity
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null); // Renamed for clarity

  // --- Data Fetching ---

  const loadConversations = useCallback(async (isRetry = false) => {
    // Clear error only when explicitly retrying or starting fresh
    if (isRetry) {
        setError(null);
    }
    // Don't set loading to true if just polling in the background,
    // only show initial loading indicator.
    if (conversations.length === 0 && !isRetry) {
        setIsLoading(true);
    }

    try {
      const response = await fetchConversations();
      // Sort conversations by timestamp (newest first) - ensure stability
      const sortedConversations = [...response.conversations].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setConversations(sortedConversations);
       // Clear error on successful fetch
       if (error) setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      // Avoid overriding existing error if polling fails silently
      if (!error || isRetry) {
         setError('Failed to load conversations. Please check your connection.');
      }
    } finally {
      // Ensure loading is false after initial load or retry attempt
       if (isLoading || isRetry) {
           setIsLoading(false);
       }
    }
  }, [error, isLoading, conversations.length]); // Include error, isLoading, conversations.length to manage state updates correctly

  // Initial load and polling
  useEffect(() => {
    loadConversations(); // Initial load

    // Set up polling to refresh conversations periodically.
    // Note: This is a basic strategy. For real-time updates,
    // consider WebSockets or Server-Sent Events if available.
    const intervalId = setInterval(() => {
      console.log('Polling for conversation updates...'); // Optional: for debugging
      loadConversations(); // Fetch updates without showing main loading spinner
    }, POLLING_INTERVAL_MS);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [loadConversations]); // Run only when loadConversations reference changes (rarely, due to useCallback)

  // --- Deletion ---

  const handleDeleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation

    // Optional: Add a confirmation dialog
    // if (!window.confirm('Are you sure you want to delete this conversation?')) {
    //   return;
    // }

    setDeletingId(id);
    setError(null); // Clear previous errors

    try {
      await deleteConversation(id);

      // If the deleted conversation was the active one, start a new chat
      if (id === currentConversationId) {
        onNewChat();
        // No need to manually remove from local state if loadConversations is called next
      }

      // Refresh the list after successful deletion
      await loadConversations(true); // Pass true to indicate it's a deliberate refresh/retry

    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation.');
    } finally {
      setDeletingId(null);
    }
  }, [currentConversationId, onNewChat, loadConversations]);

  // --- Filtering and Grouping (Memoized) ---

  const filteredConversations = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      return conversations; // No filter applied
    }
    return conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [conversations, searchTerm]);

  const groupedConversations = useMemo(() => {
    return groupConversationsByMonth(filteredConversations);
  }, [filteredConversations]);

  // --- Rendering ---

  const renderContent = () => {
    if (isLoading && conversations.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400 flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading conversations...
        </div>
      );
    }

    if (!isLoading && filteredConversations.length === 0) {
       return (
          <div className="text-center py-8 px-4 text-gray-400">
            {searchTerm
              ? `No conversations found matching "${searchTerm}".`
              : 'No conversations yet. Start a new chat!'}
          </div>
        );
    }

    const groupKeys = Object.keys(groupedConversations); // Get keys to map over

    return groupKeys.map((month) => (
      <div key={month} className="mb-4">
        <div className="px-2 py-1 mb-1 sticky top-0 bg-sidebar-900 z-10"> {/* Optional: Sticky header */}
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            {month}
          </h2>
        </div>
        <ul className="space-y-1">
          {groupedConversations[month].map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === currentConversationId}
              isDeleting={deletingId === conversation.id}
              onSelect={onSelectConversation}
              onDelete={handleDeleteConversation}
            />
          ))}
        </ul>
      </div>
    ));
  };

  return (
    // Use a more semantic element like <nav> if appropriate for the sidebar's role
    <div className="flex-1 overflow-y-auto pb-4 bg-sidebar-900 flex flex-col">
        {/* Search input Area */}
        <div className="p-3 sticky top-0 bg-sidebar-900 z-20 border-b border-sidebar-700"> {/* Sticky Search */}
            <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                 <svg
                    className="h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true" // Icon is decorative
                >
                    <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                    />
                </svg>
            </span>
            <input
                type="search" // Use type="search" for better semantics
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full block px-3 py-2 pl-10 bg-sidebar-800 text-white border border-sidebar-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out"
                aria-label="Search conversations"
            />
            {searchTerm && (
                <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white focus:outline-none"
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

       {/* Error Message Display */}
       {error && (
         <div className="p-2 mx-3 my-2 bg-red-900/50 text-red-200 text-sm rounded-lg flex justify-between items-center">
           <span>{error}</span>
           <button
             type="button"
             onClick={() => loadConversations(true)} // Pass true for retry
             className="ml-2 px-2 py-0.5 text-red-100 underline hover:text-white rounded hover:bg-red-800/50 focus:outline-none focus:ring-1 focus:ring-red-300"
             disabled={isLoading} // Disable retry while loading
           >
             Retry
           </button>
         </div>
       )}

      {/* Conversation List Area */}
      <div className="flex-1 overflow-y-auto px-2 pb-4"> {/* Add padding to list area */}
          {renderContent()}
      </div>
    </div>
  );
};

export default Sidebar;