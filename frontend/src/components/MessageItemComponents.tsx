// src/components/MessageItemComponents.tsx
import React, { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Choose a syntax highlighting theme (e.g., prism, okaidia, coy, etc.)
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types';
import { AVAILABLE_REACTIONS } from '../utils/message-reactions';
import { useClickOutside } from '../hooks/useClickOutside'; // Adjust path

// --- Constants ---
const USER_ROLE = 'user';
const ASSISTANT_ROLE = 'assistant'; // Assuming 'assistant' or similar for the non-user

// --- Avatar ---
interface MessageAvatarProps {
  isUser: boolean;
}
export const MessageAvatar: React.FC<MessageAvatarProps> = React.memo(({ isUser }) => (
  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ring-1 ${
    isUser
      ? 'bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-gray-700 dark:to-gray-800 text-neutral-600 dark:text-gray-300 ring-neutral-200/50 dark:ring-gray-700/50 ml-3'
      : 'bg-gradient-to-br from-neutrax-green to-neutrax-green/90 dark:from-neutrax-green/90 dark:to-neutrax-green/70 text-white ring-neutrax-green/30 dark:ring-neutrax-green/50 mr-3'
  }`}>
    {isUser ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ) : (
      'GPT' // Or use an Icon
    )}
  </div>
));

// --- Header (Name/Badge) ---
interface MessageHeaderProps {
  isUser: boolean;
}
export const MessageHeader: React.FC<MessageHeaderProps> = React.memo(({ isUser }) => (
  <div className="text-xs font-medium text-neutral-500 dark:text-gray-400 mb-1 px-1 flex items-center">
    {isUser ? 'You' : 'Offline GPT'} {/* Or just 'GPT' */}
    {!isUser && (
      <span className="ml-1.5 bg-neutrax-green/20 dark:bg-neutrax-green/30 text-neutrax-accent dark:text-neutrax-light text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
        GPT
      </span>
    )}
  </div>
));

// --- Code Block with Copy ---
interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const textContent = String(children).replace(/\n$/, ''); // Clean up trailing newline
    const match = /language-(\w+)/.exec(className || '');
    const language = match?.[1];

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1500); // Reset after 1.5s
        }).catch(err => {
            console.error('Failed to copy code:', err);
            // Handle error (e.g., show toast)
        });
    }, [textContent]);

    return !inline ? (
        <div className="relative group my-3">
            <SyntaxHighlighter
                style={coy} // Use the imported theme
                language={language}
                PreTag="div"
                className="!bg-neutral-100 dark:!bg-gray-800/60 !p-4 !rounded-lg !text-sm border border-neutral-200 dark:border-gray-700 overflow-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-gray-600"
                {...props}
            >
                {textContent}
            </SyntaxHighlighter>
             <button
                onClick={handleCopy}
                className="absolute top-2 right-2 text-xs text-neutral-500 dark:text-gray-400 hover:text-neutrax-green dark:hover:text-neutrax-green flex items-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150"
                aria-label="Copy code block"
                title={isCopied ? "Copied!" : "Copy code"}
            >
                 {isCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-neutrax-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                 ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                 )}
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
        </div>
    ) : (
        // Inline code style
        <code className="bg-neutral-100 dark:bg-gray-700/80 px-1.5 py-0.5 rounded text-sm font-mono text-neutrax-accent dark:text-neutrax-green mx-0.5" {...props}>
            {children}
        </code>
    );
};


// --- Define Markdown Components Outside ---
const markdownComponents = {
  p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0 text-[15px] leading-relaxed" {...props} />,
  pre: CodeBlock, // Use the custom CodeBlock component for <pre>
  code: CodeBlock, // Also use it for `code` to handle inline vs block logic
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
  li: ({ node, ...props }: any) => <li className="mb-1 text-[15px]" {...props} />,
  a: ({ node, ...props }: any) => <a className="text-neutrax-green dark:text-neutrax-green font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-neutrax-green rounded" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-neutrax-green/30 dark:border-neutrax-green/50 pl-4 italic my-3 py-1 text-neutral-600 dark:text-gray-300 bg-neutrax-light/50 dark:bg-neutrax-green/15 rounded-r-lg" {...props} />,
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-semibold mt-5 mb-3 pb-1 border-b dark:border-gray-700 text-neutral-800 dark:text-gray-100" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-semibold mt-4 mb-2 text-neutral-800 dark:text-gray-100" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-base font-semibold mt-3 mb-1 text-neutral-800 dark:text-gray-100" {...props} />,
  table: ({ node, ...props }: any) => <div className="overflow-x-auto my-4 border border-neutral-200 dark:border-gray-700 rounded-lg"><table className="min-w-full divide-y divide-neutral-200 dark:divide-gray-700" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-neutral-50 dark:bg-gray-700/50" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 dark:text-gray-300 uppercase tracking-wider" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-3 text-sm text-neutral-800 dark:text-gray-200" {...props} />,
  // Add other elements as needed (hr, img handling, etc.)
};

// --- Message Bubble (Content) ---
interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  isConsecutive: boolean;
}
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isUser, isConsecutive }) => {
  const bubbleClasses = `p-4 md:p-5 shadow-message dark:shadow-none w-full transition-all duration-300 group-hover:shadow-message-hover dark:group-hover:shadow-none relative ${
    isConsecutive ? 'rounded-2xl' : 'rounded-bubble'
  } ${
    isUser
      ? 'bg-white dark:bg-gray-800 text-neutral-800 dark:text-gray-200 border border-neutral-200 dark:border-gray-700'
      : 'bg-neutrax-light dark:bg-neutrax-green/10 text-neutral-800 dark:text-gray-200 border border-neutrax-border dark:border-neutrax-green/30'
  }`;

  // Simple Image Placeholder Logic
  const hasImage = message.content.includes('[Image attached]');
  const textContent = hasImage ? message.content.replace('[Image attached]', '').trim() : message.content;

  return (
    <div className={bubbleClasses}>
      {hasImage && textContent && <p className="mb-3 text-[15px] leading-relaxed">{textContent}</p>}

      {!hasImage && (
        <ReactMarkdown
          className="prose prose-neutral dark:prose-invert prose-sm max-w-none leading-relaxed"
          components={markdownComponents}
        >
          {textContent}
        </ReactMarkdown>
      )}

      {hasImage && (
        <div className={`px-3 py-2 rounded-lg text-xs italic flex items-center ${textContent ? 'mt-3 bg-neutral-100 dark:bg-gray-700/60 text-neutral-500 dark:text-gray-300' : 'bg-transparent text-neutral-400 dark:text-gray-400 p-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Image attached
        </div>
      )}
    </div>
  );
});


