import uvicorn
import os
import subprocess
import sys
import time
import requests
import json

def check_ollama_running():
    """Check if Ollama is running and accessible"""
    try:
        response = requests.get("http://localhost:11434/api/tags")
        return response.status_code == 200
    except:
        return False

def start_ollama():
    """Start Ollama if it's not running"""
    if not check_ollama_running():
        print("Ollama is not running. Attempting to start Ollama...")
        
        # Check the operating system
        if sys.platform == "win32":
            # Windows
            try:
                # Start Ollama in a new process
                subprocess.Popen(["ollama", "serve"], 
                                 creationflags=subprocess.CREATE_NEW_CONSOLE,
                                 shell=True)
            except Exception as e:
                print(f"Failed to start Ollama: {e}")
                print("Please make sure Ollama is installed and start it manually.")
                return False
        else:
            # macOS/Linux
            try:
                # Start Ollama in the background
                subprocess.Popen(["ollama", "serve"], 
                                 stdout=subprocess.DEVNULL,
                                 stderr=subprocess.DEVNULL)
            except Exception as e:
                print(f"Failed to start Ollama: {e}")
                print("Please make sure Ollama is installed and start it manually.")
                return False
        
        # Wait for Ollama to start
        print("Waiting for Ollama to start...")
        for _ in range(10):
            if check_ollama_running():
                print("Ollama is now running!")
                return True
            time.sleep(1)
        
        print("Timed out waiting for Ollama to start. Please start it manually.")
        return False
    
    return True

def check_available_models():
    """Check which models are available in Ollama"""
    try:
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            models = response.json().get("models", [])
            if not models:
                print("No models found in Ollama.")
                print("Please pull at least one model using 'ollama pull <model_name>'")
                print("Recommended models: llama2, mistral, or gemma")
                return False
            
            print("Available models:")
            for model in models:
                print(f"- {model['name']}")
            
            return True
        else:
            print("Failed to fetch models from Ollama.")
            return False
    except Exception as e:
        print(f"Error checking available models: {e}")
        return False

def main():
    """Main function to run the FastAPI server"""
    # Check if Ollama is running
    if not start_ollama():
        sys.exit(1)
    
    # Check available models
    if not check_available_models():
        print("Continuing anyway, but you may need to pull models first.")
    
    print("\nStarting Offline GPT backend server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main() 