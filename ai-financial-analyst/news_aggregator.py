import os
import requests
import praw
import yfinance as yf
import xml.etree.ElementTree as ET
import urllib.parse
from youtubesearchpython import VideosSearch

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

def get_stocktwits_feed(ticker: str, limit: int = 10) -> list:
    """Fetch raw social feed from StockTwits for a given ticker."""
    feed = []
    try:
        url = f"https://api.stocktwits.com/api/2/streams/symbol/{ticker}.json"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            messages = data.get("messages", [])[:limit]
            for msg in messages:
                feed.append({
                    "source": "StockTwits",
                    "source_type": "social",
                    "content": msg.get("body", ""),
                    "url": f"https://stocktwits.com/message/{msg.get('id')}",
                    "verified": False
                })
    except Exception as e:
        print(f"[StockTwits] Error fetching for {ticker}: {e}")
        
    # Fallback to DDG search if API fails or returns empty
    if not feed and DDGS:
        try:
            ddgs = DDGS()
            results = list(ddgs.text(f"{ticker} site:stocktwits.com", max_results=limit))
            for res in results:
                feed.append({
                    "source": "StockTwits",
                    "source_type": "social",
                    "content": res.get("body", ""),
                    "url": res.get("href", ""),
                    "verified": False
                })
        except Exception as e:
            print(f"[StockTwits DDG Fallback] Error: {e}")
            
    return feed

def get_reddit_feed(ticker: str, limit: int = 5) -> list:
    """Fetch raw posts from Reddit using PRAW if credentials exist, else fallback to raw JSON."""
    feed = []
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    
    if client_id and client_secret:
        try:
            reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=os.getenv("REDDIT_USER_AGENT", "web:ai-financial-analyst:v1.0")
            )
            for submission in reddit.subreddit("wallstreetbets+stocks+investing").search(ticker, sort="new", limit=limit):
                feed.append({
                    "source": "Reddit",
                    "source_type": "social",
                    "content": f"{submission.title}\n{submission.selftext[:200]}",
                    "url": f"https://reddit.com{submission.permalink}",
                    "verified": False
                })
            return feed
        except Exception as e:
            print(f"[Reddit PRAW] Error: {e}")
            
    # Fallback to public JSON if PRAW fails or no credentials
    try:
        url = f"https://www.reddit.com/r/wallstreetbets/search.json?q={ticker}&restrict_sr=1&sort=new&limit={limit}"
        headers = {"User-agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            children = data.get("data", {}).get("children", [])
            for child in children:
                post = child.get("data", {})
                feed.append({
                    "source": "Reddit",
                    "source_type": "social",
                    "content": f"{post.get('title')}\n{post.get('selftext', '')[:200]}",
                    "url": f"https://reddit.com{post.get('permalink')}",
                    "verified": False
                })
    except Exception as e:
        print(f"[Reddit JSON] Error fetching for {ticker}: {e}")
        
    return feed

def get_news_feed(ticker: str, limit: int = 20) -> list:
    """Fetch structured news from Google News RSS and yfinance."""
    feed = []
    
    # 1. Google News RSS (Global & Regional)
    try:
        encoded_query = urllib.parse.quote(f"{ticker} stock news")
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        response = requests.get(rss_url, timeout=5)
        if response.status_code == 200:
            root = ET.fromstring(response.content)
            items = root.findall(".//item")[:limit]
            for item in items:
                title = item.findtext("title", "")
                link = item.findtext("link", "")
                source = item.findtext("source", "Google News")
                if title:
                    feed.append({
                        "source": source,
                        "source_type": "news",
                        "content": title,
                        "url": link,
                        "verified": True
                    })
    except Exception as e:
        print(f"[News Google RSS] Error: {e}")

    # 2. YFinance
    try:
        stock = yf.Ticker(ticker)
        news = stock.news
        for item in news[:limit//2]:
            content_dict = item.get("content", {})
            provider = content_dict.get("provider", {})
            urls = content_dict.get("clickThroughUrl") or content_dict.get("canonicalUrl") or {}
            
            title = content_dict.get("title") or item.get("title") or ""
            source = provider.get("displayName") or item.get("publisher") or "Yahoo Finance"
            link = urls.get("url") or item.get("link") or ""

            if title:
                feed.append({
                    "source": source,
                    "source_type": "news",
                    "content": title,
                    "url": link,
                    "verified": True
                })
    except Exception as e:
        print(f"[News yfinance] Error: {e}")
        
    return feed

def get_youtube_feed(ticker: str, limit: int = 3) -> list:
    """Fetch recent YouTube videos related to the ticker using youtube-search-python."""
    feed = []
    try:
        query = f"{ticker} stock analysis"
        videosSearch = VideosSearch(query, limit=limit)
        results = videosSearch.result()
        for video in results.get("result", []):
            title = video.get("title") or ""
            channel = (video.get("channel") or {}).get("name") or "YouTube"
            url = video.get("link") or ""
            published = video.get("publishedTime") or ""
            if title:
                feed.append({
                    "source": "YouTube",
                    "source_type": "video",
                    "content": f"{title} (by {channel}, {published})",
                    "url": url,
                    "verified": True
                })
    except Exception as e:
        print(f"[YouTube] Error fetching for {ticker}: {e}")

    if not feed:
        try:
            encoded_query = urllib.parse.quote(f"{ticker} stock analysis youtube")
            rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
            response = requests.get(rss_url, timeout=5)
            if response.status_code == 200:
                root = ET.fromstring(response.content)
                for item in root.findall(".//item")[:limit]:
                    title = item.findtext("title", "")
                    link = item.findtext("link", "")
                    if title:
                        feed.append({
                            "source": "YouTube",
                            "source_type": "video",
                            "content": title,
                            "url": link,
                            "verified": True
                        })
        except Exception as e:
            print(f"[YouTube RSS Fallback] Error fetching for {ticker}: {e}")

    return feed

def aggregate_all_sources(ticker: str, page: int = 1, limit: int = 20) -> list:
    """Master aggregator function returning a paginated, combined, raw feed."""
    max_fetch = max(20, limit * max(page, 1))
    source_batches = [
        get_news_feed(ticker, limit=max_fetch),
        get_stocktwits_feed(ticker, limit=max_fetch),
        get_reddit_feed(ticker, limit=max_fetch),
        get_youtube_feed(ticker, limit=max_fetch),
    ]

    source_batches = [
        [item for item in batch if item.get("content") and len(item.get("content").strip()) > 5]
        for batch in source_batches
    ]

    feed = []
    max_len = max((len(batch) for batch in source_batches), default=0)
    for index in range(max_len):
        for batch in source_batches:
            if index < len(batch):
                feed.append(batch[index])

    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    return feed[start_idx:end_idx]
