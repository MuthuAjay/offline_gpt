import json
import os
from typing import Dict, List, Any, Optional
import time

class LocalCache:
    """Simple local cache implementation for storing chat responses"""
    
    def __init__(self, cache_dir: str = ".cache", max_age: int = 3600):
        """
        Initialize the cache
        
        Args:
            cache_dir: Directory to store cache files
            max_age: Maximum age of cache entries in seconds (default: 1 hour)
        """
        self.cache_dir = cache_dir
        self.max_age = max_age
        
        # Create cache directory if it doesn't exist
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
    
    def _get_cache_key(self, model: str, messages: List[Dict[str, str]]) -> str:
        """Generate a cache key from model and messages"""
        # Convert messages to a string representation
        message_str = json.dumps(messages, sort_keys=True)
        
        # Create a hash of the model and messages
        import hashlib
        key = hashlib.md5(f"{model}:{message_str}".encode()).hexdigest()
        
        return key
    
    def _get_cache_path(self, key: str) -> str:
        """Get the file path for a cache key"""
        return os.path.join(self.cache_dir, f"{key}.json")
    
    def get(self, model: str, messages: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
        """
        Get a cached response if available and not expired
        
        Args:
            model: The model name
            messages: List of message dictionaries
            
        Returns:
            Cached response or None if not found or expired
        """
        key = self._get_cache_key(model, messages)
        cache_path = self._get_cache_path(key)
        
        if not os.path.exists(cache_path):
            return None
        
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Check if cache is expired
            if time.time() - cache_data.get("timestamp", 0) > self.max_age:
                # Cache expired, remove it
                os.remove(cache_path)
                return None
            
            return cache_data.get("response")
        except Exception:
            # If there's any error reading the cache, return None
            return None
    
    def set(self, model: str, messages: List[Dict[str, str]], response: Dict[str, Any]) -> None:
        """
        Store a response in the cache
        
        Args:
            model: The model name
            messages: List of message dictionaries
            response: The response to cache
        """
        key = self._get_cache_key(model, messages)
        cache_path = self._get_cache_path(key)
        
        cache_data = {
            "timestamp": time.time(),
            "response": response
        }
        
        try:
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f)
        except Exception:
            # If there's any error writing to the cache, just continue without caching
            pass
    
    def clear(self) -> None:
        """Clear all cache entries"""
        for filename in os.listdir(self.cache_dir):
            if filename.endswith(".json"):
                os.remove(os.path.join(self.cache_dir, filename))
    
    def clear_expired(self) -> None:
        """Clear only expired cache entries"""
        current_time = time.time()
        
        for filename in os.listdir(self.cache_dir):
            if filename.endswith(".json"):
                file_path = os.path.join(self.cache_dir, filename)
                
                try:
                    with open(file_path, 'r') as f:
                        cache_data = json.load(f)
                    
                    # Check if cache is expired
                    if current_time - cache_data.get("timestamp", 0) > self.max_age:
                        os.remove(file_path)
                except Exception:
                    # If there's any error reading the cache, remove it
                    os.remove(file_path)

# Create a singleton instance
cache = LocalCache() 