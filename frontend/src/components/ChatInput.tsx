import React, { useState, KeyboardEvent, useRef } from 'react';
import ImageUploader from './ImageUploader';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string, customSearchQuery?: string) => void;
  disabled: boolean;
  placeholder?: string;
  showSearchInput?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Type your message...",
  showSearchInput = false
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
        <div className="mb-2 flex items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
          <div className="flex-grow flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              ref={searchInputRef}
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-blue-700 dark:text-blue-300 placeholder-blue-400 dark:placeholder-blue-500"
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
      <div className="flex items-end border rounded-lg bg-white dark:bg-gray-700 p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-opacity-50 transition">
        <textarea
          ref={textareaRef}
          className="flex-grow px-3 py-2 bg-transparent outline-none resize-none dark:text-white min-h-[50px]"
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
        <div className="flex items-center">
          {/* Search toggle button (only visible when web search is enabled) */}
          {showSearchInput && (
            <button
              type="button"
              className={`p-2 rounded-full mr-1 ${
                showCustomSearch
                  ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700'
              }`}
              onClick={toggleCustomSearch}
              title={showCustomSearch ? "Hide search options" : "Show search options"}
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
          
          {/* Image uploader */}
          <ImageUploader onImageUploaded={handleImageUploaded} disabled={disabled} />
          
          {/* Send button */}
          <button
            type="button"
            className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleSendMessage}
            disabled={(!message.trim() && !imageBase64) || disabled}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
      
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