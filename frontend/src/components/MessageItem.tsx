import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`mb-6 ${isUser ? 'flex flex-row-reverse' : 'flex'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
        isUser ? 'bg-neutral-200 ml-3' : 'bg-primary/10 mr-3'
      }`}>
        {isUser ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <div className="bg-primary text-white h-6 w-6 flex items-center justify-center rounded text-xs font-bold">
            OG
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="text-xs text-neutral-500 mb-1 px-1">
          {isUser ? 'You' : 'Assistant'}
        </div>
        
        <div 
          className={`p-4 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-neutral-200 text-neutral-900' 
              : 'bg-white text-neutral-800 border border-neutral-200'
          }`}
        >
          {message.content.includes('[Image attached]') ? (
            <div>
              <p className="mb-2 whitespace-pre-wrap">{message.content.replace('[Image attached]', '')}</p>
              <div className="text-xs italic text-neutral-500">[Image attached]</div>
            </div>
          ) : (
            <ReactMarkdown 
              className="prose prose-neutral prose-sm max-w-none"
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                pre: ({node, ...props}) => (
                  <pre className="bg-neutral-100 p-2 rounded-md overflow-auto text-sm my-2" {...props} />
                ),
                code: ({node, inline, ...props}) => 
                  inline 
                    ? <code className="bg-neutral-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                    : <code className="text-sm font-mono" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                a: ({node, ...props}) => <a className="text-primary underline" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-neutral-300 pl-4 italic my-2" {...props} />
                ),
                h1: ({node, ...props}) => <h1 className="text-xl font-medium my-3" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-medium my-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-medium my-2" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        {/* Action buttons */}
        <div className={`flex mt-1 space-x-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <button className="text-neutral-400 hover:text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>
          <button className="text-neutral-400 hover:text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          <button className="text-neutral-400 hover:text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageItem; 