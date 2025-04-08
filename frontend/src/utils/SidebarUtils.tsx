// src/components/SidebarUtils.ts (or keep in Sidebar.tsx if preferred)
import { Conversation } from '../types';

const MONTH_YEAR_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'long',
  year: 'numeric',
};

// Pure function - can live outside the component
export const groupConversationsByMonth = (convs: Conversation[]): { [key: string]: Conversation[] } => {
  const grouped: { [key: string]: Conversation[] } = {};
  const now = new Date(); // Use a stable 'now' for comparison if needed for labels like "This Month"

  convs.forEach(conv => {
    const date = new Date(conv.timestamp);
    // Consider localization and potential formatting needs
    const monthYear = date.toLocaleString(undefined, MONTH_YEAR_FORMAT_OPTIONS);

    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(conv);
  });

  // Optionally sort the groups chronologically if needed (Object.entries might not preserve order)
  // const sortedGroupKeys = Object.keys(grouped).sort((a, b) => /* comparison logic based on date derived from key */);
  // const sortedGrouped = {}; sortedGroupKeys.forEach(key => sortedGrouped[key] = grouped[key]); return sortedGrouped;

  return grouped; // Current implementation relies on insertion order (often works but not guaranteed)
};