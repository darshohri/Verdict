import json
from core.config import groq_client
from models.product import IntentResult

class IntentService:
    @staticmethod
    def parse_intent(query: str) -> IntentResult:
        if not groq_client:
            raise Exception("Groq client not initialized")
            
        prompt = f"""
You are a shopping intent extractor. Given the following user query, extract the shopping intent.
Return strictly a JSON object with the following schema:
{{
  "category": "string or null",
  "brand": "string or null",
  "series": "string or null",
  "search_query": "string (the best optimized generic search phrase for Amazon/Flipkart)",
  "budget": float or null,
  "preferences": {{"price_priority": "high/medium/low", "trust_priority": "high/medium/low"}}
}}

User Query: "{query}"
"""
        try:
            completion = groq_client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data_text = completion.choices[0].message.content
                
            content = data_text
            data = json.loads(content)
            return IntentResult(**data)
        except Exception as e:
            # Fallback intent
            return IntentResult(search_query=query)
