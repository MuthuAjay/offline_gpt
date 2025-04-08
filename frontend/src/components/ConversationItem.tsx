// src/components/ConversationItem.tsx
import React from 'react';
import { Conversation } from '../types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({
  conversation,
  isSelected,
  isDeleting,
  onSelect,
  onDelete,
}) => {
  return (
    <li>
      <button
        type="button"
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ease-in-out flex items-center justify-between group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-sidebar-900 ${
          isSelected
            ? 'bg-sidebar-700 text-white'
            : 'text-gray-300 hover:bg-sidebar-800 hover:text-white'
        }`}
        onClick={() => onSelect(conversation.id)}
        aria-current={isSelected ? 'page' : undefined} // Better accessibility for current item
      >
        <span className="truncate pr-8">{conversation.title}</span> {/* Add padding to prevent overlap */}
        
        {/* Delete Button Container - positioned absolutely */}
        <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ease-in-out ${isSelected ? 'group-hover:opacity-100' : ''}`}>
            <button
            type="button"
            className={`p-1 rounded-full ${
                isSelected ? 'text-white hover:bg-sidebar-600' : 'text-gray-400 hover:text-white hover:bg-sidebar-700'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-white`}
            onClick={(e) => onDelete(conversation.id, e)}
            disabled={isDeleting}
            aria-label={`Delete conversation: ${conversation.title}`}
            >
            {isDeleting ? (
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            )}
            </button>
        </div>
      </button>
    </li>
  );
}); // Use React.memo for performance if props don't change often

export default ConversationItem;