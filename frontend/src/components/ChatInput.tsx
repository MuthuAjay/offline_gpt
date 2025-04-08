import React, { useState, useRef, KeyboardEvent, useCallback, ChangeEvent } from 'react';
import clsx from 'clsx'; // Optional: for cleaner conditional classes

// Constants for configuration
const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_MAX_TEXTAREA_HEIGHT_PX = 160; // e.g., 10rem if using Tailwind scale
const IMAGE_MIME_PREFIX = 'image/';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string) => void;
  disabled: boolean;
  placeholder?: string;
  maxFileSizeMB?: number;
  maxTextareaHeight?: number; // In pixels
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Ask OfflineGPT...",
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
  maxTextareaHeight = DEFAULT_MAX_TEXTAREA_HEIGHT_PX,
}) => {
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false); // For IME support
  const [fileError, setFileError] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

  // --- Handlers ---

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || imageBase64) && !disabled && !isFileLoading) {
      onSendMessage(trimmedMessage, imageBase64 || undefined);
      setMessage('');
      setImageBase64(null);
      setFileError(null); // Clear any previous file errors
      resetFileInput();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset first
      }
    }
  }, [message, imageBase64, disabled, isFileLoading, onSendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return; // Ignore Enter during IME composition

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      handleSendMessage();
    }
  }, [isComposing, handleSendMessage]);

  const handleTextareaChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // Auto-resize logic
    textarea.style.height = 'auto'; // Reset height to shrink if needed
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, maxTextareaHeight)}px`;
  }, [maxTextareaHeight]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null); // Clear previous errors
    setImageBase64(null); // Clear previous image if selecting a new one

    const file = e.target.files?.[0];

    // Always reset the input value here so user can re-select same file after error/removal
    // This must happen *after* we get the 'file' reference.
    resetFileInput();

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
      setFileError(`Invalid file type. Please select an image (${IMAGE_MIME_PREFIX}*).`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      setFileError(`Image size exceeds ${maxFileSizeMB}MB limit.`);
      return;
    }

    // Read and convert file
    const reader = new FileReader();
    setIsFileLoading(true);

    reader.onloadend = () => {
      try {
        const base64String = reader.result as string;
        // Ensure result is a valid string and contains the comma
        if (typeof base64String === 'string' && base64String.includes(',')) {
             const base64Data = base64String.split(',')[1]; // Remove data URL prefix (e.g., "data:image/png;base64,")
             setImageBase64(base64Data);
             setFileError(null); // Clear error on success
        } else {
             throw new Error("Invalid file data received.")
        }
      } catch (error) {
           console.error("Error processing file:", error);
           setFileError("Could not read the image file.");
           setImageBase64(null);
      } finally {
           setIsFileLoading(false);
      }

    };

    reader.onerror = () => {
      console.error("FileReader error");
      setFileError("Failed to read the file.");
      setIsFileLoading(false);
      setImageBase64(null);
    };

    reader.readAsDataURL(file); // Start reading

  }, [maxSizeBytes, maxFileSizeMB]);

  const removeImage = useCallback(() => {
    setImageBase64(null);
    setFileError(null);
    resetFileInput();
  }, []);

  // --- Derived State ---
  const canSendMessage = (message.trim().length > 0 || !!imageBase64) && !disabled && !isFileLoading;

  // --- Render ---
  return (
    <div className="flex flex-col w-full px-2 pb-2 md:px-4 md:pb-3">
      {/* Image Preview & Error Area */}
      <div className="mb-2 flex flex-col items-start">
         {imageBase64 && !fileError && (
            <div className="relative group">
                <img
                    src={`data:image/jpeg;base64,${imageBase64}`} // Assuming JPEG, adjust if needed or detect type
                    alt="Preview"
                    className="max-h-28 w-auto rounded-lg object-contain border border-neutral-200 dark:border-gray-600 bg-neutral-50 dark:bg-gray-700/50"
                />
                <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-0.5 shadow text-neutral-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:scale-110 transition-all opacity-70 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="Remove image"
                    title="Remove image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
         )}
          {/* File Error Display */}
          {fileError && (
            <p id="file-error-message" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
              {fileError}
            </p>
          )}
      </div>

      {/* Input Area */}
      <div className={clsx(
          "flex items-end rounded-xl border bg-white dark:bg-gray-800 transition-colors duration-150",
          "focus-within:border-primary/80 dark:focus-within:border-primary-dark/80 focus-within:ring-1 focus-within:ring-primary/50 dark:focus-within:ring-primary-dark/50",
          fileError ? "border-red-500 dark:border-red-400" : "border-neutral-200 dark:border-gray-700",
          disabled && "opacity-70 bg-neutral-50 dark:bg-gray-800/50"
      )}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="flex-grow pl-4 pr-2 py-3 text-sm md:text-base bg-transparent outline-none resize-none text-neutral-900 dark:text-gray-100 placeholder-neutral-500 dark:placeholder-gray-400 min-h-[50px] scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-gray-600"
          style={{ maxHeight: `${maxTextareaHeight}px` }} // Apply max height via style
          placeholder={placeholder}
          rows={1}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={disabled || isFileLoading}
          aria-label="Message input"
          aria-describedby={fileError ? "file-error-message" : undefined}
        />

        {/* Action Buttons */}
        <div className="flex items-center self-end pb-2 pr-2 pl-1">
          {/* File Upload Button */}
          <label
            className={clsx(
                "p-2 rounded-full transition-colors duration-150 cursor-pointer",
                disabled || isFileLoading
                    ? "text-neutral-400 dark:text-gray-600 cursor-not-allowed"
                    : "text-neutral-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light hover:bg-primary/10 dark:hover:bg-primary-dark/20",
                isFileLoading && "animate-pulse"
            )}
            htmlFor="chat-file-input"
            title={isFileLoading ? "Reading file..." : "Attach image"}
            aria-label={isFileLoading ? "Reading image file..." : "Attach image"}
          >
            {isFileLoading ? (
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
            )}
            <input
              id="chat-file-input" // Match label's htmlFor
              type="file"
              accept="image/*" // Be specific
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={disabled || isFileLoading}
              aria-describedby={fileError ? "file-error-message" : undefined}
            />
          </label>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSendMessage}
            className={clsx(
              "ml-1 p-2 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary dark:focus-visible:ring-offset-gray-800",
              canSendMessage
                ? "bg-primary text-white hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light scale-100"
                : "bg-neutral-200 dark:bg-gray-600 text-neutral-400 dark:text-gray-400 cursor-not-allowed scale-95",
               disabled && !isFileLoading && "cursor-wait" // Specific cursor when app is processing
            )}
            disabled={!canSendMessage}
            aria-label="Send message"
            title="Send message (Enter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: canSendMessage ? 'rotate(0deg)' : 'rotate(0deg)' }}> {/* Keep icon static for simplicity */}
              {/* Arrow Up Icon */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Optional: Processing message indication */}
      {disabled && (message.trim() || imageBase64) && (
        <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1 ml-2">
          OfflineGPT is thinking...
        </p>
      )}
    </div>
  );
};

export default ChatInput;