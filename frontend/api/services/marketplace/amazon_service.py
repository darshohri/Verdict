import datetime
from core.config import apify_client
from models.product import ShoppingProduct

class AmazonService:
    @staticmethod
    def search(query: str, max_items: int = 5) -> list[ShoppingProduct]:
        if not apify_client:
            return []
            
        run_input = {
            "keyword": query,
            "maxItemsPerStartUrl": max_items,
            "maxSearchPagesPerStartUrl": 1,
            "maxProductVariantsAsSeparateResults": 0,
            "useCaptchaSolver": False,
            "scrapeProductVariantPrices": False,
            "scrapeProductDetails": False, # Just get search results to save time/cost
        }
        
        try:
            run = apify_client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
            dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
            items = list(apify_client.dataset(dataset_id).iterate_items())
            
            products = []
            for item in items:
                title = item.get("title", "")
                url = item.get("url", "")
                
                # Parse price
                price_val = item.get("price")
                price = None
                currency = "INR"
                if isinstance(price_val, dict):
                    price_num = price_val.get("value")
                    if price_num: price = float(price_num)
                    currency = price_val.get("currency", "INR")
                elif price_val is not None:
                    try:
                        price = float(price_val)
                    except:
                        pass
                
                original_price_val = item.get("originalPrice")
                original_price = None
                if isinstance(original_price_val, dict):
                    orig_num = original_price_val.get("value")
                    if orig_num: original_price = float(orig_num)
                
                # Image
                high_res = item.get("highResolutionImages", [])
                image = high_res[0] if high_res else item.get("thumbnailImage", "")
                
                # Rating
                rating = item.get("stars", None)
                if rating: rating = float(rating)
                
                review_count = item.get("reviewsCount", None)
                if review_count: review_count = int(review_count)
                
                products.append(ShoppingProduct(
                    id=f"amz_{url.split('/')[-1] if '/' in url else title[:10]}",
                    title=title,
                    store="amazon",
                    url=url,
                    image=image,
                    price=price,
                    originalPrice=original_price,
                    currency=currency,
                    rating=rating,
                    reviewCount=review_count,
                    features=item.get("features", []),
                    sourceTimestamp=datetime.datetime.now().isoformat()
                ))
            return products
        except Exception as e:
            print(f"Amazon search error: {e}")
            return []
