import os
import json
import httpx
import asyncio
import base64
import uuid
import datetime
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Import the cache
from cache import cache

# Import the free web search tool
from web_search import DuckDuckGoSearchTool, WebFetchTool

# Initialize web search tools - no API key needed
web_search_tool = DuckDuckGoSearchTool()
web_fetch_tool = WebFetchTool()

# Database setup
DATABASE_URL = "sqlite:///./chat_history.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI app setup
app = FastAPI(title="Offline GPT")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama API URL
OLLAMA_API_URL = "http://localhost:11434/api"

# Pydantic models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: bool = True
    conversation_id: Optional[str] = None

class ModelInfo(BaseModel):
    name: str
    size: str
    modified_at: str

# Add a new model for multimodal messages
class ContentPart(BaseModel):
    type: str
    text: Optional[str] = None
    image_url: Optional[Dict[str, str]] = None

class MultimodalMessage(BaseModel):
    role: str
    content: List[ContentPart]

class MultimodalChatRequest(BaseModel):
    model: str
    messages: List[MultimodalMessage]
    stream: bool = True
    conversation_id: Optional[str] = None

# New Pydantic models for web search
class WebSearchRequest(BaseModel):
    query: str
    num_results: int = 5

class WebFetchRequest(BaseModel):
    url: str

# Enhanced chat model to support web search
class EnhancedChatRequest(ChatRequest):
    use_web_search: bool = False
    web_search_query: Optional[str] = None

# API endpoints
@app.get("/api/models")
async def list_models():
    """List all available models from Ollama"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_API_URL}/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                return {"models": models}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch models from Ollama")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to Ollama: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint"""
    try:
        # Convert messages to the format expected by the cache
        messages_for_cache = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Check cache first
        cached_response = cache.get(request.model, messages_for_cache)
        if cached_response:
            # Save to history if conversation_id is provided
            if request.conversation_id:
                db = SessionLocal()
                # Save the last user message
                last_user_msg = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
                if last_user_msg:
                    db_msg = ChatHistory(
                        conversation_id=request.conversation_id,
                        role="user",
                        content=last_user_msg.content,
                        timestamp=datetime.datetime.now().isoformat()
                    )
                    db.add(db_msg)
                
                # Save the assistant response
                db_response = ChatHistory(
                    conversation_id=request.conversation_id,
                    role="assistant",
                    content=cached_response["message"]["content"],
                    timestamp=datetime.datetime.now().isoformat()
                )
                db.add(db_response)
                db.commit()
            
            return cached_response
        
        payload = {
            "model": request.model,
            "messages": messages_for_cache,
            "stream": False
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{OLLAMA_API_URL}/chat", json=payload)
            if response.status_code == 200:
                result = response.json()
                
                # Save to cache
                cache.set(request.model, messages_for_cache, result)
                
                # Save to history if conversation_id is provided
                if request.conversation_id:
                    db = SessionLocal()
                    # Save the last user message
                    last_user_msg = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
                    if last_user_msg:
                        db_msg = ChatHistory(
                            conversation_id=request.conversation_id,
                            role="user",
                            content=last_user_msg.content,
                            timestamp=datetime.datetime.now().isoformat()
                        )
                        db.add(db_msg)
                    
                    # Save the assistant response
                    db_response = ChatHistory(
                        conversation_id=request.conversation_id,
                        role="assistant",
                        content=result["message"]["content"],
                        timestamp=datetime.datetime.now().isoformat()
                    )
                    db.add(db_response)
                    db.commit()
                
                return result
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to get response from Ollama")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

async def stream_response(model: str, messages: List[Dict]):
    """Stream response from Ollama"""
    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }
    
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", f"{OLLAMA_API_URL}/chat", json=payload, timeout=60.0) as response:
            if response.status_code != 200:
                yield f"data: {json.dumps({'error': 'Failed to connect to Ollama'})}\n\n"
                return
                
            async for chunk in response.aiter_text():
                if chunk.strip():
                    yield f"data: {chunk}\n\n"

