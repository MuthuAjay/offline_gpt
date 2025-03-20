import { Message } from '../types';

/**
 * Available emoji reactions
 */
export const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '👏', '🤔'];

/**
 * Add a reaction to a message
 * @param message The message to add reaction to
 * @param emoji The emoji reaction to add
 * @returns A new message object with the reaction added
 */
export const addReaction = (message: Message, emoji: string): Message => {
  // If message doesn't have reactions array, create it
  const currentReactions = message.reactions || [];
  
  // If reaction already exists, don't add it again
  if (currentReactions.includes(emoji)) {
    return message;
  }
  
  // Return new message with reaction added
  return {
    ...message,
    reactions: [...currentReactions, emoji],
  };
};

/**
 * Remove a reaction from a message
 * @param message The message to remove reaction from
 * @param emoji The emoji reaction to remove
 * @returns A new message object with the reaction removed
 */
export const removeReaction = (message: Message, emoji: string): Message => {
  // If message doesn't have reactions array, nothing to remove
  if (!message.reactions || message.reactions.length === 0) {
    return message;
  }
  
  // Return new message with reaction removed
  return {
    ...message,
    reactions: message.reactions.filter(reaction => reaction !== emoji),
  };
};

/**
 * Toggle a reaction on a message (add if not present, remove if present)
 * @param message The message to toggle reaction on
 * @param emoji The emoji reaction to toggle
 * @returns A new message object with the reaction toggled
 */
export const toggleReaction = (message: Message, emoji: string): Message => {
  const currentReactions = message.reactions || [];
  
  if (currentReactions.includes(emoji)) {
    return removeReaction(message, emoji);
  } else {
    return addReaction(message, emoji);
  }
};

/**
 * Update a message in an array of messages
 * @param messages The array of messages
 * @param messageIndex The index of the message to update
 * @param updatedMessage The updated message
 * @returns A new array of messages with the message updated
 */
export const updateMessage = (
  messages: Message[],
  messageIndex: number,
  updatedMessage: Message
): Message[] => {
  return [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];
};

/**
 * Save message reactions to local storage
 * @param conversationId The ID of the conversation
 * @param messages The messages with reactions
 */
export const saveReactionsToLocalStorage = (
  conversationId: string,
  messages: Message[]
): void => {
  // Create a map of message ID to reactions
  const reactionsMap: Record<string, string[]> = {};
  
  messages.forEach(message => {
    if (message.id && message.reactions && message.reactions.length > 0) {
      reactionsMap[message.id] = message.reactions;
    }
  });
  
  // Save to local storage
  localStorage.setItem(
    `reactions_${conversationId}`,
    JSON.stringify(reactionsMap)
  );
};

/**
 * Load message reactions from local storage
 * @param conversationId The ID of the conversation
 * @param messages The messages to apply reactions to
 * @returns A new array of messages with reactions applied
 */
export const loadReactionsFromLocalStorage = (
  conversationId: string,
  messages: Message[]
): Message[] => {
  // Get reactions map from local storage
  const reactionsMapStr = localStorage.getItem(`reactions_${conversationId}`);
  if (!reactionsMapStr) {
    return messages;
  }
  
  // Parse reactions map
  try {
    const reactionsMap: Record<string, string[]> = JSON.parse(reactionsMapStr);
    
    // Apply reactions to messages
    return messages.map(message => {
      if (message.id && reactionsMap[message.id]) {
        return {
          ...message,
          reactions: reactionsMap[message.id],
        };
      }
      return message;
    });
  } catch (error) {
    console.error('Error parsing reactions from local storage:', error);
    return messages;
  }
};