// --- Reactions Display ---
interface MessageReactionsProps {
    reactions: string[];
    onToggleReaction?: (reaction: string) => void;
}
export const MessageReactions: React.FC<MessageReactionsProps> = React.memo(({ reactions, onToggleReaction }) => {
    if (!reactions || reactions.length === 0) return null;

    // Group reactions for count display if needed (optional)
    // const reactionCounts = reactions.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {} as Record<string, number>);

    return (
        <div className="flex flex-wrap mt-1.5 -ml-1">
            {reactions.map((reaction, i) => (
                <button
                    key={`${reaction}-${i}`} // Consider a more stable key if reactions can be reordered
                    type="button"
                    onClick={() => onToggleReaction?.(reaction)}
                    className="text-xs bg-neutral-100 dark:bg-gray-700/80 hover:bg-neutrax-light dark:hover:bg-neutrax-green/20 rounded-full px-2 py-0.5 transition-colors cursor-pointer m-0.5 flex items-center"
                    aria-label={`Toggle reaction: ${reaction}`}
                    title={`Toggle reaction: ${reaction}`}
                >
                    <span className="mr-0.5">{reaction}</span>
                    {/* Optional: Display count */}
                    {/* <span className="text-[10px] text-neutral-500 dark:text-gray-400">1</span> */}
                </button>
            ))}
        </div>
    );
});


