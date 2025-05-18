# web_search_free.py
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
import re
from urllib.parse import quote_plus
import random
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    published_date: Optional[str] = None

class DuckDuckGoSearchTool:
    """A tool for performing web searches using DuckDuckGo without requiring an API key."""
    
    async def search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a web search for the given query using DuckDuckGo.
        
        Args:
            query: The search query
            num_results: Number of results to return
            
        Returns:
            A list of search results, each containing title, snippet, and URL
        """
        try:
            # Use the HTML endpoint
            encoded_query = quote_plus(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                # Simple regex-based parsing to extract results
                # Note: This is a very basic implementation and might break if DuckDuckGo changes their HTML structure
                results = []
                
                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find all result elements
                    result_elements = soup.select('.result')
                    
                    for element in result_elements[:num_results]:
                        try:
                            title_elem = element.select_one('.result__title')
                            url_elem = element.select_one('.result__url')
                            snippet_elem = element.select_one('.result__snippet')
                            
                            title = title_elem.get_text(strip=True) if title_elem else "No title"
                            url = url_elem.get_text(strip=True) if url_elem else "No URL"
                            
                            # Get the actual URL from the link
                            link_elem = title_elem.select_one('a') if title_elem else None
                            if link_elem and 'href' in link_elem.attrs:
                                href = link_elem['href']
                                if href.startswith('/'):
                                    # Extract the actual URL from DuckDuckGo's redirect
                                    match = re.search(r'uddg=([^&]+)', href)
                                    if match:
                                        url = match.group(1)
                            
                            snippet = snippet_elem.get_text(strip=True) if snippet_elem else "No description"
                            
                            results.append({
                                'title': title,
                                'url': url,
                                'snippet': snippet,
                                'published_date': None  # DuckDuckGo HTML doesn't provide dates
                            })
                        except Exception as e:
                            logger.error(f"Error parsing result element: {str(e)}")
                            continue
                            
                except ImportError:
                    logger.error("BeautifulSoup is not installed. Cannot parse HTML results.")
                    return []
                
                return results
                
        except Exception as e:
            logger.error(f"Error in DuckDuckGo search: {str(e)}")
            return []


class WebFetchTool:
    """A tool for fetching and parsing web content from URLs."""
    
    async def fetch(self, url: str) -> Dict[str, Any]:
        """
        Fetch and parse content from a URL.
        
        Args:
            url: The URL to fetch
            
        Returns:
            A dictionary containing the parsed webpage content
        """
        try:
            # Fetch the webpage
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                # Basic content extraction - you might want to install additional libraries
                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style"]):
                        script.extract()
                    
                    # Extract text
                    text = soup.get_text(separator='\n')
                    
                    # Extract title
                    title = soup.title.string if soup.title else ""
                    
                    # Extract main content (simple heuristic)
                    paragraphs = [p.get_text() for p in soup.find_all('p')]
                    main_content = '\n\n'.join(paragraphs)
                except ImportError:
                    # Fallback if BeautifulSoup is not installed
                    text = response.text
                    title = ""
                    main_content = text[:2000]  # Just take first 2000 chars as a fallback
                
                result = {
                    'url': url,
                    'title': title,
                    'text': text[:5000] if len(text) > 5000 else text,  # Limit text size
                    'main_content': main_content[:3000] if len(main_content) > 3000 else main_content,
                    'status_code': response.status_code
                }
                
                return result
                
        except Exception as e:
            logger.error(f"Error fetching URL {url}: {str(e)}")
            return {
                'url': url,
                'error': str(e),
                'status_code': None
            }