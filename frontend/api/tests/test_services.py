from services.marketplace.amazon_service import AmazonService
from services.marketplace.flipkart_service import FlipkartService

print("Testing Amazon:")
res_amzn = AmazonService.search("asus laptop", max_items=2)
for item in res_amzn:
    print(f"[{item.store}] {item.title[:30]}... | URL: {item.url} | IMG: {item.image}")

print("\nTesting Flipkart:")
res_flip = FlipkartService.search("asus laptop", max_items=2)
for item in res_flip:
    print(f"[{item.store}] {item.title[:30]}... | URL: {item.url} | IMG: {item.image}")
