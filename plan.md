# UI Redesign Plan for OfflineGPT

Based on the Neutrax interface shown in the image, I'll create a plan to redesign our OfflineGPT application with a similar modern, clean aesthetic. Here's my implementation plan:

## 1. Layout Structure

### Overall Layout:
- Switch from dark theme to light theme with white background as primary
- Implement a three-panel layout similar to Neutrax:
  - Left sidebar for conversations/history
  - Main chat area
  - Optional right panel for settings/context (can be toggled)

### Color Palette:
- Primary: Light green (#9BE446) for accents and primary actions
- Background: White (#FFFFFF) for main surfaces
- Text: Dark gray (#1E1E2D) for primary text
- Secondary: Light gray (#F8F9FA) for message bubbles and secondary elements
- Accent: Dark navy (#1A202C) for sidebar and important UI elements

## 2. Component Updates

### Header:
- Create a cleaner header with logo and name on left
- Add dropdown for model selection
- Move user settings to top-right corner

### Sidebar:
- Add "New Chat" button at top with pen icon
- Show "CONVERSATIONS" header with count
- Group conversations by month with date headers
- Add "CLEAR" button with bright green styling
- Include bottom navigation menu for settings

### Chat Interface:
- Use distinct bubbles for messages:
  - User messages: Right-aligned with avatar
  - AI responses: Left-aligned with OfflineGPT logo/avatar
- Implement rounded message bubbles with appropriate padding
- Add subtle reactions/actions under messages

### Input Area:
- Redesign input field with cleaner styling
- Add placeholder text "Ask to OfflineGPT..."
- Replace send button with circular green button and arrow icon
- Add attribution/version info at the bottom

## 3. Implementation Steps

1. **Update Base Styling:**
   - Modify tailwind.config.js to include new color palette
   - Create base component styles for consistent UI

2. **Header Component:**
   - Redesign ModelSelector component with dropdown styling
   - Update ThemeToggle for new design language
   - Add app logo and branding

3. **Sidebar Updates:**
   - Redesign Sidebar component with conversation grouping
   - Add date separators and conversation list styling
   - Implement clear button functionality

4. **Message Component:**
   - Redesign MessageItem to use bubble layout with avatars
   - Update ReactMarkdown styling for better content display
   - Add subtle animations for message appearance

5. **Chat Input:**
   - Redesign ChatInput component with cleaner styling
   - Update image upload functionality
   - Implement new send button design

6. **Responsive Design:**
   - Ensure mobile-friendly layout
   - Implement proper sidebar behavior on smaller screens

## 4. Technical Considerations

- Keep existing WebSocket functionality intact
- Maintain dark/light theme toggle capability
- Ensure accessibility standards are met
- Optimize for performance with component memoization

I'll start by implementing the core component updates one by one, beginning with the base styling and layout structure, then moving to individual components.
