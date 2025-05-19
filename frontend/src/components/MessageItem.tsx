import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDate, copyToClipboard } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Copy, Check, Clock, User, Bot } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isSearchEnabled?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isSearchEnabled }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
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

  const handleCopy = async () => {
    try {
      await copyToClipboard(message.content);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard.",
        variant: "success",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex gap-4 p-4 ${
        isUser ? 'bg-muted/50' : 'bg-background'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(new Date())}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative group/code">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg !mt-0 !mb-0"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
                      onClick={() => {
                        copyToClipboard(String(children))
                          .then(() => {
                            toast({
                              title: "Code copied",
                              description: "Code block has been copied to clipboard.",
                              variant: "success",
                            });
                          })
                          .catch(() => {
                            toast({
                              title: "Failed to copy code",
                              description: "Could not copy code to clipboard.",
                              variant: "destructive",
                            });
                          });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-4 last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 last:mb-0">{children}</ol>,
              li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {isSearchEnabled && !isUser 
              ? highlightSearchContent(message.content) 
              : message.content
            }
          </ReactMarkdown>
        </div>
      </div>

      {/* Copy button */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-8 w-8"
        >
          <AnimatePresence mode="wait">
            {isCopied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.div>
  );
};

export default MessageItem;