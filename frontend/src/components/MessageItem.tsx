import React, { useState } from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: Message;
  isTyping?: boolean;
  isConsecutive?: boolean;
  index: number;
  messages: Message[];
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  isTyping = false,
  index = 0,
  messages = []
}) => {
  const isUser = message.role === 'user';
  const isConsecutive = index > 0 && messages[index - 1].role === message.role;
  
  // State for emoji reactions
  const [reactions, setReactions] = useState<string[]>(message.reactions || []);
  
  // Available emoji reactions
  const availableReactions = ['👍', '❤️', '😂', '😮', '🙏', '👏', '🤔'];
  
  // Toggle emoji reaction
  const toggleReaction = (emoji: string) => {
    if (reactions.includes(emoji)) {
      setReactions(reactions.filter(r => r !== emoji));
    } else {
      setReactions([...reactions, emoji]);
    }
  };
  
  // Toggle reaction menu
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  
  return (
    <div className={`${isConsecutive ? 'mt-2' : 'mt-6'} ${isUser ? 'flex flex-row-reverse' : 'flex'} animate-fadeIn`}>
      {/* Avatar - only show if not consecutive message */}
      {!isConsecutive && (
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-gray-700 dark:to-gray-800 ml-3 ring-1 ring-neutral-200/50 dark:ring-gray-700/50' 
            : 'bg-gradient-to-br from-neutrax-green to-neutrax-green/90 dark:from-neutrax-green/90 dark:to-neutrax-green/70 mr-3 ring-1 ring-neutrax-green/30 dark:ring-neutrax-green/50'
        } shadow-sm`}>
          {isUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <div className="text-white h-6 w-6 flex items-center justify-center text-xs font-bold drop-shadow-sm">
              NT
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`${isConsecutive ? 'max-w-[85%]' : 'max-w-[85%]'} flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Show name only if not consecutive */}
        {!isConsecutive && (
          <div className="text-xs font-medium text-neutral-500 dark:text-gray-400 mb-1 px-1 flex items-center">
            {isUser ? 'You' : 'Neutrax'}
            {!isUser && (
              <span className="ml-2 bg-neutrax-green/20 dark:bg-neutrax-green/30 text-neutrax-accent dark:text-neutrax-light text-[10px] px-1.5 py-0.5 rounded-full">AI</span>
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div 
          className={`p-5 ${isConsecutive ? 'rounded-2xl' : 'rounded-bubble'} shadow-message dark:shadow-none w-full transition-all duration-300 hover:shadow-message-hover dark:hover:shadow-none ${
            isUser 
              ? 'bg-white dark:bg-gray-800 text-neutral-800 dark:text-gray-200 border border-neutral-200 dark:border-gray-700' 
              : 'bg-neutrax-light dark:bg-neutrax-green/10 text-neutral-800 dark:text-gray-200 border border-neutrax-border dark:border-neutrax-green/30'
          }`}
        >
          {message.content.includes('[Image attached]') ? (
            <div>
              <p className="mb-2 whitespace-pre-wrap leading-relaxed">{message.content.replace('[Image attached]', '')}</p>
              <div className="mt-3 px-3 py-2 bg-neutral-100 dark:bg-gray-700 rounded-lg text-xs italic text-neutral-500 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image attached
              </div>
            </div>
          ) : (
            <ReactMarkdown 
              className="prose prose-neutral dark:prose-invert prose-sm max-w-none leading-relaxed"
              components={{
                p: ({node, ...props}) => <p className="mb-3 last:mb-0 text-[15px] leading-relaxed" {...props} />,
                pre: ({node, ...props}) => (
                  <pre className="bg-neutral-100 dark:bg-gray-700 p-3 rounded-lg overflow-auto text-sm my-3 border border-neutral-200 dark:border-gray-600" {...props} />
                ),
                code: ({node, inline, ...props}) => 
                  inline 
                    ? <code className="bg-neutral-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-neutrax-green dark:text-neutrax-green" {...props} />
                    : <code className="text-sm font-mono" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="mb-1 text-[15px]" {...props} />,
                a: ({node, ...props}) => <a className="text-neutrax-green dark:text-neutrax-green font-medium hover:underline transition-colors" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-neutrax-green/30 dark:border-neutrax-green/50 pl-4 italic my-3 py-1 text-neutral-600 dark:text-gray-300 bg-neutrax-light/50 dark:bg-neutrax-green/20 rounded-r-lg" {...props} />
                ),
                h1: ({node, ...props}) => <h1 className="text-xl font-semibold my-4 text-neutral-800 dark:text-gray-100" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-semibold my-3 text-neutral-800 dark:text-gray-100" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-semibold my-2 text-neutral-800 dark:text-gray-100" {...props} />,
                table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full border border-neutral-200 dark:border-gray-700 rounded-lg" {...props} /></div>,
                th: ({node, ...props}) => <th className="px-3 py-2 bg-neutral-100 dark:bg-gray-700 text-left text-xs font-medium text-neutral-700 dark:text-gray-300 border-b dark:border-gray-600" {...props} />,
                td: ({node, ...props}) => <td className="px-3 py-2 text-sm border-b border-neutral-200 dark:border-gray-700" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          
          {/* Code copy button for code blocks */}
          {message.content.includes('```') && (
            <div className="mt-2 flex justify-end">
              <button 
                className="text-xs text-neutral-500 dark:text-gray-400 hover:text-neutrax-green dark:hover:text-neutrax-green flex items-center bg-neutral-100 dark:bg-gray-700 px-2 py-1 rounded-md"
                onClick={() => {
                  // Extract code content between ```
                  const codeMatch = message.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
                  if (codeMatch && codeMatch[1]) {
                    navigator.clipboard.writeText(codeMatch[1].trim());
                    // You could add a toast notification here
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy code
              </button>
            </div>
          )}
        </div>
        
        {/* Typing indicator */}
        {isTyping && !isUser && (
          <div className="flex space-x-1 mt-2 px-3 py-2 bg-neutrax-light dark:bg-neutrax-green/10 rounded-bubble max-w-fit">
            <div className="w-2 h-2 bg-neutrax-green rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-neutrax-green rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-neutrax-green rounded-full animate-pulse delay-150"></div>
          </div>
        )}
        
        {/* Reactions display */}
        {reactions.length > 0 && (
          <div className="flex mt-1 space-x-1">
            {reactions.map((reaction, i) => (
              <span 
                key={i} 
                className="text-sm bg-neutral-100 dark:bg-gray-700 hover:bg-neutrax-light dark:hover:bg-neutrax-green/20 rounded-full px-2 py-0.5 transition-colors cursor-pointer"
                onClick={() => toggleReaction(reaction)}
              >
                {reaction}
              </span>
            ))}
          </div>
        )}
        
        {/* Action buttons */}
        <div className={`flex mt-2 space-x-3 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {/* Like button */}
          <button 
            className={`p-1 rounded-full transition-colors ${
              reactions.includes('👍') 
                ? 'text-neutrax-green bg-neutrax-green/10' 
                : 'text-neutral-400 dark:text-gray-500 hover:text-neutrax-green dark:hover:text-neutrax-green hover:bg-neutrax-green/10'
            }`}
            onClick={() => toggleReaction('👍')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>
          
          {/* Emoji reaction button */}
          <div className="relative">
            <button 
              className="text-neutral-400 dark:text-gray-500 hover:text-neutrax-green dark:hover:text-neutrax-green transition-colors p-1 rounded-full hover:bg-neutrax-green/10"
              onClick={() => setShowReactionMenu(!showReactionMenu)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Emoji reaction menu */}
            {showReactionMenu && (
              <div className="absolute bottom-full mb-2 -left-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-neutral-200 dark:border-gray-700 p-2 z-10">
                <div className="flex space-x-1">
                  {availableReactions.map((emoji, i) => (
                    <button 
                      key={i} 
                      className={`text-lg p-1 rounded-full hover:bg-neutrax-light dark:hover:bg-neutrax-green/20 transition-colors ${
                        reactions.includes(emoji) ? 'bg-neutrax-light dark:bg-neutrax-green/20' : ''
                      }`}
                      onClick={() => {
                        toggleReaction(emoji);
                        setShowReactionMenu(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Copy button */}
          <button 
            className="text-neutral-400 dark:text-gray-500 hover:text-neutrax-green dark:hover:text-neutrax-green transition-colors p-1 rounded-full hover:bg-neutrax-green/10"
            onClick={() => navigator.clipboard.writeText(message.content)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
        
        {/* Timestamp */}
        <div className="text-[10px] text-neutral-400 dark:text-gray-500 mt-1 px-1">
          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageItem);