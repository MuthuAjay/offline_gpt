// Available emoji reactions for messages
export const AVAILABLE_REACTIONS = ['👍', '👎', '😄', '😢', '🎉', '❤️', '🤔', '💡'];

// Function to save reactions to localStorage
export const saveReactions = (conversationId: string, messageId: string, reactions: string[]) => {
  try {
    const storageKey = `reactions_${conversationId}_${messageId}`;
    localStorage.setItem(storageKey, JSON.stringify(reactions));
  } catch (error) {
    console.error('Error saving reactions to localStorage:', error);
  }
};

// Function to load reactions from localStorage
export const loadReactions = (conversationId: string, messageId: string): string[] => {
  try {
    const storageKey = `reactions_${conversationId}_${messageId}`;
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading reactions from localStorage:', error);
    return [];
  }
}; 