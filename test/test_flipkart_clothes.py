import asyncio
import sys
sys.path.append('frontend/api')
from services.marketplace.flipkart_service import FlipkartService

async def test_search():
    products = FlipkartService.search("layzee Striped Men's Black Blue Track Pants", max_items=2)
    for p in products:
        print(f"Title: {p.title}")
        print(f"URL: {p.url}")
        print(f"Image: {p.image}")

if __name__ == "__main__":
    asyncio.run(test_search())
