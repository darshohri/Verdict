import datetime
from fastapi import APIRouter
from pydantic import BaseModel

from services.intent_service import IntentService
from services.marketplace.amazon_service import AmazonService
from services.marketplace.flipkart_service import FlipkartService
from services.matching_service import MatchingService
from services.ranking_service import RankingService

router = APIRouter()

class ShoppingSearchRequest(BaseModel):
    query: str

@router.post("/search")
async def shopping_search(request: ShoppingSearchRequest):
    query = request.query.strip()
    
    # 1. Intent Extraction
    intent = IntentService.parse_intent(query)
    search_term = intent.search_query if intent.search_query else query
    
    # 2. Marketplace Search
    # Note: running sequentially here for simplicity, but could be asyncio.gather in production
    amazon_products = AmazonService.search(search_term, max_items=5)
    flipkart_products = FlipkartService.search(search_term, max_items=5)
    
    all_products = amazon_products + flipkart_products
    
    # 3. Matching and Normalization
    grouped_products = MatchingService.match_and_normalize(all_products, query)
    
    # 4. Ranking and Categorization
    ranked_groups = RankingService.rank_products(grouped_products, intent)
    
    # 5. Build Response
    return {
        "query": query,
        "intent": intent.dict(),
        "marketplaces": {
            "amazon": {
                "status": "success" if len(amazon_products) > 0 else "failed",
                "resultCount": len(amazon_products)
            },
            "flipkart": {
                "status": "success" if len(flipkart_products) > 0 else "failed",
                "resultCount": len(flipkart_products)
            }
        },
        "results": [g.dict() for g in ranked_groups],
        "timestamp": datetime.datetime.now().isoformat()
    }