// --- Action Buttons ---
interface MessageActionsProps {
  message: Message;
  isUser: boolean; // Needed for alignment
  onToggleReaction?: (reaction: string) => void;
}
export const MessageActions: React.FC<MessageActionsProps> = React.memo(({ message, isUser, onToggleReaction }) => {
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const reactionMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(reactionMenuRef, () => setShowReactionMenu(false));

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1500);
    }).catch(err => console.error("Copy failed:", err));
  }, [message.content]);

  const hasThumbsUp = message.reactions?.includes('👍');

  return (
    <div className={`flex items-center mt-2 space-x-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Like button */}
      <button
        type="button"
        className={`p-1 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutrax-green ${
          hasThumbsUp
            ? 'text-neutrax-green bg-neutrax-green/10'
            : 'text-neutral-400 dark:text-gray-500 hover:text-neutrax-green dark:hover:text-neutrax-green hover:bg-neutrax-green/10'
        }`}
        onClick={() => onToggleReaction?.('👍')}
        aria-pressed={hasThumbsUp}
        aria-label={hasThumbsUp ? "Remove like" : "Like message"}
        title={hasThumbsUp ? "Unlike" : "Like"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={hasThumbsUp ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>

      {/* Emoji reaction button */}
      <div className="relative" ref={reactionMenuRef}>
        <button
          type="button"
          className="text-neutral-400 dark:text-gray-500 hover:text-neutrax-green dark:hover:text-neutrax-green transition-colors duration-150 p-1 rounded-full hover:bg-neutrax-green/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutrax-green"
          onClick={() => setShowReactionMenu(!showReactionMenu)}
          aria-haspopup="true"
          aria-expanded={showReactionMenu}
          aria-label="Add reaction"
          title="Add reaction"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Emoji reaction menu */}
        {showReactionMenu && (
          <div className={`absolute bottom-full mb-2 ${isUser ? 'right-0' : '-left-2'} bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-neutral-200 dark:border-gray-700 p-2 z-10 transform transition-all duration-150 ease-out ${showReactionMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} role="menu">
            <div className="flex space-x-1">
              {AVAILABLE_REACTIONS.map((emoji) => {
                const isActive = message.reactions?.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    role="menuitem"
                    className={`text-xl p-1 rounded-full hover:bg-neutrax-light dark:hover:bg-neutrax-green/20 focus:outline-none focus:bg-neutrax-light dark:focus:bg-neutrax-green/20 focus:ring-1 focus:ring-neutrax-green transition-colors ${
                      isActive ? 'bg-neutrax-light dark:bg-neutrax-green/20' : ''
                    }`}
                    onClick={() => {
                      onToggleReaction?.(emoji);
                      setShowReactionMenu(false);
                    }}
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
               })}
            </div>
          </div>
        )}
      </div>

      {/* Copy button */}
      <button
        type="button"
        className="text-neutral-400 dark:text-gray-500 hover:text-neutrax-green dark:hover:text-neutrax-green transition-colors duration-150 p-1 rounded-full hover:bg-neutrax-green/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutrax-green"
        onClick={handleCopy}
        aria-label={copyStatus === 'copied' ? "Message content copied" : "Copy message content"}
        title={copyStatus === 'copied' ? "Copied!" : "Copy text"}
      >
        {copyStatus === 'copied' ? (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutrax-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
      </button>
    </div>
  );
});

// --- Timestamp ---
interface MessageTimestampProps {
    timestamp?: string | number | Date;
}
export const MessageTimestamp: React.FC<MessageTimestampProps> = React.memo(({ timestamp }) => {
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        // Add more sophisticated relative time logic here if needed
        // e.g., using libraries like 'date-fns' or 'dayjs'
    };

    const displayTime = timestamp ? formatTime(new Date(timestamp)) : formatTime(new Date());

    return (
        <div className="text-[11px] text-neutral-400 dark:text-gray-500 mt-1.5 px-1 select-none">
            {displayTime}
        </div>
    );
});