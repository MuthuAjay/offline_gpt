// src/components/MessageItem.tsx
import React from 'react';
import { MessageItemProps } from '../types'; // Assuming this defines { message, isConsecutive, onToggleReaction }
import {
  MessageAvatar,
  MessageHeader,
  MessageBubble,
  MessageActions,
  MessageReactions,
  MessageTimestamp
} from './MessageItemComponents'; // Adjust path

// --- Constants ---
const USER_ROLE = 'user';

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isConsecutive = false,
  onToggleReaction,
  // isTyping prop is removed as it seems out of place for a rendered message item.
  // Typing indicators should likely be separate components.
}) => {
  if (!message) return null; // Handle potential null message gracefully

  const isUser = message.role === USER_ROLE;

  return (
    <div className={`flex w-full ${isConsecutive ? 'mt-1.5' : 'mt-6'} ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn group`}>
      {/* Avatar Column (only shows if not consecutive) */}
      <div className={`flex-shrink-0 ${isConsecutive ? 'w-8 ml-3 mr-3' : 'w-auto'}`}> {/* Maintain spacing */}
          {!isConsecutive && <MessageAvatar isUser={isUser} />}
      </div>

      {/* Message Content Column */}
      <div className={`flex flex-col w-full max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header (only shows if not consecutive) */}
        {!isConsecutive && <MessageHeader isUser={isUser} />}

        {/* Bubble */}
        <MessageBubble message={message} isUser={isUser} isConsecutive={isConsecutive} />

        {/* Reactions Display */}
         <MessageReactions reactions={message.reactions || []} onToggleReaction={onToggleReaction} />

        {/* Actions */}
        <MessageActions message={message} isUser={isUser} onToggleReaction={onToggleReaction} />

        {/* Timestamp */}
        <MessageTimestamp timestamp={message.timestamp} />
      </div>
    </div>
  );
};

// Memoize the component for performance
export default React.memo(MessageItem);