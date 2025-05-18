import React, { useState, KeyboardEvent, useRef } from 'react';
import ImageUploader from './ImageUploader';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string, customSearchQuery?: string) => void;
  disabled: boolean;
  placeholder?: string;
  showSearchInput?: boolean;
  webSearchEnabled?: boolean;
  onToggleWebSearch?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Type your message...",
  showSearchInput = false,
  webSearchEnabled = false,
  onToggleWebSearch
}) => {
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [showCustomSearch, setShowCustomSearch] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if ((message.trim() || imageBase64) && !disabled) {
      // Pass the custom search query if it's enabled and not empty
      const searchQuery = (showSearchInput && showCustomSearch && customSearchQuery.trim()) 
        ? customSearchQuery.trim() 
        : undefined;
        
      onSendMessage(message, imageBase64 || undefined, searchQuery);
      setMessage('');
      setImageBase64(null);
      
      // Don't clear the custom search query after sending
      // so users can use the same search query for multiple messages
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUploaded = (base64Data: string) => {
    setImageBase64(base64Data);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSearchQuery(e.target.value);
  };

  const toggleCustomSearch = () => {
    setShowCustomSearch(!showCustomSearch);
    // Focus the search input when it becomes visible
    if (!showCustomSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      // Focus back on the main textarea when hiding search
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Custom search input */}
      {showSearchInput && showCustomSearch && (
        <div className="web-search-input-container custom-search-input-container mb-2">
          <div className="flex items-center px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              ref={searchInputRef}
              className="web-search-input flex-grow"
              placeholder="Custom search query (optional)"
              value={customSearchQuery}
              onChange={handleSearchInputChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
      
      {/* Image preview */}
      {imageBase64 && (
        <div className="mb-2 relative">
          <img
            src={`data:image/jpeg;base64,${imageBase64}`}
            alt="Uploaded"
            className="h-20 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={() => setImageBase64(null)}
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-colors"
            aria-label="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Main input area */}
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={placeholder}
          rows={1}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={disabled}
          aria-label="Message input"
        />
        <div className="chat-input-actions">
          {/* Web search toggle button */}
          {onToggleWebSearch && (
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`chat-input-button web-search-toggle ${webSearchEnabled ? 'active' : ''}`}
              title={webSearchEnabled ? "Disable web search" : "Enable web search"}
              aria-label={webSearchEnabled ? "Web search enabled" : "Web search disabled"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>
          )}
          
          {/* Custom search query toggle - only visible when web search is enabled */}
          {showSearchInput && webSearchEnabled && (
            <button
              type="button"
              className={`chat-input-button ${showCustomSearch ? 'active' : ''}`}
              onClick={toggleCustomSearch}
              title={showCustomSearch ? "Hide search options" : "Show search options"}
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                {showCustomSearch ? (
                  <path fillRule="evenodd" d="M4 8a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z" clipRule="evenodd" />
                )}
              </svg>
            </button>
          )}
          
          {/* Image uploader */}
          <ImageUploader onImageUploaded={handleImageUploaded} disabled={disabled} />
          
          {/* Send button */}
          <button
            type="button"
            className="send-button"
            onClick={handleSendMessage}
            disabled={(!message.trim() && !imageBase64) || disabled}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
      
      {/* Web search indicator */}
      {webSearchEnabled && !disabled && (
        <div className="web-search-badge mt-2 ml-1">
          <span className="dot"></span>
          <span>Web search enabled</span>
        </div>
      )}
      
      {/* Status message */}
      {disabled && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-2">
          {message.trim() || imageBase64 ? "Processing your request..." : ""}
        </p>
      )}
    </div>
  );
};

export default ChatInput;