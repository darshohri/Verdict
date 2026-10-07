import json
import uuid
from typing import List
from core.config import groq_client
from models.product import ShoppingProduct, NormalizedProductGroup

class MatchingService:
    @staticmethod
    def match_and_normalize(products: List[ShoppingProduct], query: str = "") -> List[NormalizedProductGroup]:
        if not products:
            return []
            
        if not groq_client:
            # Fallback if no LLM: just create 1 group per product
            return [
                NormalizedProductGroup(
                    id=str(uuid.uuid4()),
                    title=p.title,
                    image=p.image,
                    features=p.features,
                    products=[p]
                ) for p in products
            ]
            
        # Serialize products to send to LLM
        products_json = []
        for p in products:
            products_json.append({
                "id": p.id,
                "title": p.title,
                "store": p.store,
                "price": p.price,
                "features": p.features[:3] # keep it short
            })
            
        prompt = f"""
You are a product matching expert. I will provide a list of products scraped from Amazon and Flipkart.
Your task is to group identical products together and FILTER OUT any products that violate the user's constraints.

USER'S ORIGINAL QUERY: "{query}"

CRITICAL RULES:
1. STRICT FILTERING: If the user's query contains a constraint (e.g. "under 60k", "less than 500", "only ASUS"), you MUST completely exclude any product that violates this constraint from your final output. Check the `price` of each product against budget constraints. (Note: 60k means 60,000).
2. Do NOT merge products if they are different variants (e.g. 128GB vs 256GB, RTX 4050 vs RTX 4060). Variant accuracy is critical.
3. Different stores will have slightly different titles for the exact same variant. You must match them.
4. Return strictly a JSON object with a single key "groups" containing a list of grouped objects.
5. Each group must contain:
   - "title": A clean, normalized title for the product (e.g. "ASUS ROG Strix G16 (RTX 4060, 16GB, 1TB)")
   - "product_ids": A list of the string IDs of the products that belong to this group.

Products:
{json.dumps(products_json, indent=2)}
"""
        
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile", # Most powerful Groq model
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data_text = completion.choices[0].message.content
                
            data = json.loads(data_text)
            
            groups = []
            for g in data.get("groups", []):
                grouped_products = [p for p in products if p.id in g.get("product_ids", [])]
                if not grouped_products:
                    continue
                    
                # Calculate aggregate info
                best_price = min([p.price for p in grouped_products if p.price is not None], default=None)
                images = [p.image for p in grouped_products if p.image]
                
                total_reviews = sum([p.reviewCount for p in grouped_products if p.reviewCount], 0)
                ratings = [p.rating for p in grouped_products if p.rating]
                aggregate_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
                
                groups.append(NormalizedProductGroup(
                    id=str(uuid.uuid4()),
                    title=g.get("title", grouped_products[0].title),
                    image=images[0] if images else None,
                    features=grouped_products[0].features, # Just grab features from the first one
                    products=grouped_products,
                    best_price=best_price,
                    aggregate_rating=aggregate_rating,
                    total_reviews=total_reviews
                ))
            return groups
            
        except Exception as e:
            print("Matching error:", e)
            # Fallback
            return [
                NormalizedProductGroup(
                    id=str(uuid.uuid4()),
                    title=p.title,
                    image=p.image,
                    features=p.features,
                    products=[p]
                ) for p in products
            ]
