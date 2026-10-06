import os
from apify_client import ApifyClient
from dotenv import load_dotenv
import json

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "categoryUrls": [{"url": "https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY/"}],
    "maxItemsPerStartUrl": 1,
    "maxSearchPagesPerStartUrl": 1,
    "maxProductVariantsAsSeparateResults": 0,
    "useCaptchaSolver": False,
    "scrapeProductVariantPrices": False,
    "scrapeProductDetails": True,
}

print("Running apify actor for amazon...")
run = client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
print("Finished actor")

try:
    dataset_id = run["defaultDatasetId"]
except:
    dataset_id = run.get("defaultDatasetId") if hasattr(run, "get") else run.defaultDatasetId

items = list(client.dataset(dataset_id).iterate_items())
print(json.dumps(items, indent=2)[:3000])
