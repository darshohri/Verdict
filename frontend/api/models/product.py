from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ShoppingProduct(BaseModel):
    id: str
    title: str
    brand: Optional[str] = None
    model: Optional[str] = None
    category: Optional[str] = None
    
    store: str  # "amazon" or "flipkart"
    url: str
    image: Optional[str] = None
    
    price: Optional[float] = None
    originalPrice: Optional[float] = None
    discountPercent: Optional[float] = None
    currency: str = "INR"
    
    rating: Optional[float] = None
    reviewCount: Optional[int] = None
    availability: Optional[str] = None
    
    sellerName: Optional[str] = None
    sellerRating: Optional[float] = None
    sellerReviewCount: Optional[int] = None
    
    features: List[str] = []
    
    sourceTimestamp: str
    
class NormalizedProductGroup(BaseModel):
    id: str
    title: str
    brand: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    features: List[str] = []
    
    products: List[ShoppingProduct]
    
    best_price: Optional[float] = None
    
    # Combined trust signals
    aggregate_rating: Optional[float] = None
    total_reviews: int = 0
    
    # Final ranking info
    rank_score: float = 0.0
    rank_reason: str = ""
    badges: List[str] = [] # "Best Overall", "Cheapest", "Most Trusted", "Best Value"

class IntentResult(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    series: Optional[str] = None
    search_query: str = ""  # The generated search query for marketplaces
    budget: Optional[float] = None
    currency: str = "INR"
    preferences: Dict[str, str] = {}
    is_generic: bool = False
    clarification_message: Optional[str] = None