@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """Streaming chat endpoint using SSE"""
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    return StreamingResponse(
        stream_response(request.model, messages),
        media_type="text/event-stream"
    )

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            model = data.get("model", "llama2")
            messages = data.get("messages", [])
            conversation_id = data.get("conversation_id")
            
            # Prepare the request to Ollama
            payload = {
                "model": model,
                "messages": messages,
                "stream": True
            }
            
            # Save user message to history if conversation_id is provided
            if conversation_id:
                db = SessionLocal()
                last_user_msg = next((msg for msg in reversed(messages) if msg["role"] == "user"), None)
                if last_user_msg:
                    db_msg = ChatHistory(
                        conversation_id=conversation_id,
                        role="user",
                        content=last_user_msg["content"],
                        timestamp=datetime.datetime.now().isoformat()
                    )
                    db.add(db_msg)
                    db.commit()
            
            # Stream the response from Ollama
            full_response = ""
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", f"{OLLAMA_API_URL}/chat", json=payload, timeout=60.0) as response:
                    if response.status_code != 200:
                        await websocket.send_json({"error": "Failed to connect to Ollama"})
                        continue
                        
                    async for chunk in response.aiter_text():
                        if chunk.strip():
                            try:
                                chunk_data = json.loads(chunk)
                                if "message" in chunk_data and "content" in chunk_data["message"]:
                                    content = chunk_data["message"]["content"]
                                    full_response += content
                                    await websocket.send_text(chunk)
                            except json.JSONDecodeError:
                                await websocket.send_text(chunk)
            
            # Save assistant response to history if conversation_id is provided
            if conversation_id and full_response:
                db = SessionLocal()
                db_response = ChatHistory(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_response,
                    timestamp=datetime.datetime.now().isoformat()
                )
                db.add(db_response)
                db.commit()
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": str(e)})

@app.get("/api/history/{conversation_id}")
def get_conversation_history(conversation_id: str, db: Session = Depends(get_db)):
    """Get chat history for a specific conversation"""
    history = db.query(ChatHistory).filter(ChatHistory.conversation_id == conversation_id).all()
    return {"messages": [{"role": h.role, "content": h.content} for h in history]}

@app.get("/api/conversations")
def list_conversations(db: Session = Depends(get_db)):
    """List all conversation IDs with titles"""
    # Get unique conversation IDs
    conversation_ids = db.query(ChatHistory.conversation_id).distinct().all()
    result = []
    
    for conv_id in conversation_ids:
        conv_id = conv_id[0]
        # Get the first user message as the title
        first_message = db.query(ChatHistory).filter(
            ChatHistory.conversation_id == conv_id,
            ChatHistory.role == "user"
        ).order_by(ChatHistory.id.asc()).first()
        
        title = "New conversation"
        if first_message:
            # Truncate long messages
            content = first_message.content
            if len(content) > 30:
                content = content[:30] + "..."
            title = content
            
        result.append({
            "id": conv_id,
            "title": title,
            "timestamp": db.query(ChatHistory.timestamp).filter(
                ChatHistory.conversation_id == conv_id
            ).order_by(ChatHistory.id.desc()).first()[0]
        })
    
    # Sort by timestamp (newest first)
    result.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"conversations": result}

