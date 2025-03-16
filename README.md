# Offline GPT

Offline GPT is a local AI chatbot application that uses models from [Ollama](https://ollama.ai/) to provide a chat experience without requiring an internet connection. It consists of a Python backend and a React frontend.

## Features

- **Completely Offline**: Works without internet dependency once set up
- **Multiple Models**: Use any model available in Ollama (Llama2, Mistral, Gemma, etc.)
- **Real-time Responses**: WebSocket support for streaming responses
- **Local Caching**: Improves response efficiency by caching previous responses
- **Conversation History**: Save and load chat history using SQLite
- **Modern UI**: Clean and responsive interface with light and dark mode
- **Markdown Support**: Renders markdown content with syntax highlighting

## Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/)
- [Ollama](https://ollama.ai/) installed and accessible

## Setup

### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Make sure Ollama is installed and pull at least one model:

```bash
ollama pull llama2
# or
ollama pull mistral
# or
ollama pull gemma
```

4. Start the backend server:

```bash
python run.py
```

This will:
- Check if Ollama is running and start it if needed
- List available models
- Start the FastAPI server on port 8000

### Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install the required dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the frontend development server on port 3000.

## Usage

1. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)
2. Select a model from the dropdown menu
3. Start chatting with the AI assistant
4. Use the theme toggle to switch between light and dark mode
5. Use the "Clear Chat" button to start a new conversation

## Building for Production

### Frontend

To build the frontend for production:

```bash
cd frontend
npm run build
# or
yarn build
```

This will create a `dist` directory with the compiled assets.

### Backend

You can package the backend as a standalone executable using PyInstaller:

```bash
pip install pyinstaller
cd backend
pyinstaller --onefile --add-data "templates:templates" --add-data "static:static" run.py
```

This will create an executable in the `dist` directory.

## Architecture

- **Backend**: FastAPI server that communicates with Ollama
- **Frontend**: React application with TypeScript and Tailwind CSS
- **Database**: SQLite for storing conversation history
- **Cache**: Local file-based cache for storing responses

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Ollama](https://ollama.ai/) for providing the local LLM runtime
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling 