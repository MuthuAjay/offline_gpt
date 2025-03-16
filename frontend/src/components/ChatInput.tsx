import React, { useState, KeyboardEvent } from 'react';
import ImageUploader from './ImageUploader';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleSendMessage = () => {
    if ((message.trim() || imageBase64) && !disabled) {
      onSendMessage(message, imageBase64 || undefined);
      setMessage('');
      setImageBase64(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUploaded = (base64Data: string) => {
    setImageBase64(base64Data);
  };

  return (
    <div className="flex flex-col w-full">
      {imageBase64 && (
        <div className="mb-2 relative">
          <img 
            src={`data:image/jpeg;base64,${imageBase64}`} 
            alt="Uploaded" 
            className="h-20 rounded-md object-cover"
          />
          <button
            onClick={() => setImageBase64(null)}
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex items-end border rounded-lg bg-white dark:bg-gray-700 p-2">
        <textarea
          className="flex-grow px-3 py-2 bg-transparent outline-none resize-none dark:text-white"
          placeholder="Type your message..."
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="flex items-center">
          <ImageUploader onImageUploaded={handleImageUploaded} disabled={disabled} />
          <button
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            disabled={(!message.trim() && !imageBase64) || disabled}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 