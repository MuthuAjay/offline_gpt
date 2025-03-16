import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  // Check if the message contains an image reference
  const hasImage = message.content.includes('[Image attached]');
  
  // Extract the text content without the image reference
  const textContent = hasImage 
    ? message.content.replace('[Image attached]', '').trim() 
    : message.content;
  
  return (
    <div className={`p-4 rounded-lg my-2 ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}>
      <div className="font-bold mb-1">
        {message.role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div className="markdown-content">
        {hasImage && message.role === 'user' && (
          <div className="mb-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-sm text-gray-600 dark:text-gray-300">
              [Image uploaded]
            </div>
          </div>
        )}
        <ReactMarkdown
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className}>
                  {children}
                </code>
              );
            },
          }}
        >
          {textContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MessageItem; 