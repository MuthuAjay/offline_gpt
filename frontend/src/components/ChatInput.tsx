import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { Send, Image as ImageIcon, Search, X, Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string, customSearchQuery?: string) => void;
  disabled: boolean;
  placeholder?: string;
  showSearchInput?: boolean;
  webSearchEnabled?: boolean;
  onToggleWebSearch?: () => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Type your message...",
  showSearchInput = false,
  webSearchEnabled = false,
  onToggleWebSearch,
  isLoading = false
}) => {
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [showCustomSearch, setShowCustomSearch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Add effect to handle web search state changes
  useEffect(() => {
    if (webSearchEnabled && !showCustomSearch) {
      setShowCustomSearch(false);
    }
  }, [webSearchEnabled]);

  const handleSendMessage = () => {
    if ((message.trim() || imageBase64) && !disabled) {
      const searchQuery = (showSearchInput && showCustomSearch && customSearchQuery.trim()) 
        ? customSearchQuery.trim() 
        : undefined;
        
      onSendMessage(message, imageBase64 || undefined, searchQuery);
      setMessage('');
      setImageBase64(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUploaded = async (base64Data: string) => {
    try {
      setIsUploading(true);
      setImageBase64(base64Data);
      toast({
        title: "Image uploaded",
        description: "Your image has been attached to the message.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSearchQuery(e.target.value);
  };

  return (
    <div className="relative">
      <TooltipProvider>
        {/* Custom search input */}
        <AnimatePresence>
          {showSearchInput && showCustomSearch && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-2"
            >
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={customSearchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Enter custom search query..."
                  className="w-full px-4 py-2 pr-10 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={disabled}
                />
                <button
                  onClick={() => setShowCustomSearch(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image preview */}
        <AnimatePresence>
          {imageBase64 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 relative"
            >
              <div className="relative inline-block">
                <img
                  src={`data:image/jpeg;base64,${imageBase64}`}
                  alt="Uploaded"
                  className="h-20 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-lg border hover:bg-muted transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input area */}
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 pr-32 text-sm bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* Web search toggle */}
              {onToggleWebSearch && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={webSearchEnabled ? "default" : "ghost"}
                      size="icon"
                      onClick={onToggleWebSearch}
                      className={`h-8 w-8 transition-colors duration-200 ${
                        webSearchEnabled 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                          : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                      disabled={disabled}
                    >
                      <Search className={`w-4 h-4 ${webSearchEnabled ? "animate-pulse" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {webSearchEnabled 
                        ? "Web search is enabled. The AI will search the web for up-to-date information."
                        : "Enable web search to allow the AI to search the web for current information."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Image upload button */}
              <ImageUploader
                onImageUploaded={handleImageUploaded}
                disabled={disabled || isUploading}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={disabled || isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </Button>
              </ImageUploader>
            </div>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={disabled || (!message.trim() && !imageBase64)}
            className="h-11 px-4"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>

        {/* Web search status */}
        {webSearchEnabled && !isLoading && (
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => setShowCustomSearch(!showCustomSearch)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              disabled={disabled}
            >
              <Search className="w-3 h-3" />
              {showCustomSearch ? 'Hide custom search' : 'Add custom search'}
            </button>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Search className={`w-3 h-3 ${webSearchEnabled ? "animate-pulse" : ""}`} />
              Web search enabled
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
};

export default ChatInput;