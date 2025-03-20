import { useState, useCallback } from 'react';
import { Message } from '../types';

interface UseMessageReactionsReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  handleToggleReaction: (messageIndex: number, emoji: string) => void;
  addMessage: (message: Message) => void;
  updateMessageContent: (messageIndex: number, content: string) => void;
}

const useMessageReactions = (initialMessages: Message[] = [], conversationId: string): UseMessageReactionsReturn => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleToggleReaction = useCallback((messageIndex: number, emoji: string) => {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      const message = { ...newMessages[messageIndex] };
      
      if (!message.reactions) {
        message.reactions = [];
      }
      
      const reactionIndex = message.reactions.indexOf(emoji);
      
      if (reactionIndex > -1) {
        // Remove reaction if already present
        message.reactions = message.reactions.filter(r => r !== emoji);
      } else {
        // Add reaction
        message.reactions.push(emoji);
      }
      
      newMessages[messageIndex] = message;
      return newMessages;
    });
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const updateMessageContent = useCallback((messageIndex: number, content: string) => {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      if (newMessages[messageIndex]) {
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content,
        };
      }
      return newMessages;
    });
  }, []);

  return {
    messages,
    setMessages,
    handleToggleReaction,
    addMessage,
    updateMessageContent
  };
};

export default useMessageReactions; 