@app.post("/api/chat/multimodal")
async def multimodal_chat(request: MultimodalChatRequest):
    """Non-streaming multimodal chat endpoint"""
    try:
        # Format the request for Ollama
        payload = {
            "model": request.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
            "stream": False
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{OLLAMA_API_URL}/chat", json=payload)
            if response.status_code == 200:
                result = response.json()
                
                # Save to history if conversation_id is provided
                if request.conversation_id:
                    db = SessionLocal()
                    # Save the last user message - for multimodal, store a reference to the image
                    last_user_msg = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
                    if last_user_msg:
                        # For multimodal messages, we'll store a simplified version in the DB
                        content_text = ""
                        for content_part in last_user_msg.content:
                            if content_part.type == "text":
                                content_text += content_part.text + " "
                            elif content_part.type == "image_url":
                                content_text += "[IMAGE] "
                        
                        db_msg = ChatHistory(
                            conversation_id=request.conversation_id,
                            role="user",
                            content=content_text.strip(),
                            timestamp=datetime.datetime.now().isoformat()
                        )
                        db.add(db_msg)
                    
                    # Save the assistant response
                    db_response = ChatHistory(
                        conversation_id=request.conversation_id,
                        role="assistant",
                        content=result["message"]["content"],
                        timestamp=datetime.datetime.now().isoformat()
                    )
                    db.add(db_response)
                    db.commit()
                
                return result
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to get response from Ollama")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return a reference to it"""
    try:
        # Read the file content
        contents = await file.read()
        
        # Create a unique filename
        filename = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save the file
        file_path = f"uploads/{filename}"
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Convert to base64 for Ollama
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        return {
            "filename": filename,
            "content_type": file.content_type,
            "base64_data": base64_image
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/api/conversations")
def create_conversation():
    """Create a new conversation and return its ID"""
    conversation_id = str(uuid.uuid4())
    return {"conversation_id": conversation_id}

@app.delete("/api/history/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation history"""
    db.query(ChatHistory).filter(ChatHistory.conversation_id == conversation_id).delete()
    db.commit()
    return {"status": "success", "message": f"Conversation {conversation_id} deleted"}

# New endpoints for web search
@app.post("/api/web_search")
async def web_search(request: WebSearchRequest):
    """Perform a web search for the given query"""
    try:
        results = await web_search_tool.search(request.query, request.num_results)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing web search: {str(e)}")

@app.post("/api/web_fetch")
async def web_fetch(request: WebFetchRequest):
    """Fetch content from a URL"""
    try:
        result = await web_fetch_tool.fetch(request.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching URL: {str(e)}")

@app.post("/api/chat/enhanced")
async def enhanced_chat(request: EnhancedChatRequest):
    """Chat endpoint with optional web search capability"""
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Check if web search is requested
        if request.use_web_search and request.web_search_query:
            # Perform web search
            search_results = await web_search_tool.search(request.web_search_query)
            
            if search_results:
                # Fetch the first result for more context
                first_result = search_results[0]
                fetched_content = await web_fetch_tool.fetch(first_result['url'])
                
                # Format search results for the LLM
                search_context = "Web Search Results:\n\n"
                for i, result in enumerate(search_results):
                    search_context += f"[{i+1}] {result['title']}\n"
                    search_context += f"URL: {result['url']}\n"
                    search_context += f"Summary: {result['snippet']}\n\n"
                
                # Add content from first result
                if 'main_content' in fetched_content and fetched_content['main_content']:
                    content_extract = fetched_content['main_content']
                    if len(content_extract) > 2000:
                        content_extract = content_extract[:2000] + "...(content truncated)"
                    
                    search_context += f"\nExtracted content from {first_result['url']}:\n{content_extract}\n\n"
                
                # Add search results as a system message
                messages.append({
                    "role": "system",
                    "content": f"The following information was retrieved from a web search for '{request.web_search_query}':\n\n{search_context}\nPlease use this information to help answer the user's question."
                })
        
        # Prepare the request to Ollama
        payload = {
            "model": request.model,
            "messages": messages,
            "stream": request.stream
        }
        
        # Make the request to Ollama
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{OLLAMA_API_URL}/chat", json=payload)
            if response.status_code == 200:
                result = response.json()
                
                # Save to history if conversation_id is provided
                if request.conversation_id:
                    db = SessionLocal()
                    # Save the last user message
                    last_user_msg = next((msg for msg in reversed(request.messages) if msg.role == "user"), None)
                    if last_user_msg:
                        db_msg = ChatHistory(
                            conversation_id=request.conversation_id,
                            role="user",
                            content=last_user_msg.content,
                            timestamp=datetime.datetime.now().isoformat()
                        )
                        db.add(db_msg)
                    
                    # Save the assistant response
                    db_response = ChatHistory(
                        conversation_id=request.conversation_id,
                        role="assistant",
                        content=result["message"]["content"],
                        timestamp=datetime.datetime.now().isoformat()
                    )
                    db.add(db_response)
                    db.commit()
                
                return result
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to get response from Ollama")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Streaming version of enhanced chat
async def enhanced_stream_response(model: str, messages: List[Dict], use_web_search: bool, web_search_query: Optional[str]):
    """Stream response from Ollama with optional web search"""
    try:
        # Check if web search is requested
        if use_web_search and web_search_query:
            # Perform web search
            search_results = await web_search_tool.search(web_search_query)
            
            if search_results:
                # Fetch the first result for more context
                first_result = search_results[0]
                fetched_content = await web_fetch_tool.fetch(first_result['url'])
                
                # Format search results for the LLM
                search_context = "Web Search Results:\n\n"
                for i, result in enumerate(search_results):
                    search_context += f"[{i+1}] {result['title']}\n"
                    search_context += f"URL: {result['url']}\n"
                    search_context += f"Summary: {result['snippet']}\n\n"
                
                # Add content from first result
                if 'main_content' in fetched_content and fetched_content['main_content']:
                    content_extract = fetched_content['main_content']
                    if len(content_extract) > 2000:
                        content_extract = content_extract[:2000] + "...(content truncated)"
                    
                    search_context += f"\nExtracted content from {first_result['url']}:\n{content_extract}\n\n"
                
                # Add search results as a system message
                messages.append({
                    "role": "system",
                    "content": f"The following information was retrieved from a web search for '{web_search_query}':\n\n{search_context}\nPlease use this information to help answer the user's question."
                })
    except Exception as e:
        yield f"data: {json.dumps({'error': f'Error in web search: {str(e)}'})}\n\n"
    
    # Prepare the request to Ollama
    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }
    
    # Stream the response from Ollama
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", f"{OLLAMA_API_URL}/chat", json=payload, timeout=60.0) as response:
            if response.status_code != 200:
                yield f"data: {json.dumps({'error': 'Failed to connect to Ollama'})}\n\n"
                return
                
            async for chunk in response.aiter_text():
                if chunk.strip():
                    yield f"data: {chunk}\n\n"

@app.post("/api/chat/enhanced/stream")
async def enhanced_stream_chat(request: EnhancedChatRequest):
    """Streaming chat endpoint with optional web search capability"""
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    return StreamingResponse(
        enhanced_stream_response(request.model, messages, request.use_web_search, request.web_search_query),
        media_type="text/event-stream"
    )

@app.websocket("/api/ws/enhanced")
async def enhanced_websocket_endpoint(websocket: WebSocket):
    """Enhanced WebSocket endpoint with web search capabilities"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            model = data.get("model", "llama2")
            messages = data.get("messages", [])
            conversation_id = data.get("conversation_id")
            use_web_search = data.get("use_web_search", False)
            web_search_query = data.get("web_search_query")
            
            # Save user message to history if conversation_id is provided
            if conversation_id:
                db = SessionLocal()
                last_user_msg = next((msg for msg in reversed(messages) if msg["role"] == "user"), None)
                if last_user_msg:
                    db_msg = ChatHistory(
                        conversation_id=conversation_id,
                        role="user",
                        content=last_user_msg["content"],
                        timestamp=datetime.datetime.now().isoformat()
                    )
                    db.add(db_msg)
                    db.commit()
            
            # Check if web search is requested
            if use_web_search and web_search_query:
                await websocket.send_json({"status": "searching", "message": f"Searching the web for: {web_search_query}"})
                
                try:
                    # Perform web search
                    search_results = await web_search_tool.search(web_search_query)
                    
                    if search_results:
                        # Fetch the first result for more context
                        first_result = search_results[0]
                        fetched_content = await web_fetch_tool.fetch(first_result['url'])
                        
                        # Format search results for the LLM
                        search_context = "Web Search Results:\n\n"
                        for i, result in enumerate(search_results):
                            search_context += f"[{i+1}] {result['title']}\n"
                            search_context += f"URL: {result['url']}\n"
                            search_context += f"Summary: {result['snippet']}\n\n"
                        
                        # Add content from first result
                        if 'main_content' in fetched_content and fetched_content['main_content']:
                            content_extract = fetched_content['main_content']
                            if len(content_extract) > 2000:
                                content_extract = content_extract[:2000] + "...(content truncated)"
                            
                            search_context += f"\nExtracted content from {first_result['url']}:\n{content_extract}\n\n"
                        
                        # Add search results as a system message
                        messages.append({
                            "role": "system",
                            "content": f"The following information was retrieved from a web search for '{web_search_query}':\n\n{search_context}\nPlease use this information to help answer the user's question."
                        })
                        
                        await websocket.send_json({"status": "search_complete", "results_count": len(search_results)})
                    else:
                        await websocket.send_json({"status": "search_complete", "results_count": 0, "message": "No search results found"})
                except Exception as e:
                    await websocket.send_json({"status": "search_error", "error": str(e)})
            
            # Prepare the request to Ollama
            payload = {
                "model": model,
                "messages": messages,
                "stream": True
            }
            
            # Stream the response from Ollama
            full_response = ""
            await websocket.send_json({"status": "generating"})
            
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", f"{OLLAMA_API_URL}/chat", json=payload, timeout=60.0) as response:
                    if response.status_code != 200:
                        await websocket.send_json({"error": "Failed to connect to Ollama"})
                        continue
                        
                    async for chunk in response.aiter_text():
                        if chunk.strip():
                            try:
                                chunk_data = json.loads(chunk)
                                if "message" in chunk_data and "content" in chunk_data["message"]:
                                    content = chunk_data["message"]["content"]
                                    full_response += content
                                    await websocket.send_text(chunk)
                            except json.JSONDecodeError:
                                await websocket.send_text(chunk)
            
            # Save assistant response to history if conversation_id is provided
            if conversation_id and full_response:
                db = SessionLocal()
                db_response = ChatHistory(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_response,
                    timestamp=datetime.datetime.now().isoformat()
                )
                db.add(db_response)
                db.commit()
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)