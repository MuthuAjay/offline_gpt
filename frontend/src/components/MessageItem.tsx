import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: Message;
  isSearchEnabled?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isSearchEnabled = false }) => {
  const isUser = message.role === 'user';
  
  // Function to highlight search results and citations
  const highlightSearchContent = (content: string) => {
    // Check if this looks like a message with search results
    const hasSearchResults = 
      !isUser && 
      isSearchEnabled && 
      (content.includes("Search results:") || 
       content.includes("I found") || 
       content.includes("According to") ||
       content.match(/\[(\d+)\]:/g) || // Citation pattern [1]:
       content.match(/\(https?:\/\/[^\s)]+\)/g)); // URL pattern
       
    if (!hasSearchResults) {
      return content;
    }
    
    // Add special styling for search content in the final rendered markdown
    return content
      // Add class to citation numbers [1], [2], etc.
      .replace(/\[(\d+)\]/g, '[$1]{.search-citation}')
      // Add class to URLs
      .replace(/(https?:\/\/[^\s]+)/g, '[$1]{.search-url}')
      // Add class to search result sections
      .replace(/(Search results for:.*?)(?=\n\n|\n##|\n###|$)/gs, '$1{.search-results-section}')
      .replace(/(According to .*?)(?=\n\n|\n##|\n###|$)/gs, '$1{.search-source-citation}');
  };

  // Detect if content contains search results for specific styling
  const isSearchResults = 
    !isUser && 
    isSearchEnabled && 
    (message.content.includes("Search results:") || 
     message.content.includes("I found") || 
     message.content.includes("According to") ||
     message.content.match(/\[(\d+)\]:/g) || 
     message.content.match(/\(https?:\/\/[^\s)]+\)/g));

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'} mb-4`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-indigo-100 dark:bg-indigo-900'
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          {isUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
        </div>
        
        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-1 flex items-center gap-2">
            {isUser ? 'You' : 'Assistant'}
            
            {!isUser && isSearchEnabled && isSearchResults && (
              <span className="web-search-indicator">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Web Search
              </span>
            )}
          </div>
          
          <div className={`prose dark:prose-invert max-w-none ${
            // Add special styling if this is a message with search results
            (isSearchResults) ? 'search-enhanced-content' : ''
          }`}>
            <ReactMarkdown>
              {isSearchEnabled && !isUser 
                ? highlightSearchContent(message.content) 
                : message.content
              }
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;