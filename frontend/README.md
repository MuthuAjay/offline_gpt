# Offline GPT Frontend

This is the frontend for the Offline GPT application, which provides a user interface for interacting with Ollama models.

## Features

- Modern React-based UI with TypeScript
- Tailwind CSS for styling
- WebSocket support for real-time chat
- Markdown rendering with syntax highlighting
- Light and dark mode support
- Local storage for conversation persistence
- Model selection dropdown

## Prerequisites

- Node.js 16 or higher
- npm or yarn

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn
```

2. Start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the development server on port 3000.

## Building for Production

To build the frontend for production:

```bash
npm run build
# or
yarn build
```

This will create a `dist` directory with the compiled assets.

## Usage

The frontend communicates with the backend API running on port 8000. Make sure the backend is running before using the frontend.

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Axios for API requests
- WebSockets for real-time communication
- React Markdown for rendering markdown content 