import asyncio
import sys
sys.path.append('frontend/api')
from services.matching_service import MatchingService
from models.product import ShoppingProduct

async def test_matching():
    products = [
        ShoppingProduct(id="1", title="iPhone 15 128GB", store="flipkart", price=65000, url="", image="", features=[], sourceTimestamp=""),
        ShoppingProduct(id="2", title="iPhone 15 128GB", store="amazon", price=66000, url="", image="", features=[], sourceTimestamp=""),
        ShoppingProduct(id="3", title="iPhone 13 128GB", store="amazon", price=52000, url="", image="", features=[], sourceTimestamp=""),
        ShoppingProduct(id="4", title="Samsung Galaxy M34", store="flipkart", price=16000, url="", image="", features=[], sourceTimestamp="")
    ]
    groups = MatchingService.match_and_normalize(products, query="iphone under 60k")
    print(f"Returned {len(groups)} groups")
    for g in groups:
        print(f"Group: {g.title}, Price: {g.best_price}")

if __name__ == "__main__":
    asyncio.run(test_matching())
