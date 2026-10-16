import json
import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from news_aggregator import aggregate_all_sources

def get_social_sentiment_data(ticker: str, page: int = 1, limit: int = 20) -> str:
    """
    Fetches raw social/news data, runs sentiment analysis via Groq, 
    and returns a structured JSON payload.
    """
    # 1. Fetch from Master Aggregator with Pagination
    raw_feed = aggregate_all_sources(ticker, page=page, limit=limit)
    if not raw_feed:
        return json.dumps([])
        
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            # Fallback if no LLM configured: just return raw with Neutral sentiment
            for item in raw_feed:
                item["sentiment"] = "Neutral"
            return json.dumps(raw_feed)
            
        # Initialize Groq - fast and lightweight
        llm = ChatGroq(
            temperature=0, 
            groq_api_key=api_key, 
            model_name="openai/gpt-oss-20b", # Use smaller model for fast batch inference
            max_retries=5
        )
        
        # Prepare the prompt payload
        # We process all items in one batch to save API calls and time
        feed_texts = ""
        for i, item in enumerate(raw_feed):
            feed_texts += f"ID: {i}\nSource: {item['source']}\nContent: {item['content'][:300]}\n\n"
            
        system_prompt = """
        You are an expert financial sentiment analyzer. I will provide you with a batch of social media posts and news snippets about a stock.
        For each ID, you must determine its sentiment strictly as "Bullish", "Bearish", or "Neutral".
        
        Respond ONLY with a valid JSON array of objects, where each object has:
        - "id": integer (matching the provided ID)
        - "sentiment": string ("Bullish", "Bearish", or "Neutral")
        
        Example output format:
        [
          {"id": 0, "sentiment": "Bullish"},
          {"id": 1, "sentiment": "Bearish"}
        ]
        Do not include markdown blocks, just the JSON string.
        """
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=feed_texts)
        ]
        
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Clean markdown if present
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        sentiment_results = json.loads(content)
        
        # Map sentiment back to the raw feed
        sentiment_map = {res["id"]: res["sentiment"] for res in sentiment_results}
        
        for i, item in enumerate(raw_feed):
            item["sentiment"] = sentiment_map.get(i, "Neutral")
            
        return json.dumps(raw_feed)
        
    except Exception as e:
        print(f"[SENTIMENT_ENGINE] Error: {e}")
        # Fallback
        for item in raw_feed:
            item["sentiment"] = "Neutral"
        return json.dumps(raw_feed)

if __name__ == "__main__":
    # Test script
    print(get_social_sentiment_data("AAPL"))
