import os
from dotenv import load_dotenv
from apify_client import ApifyClient
import json

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

keyword = "apple iphone 15 black 128 gb"

run_input = {
    "keyword": keyword,
    "maxItemsPerStartUrl": 1,
    "maxSearchPagesPerStartUrl": 1,
    "maxProductVariantsAsSeparateResults": 0,
    "useCaptchaSolver": False,
    "scrapeProductVariantPrices": False,
    "scrapeProductDetails": True,
}

try:
    print("Testing junglee/free-amazon-product-scraper with keyword search...")
    run = apify_client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
    dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
    items = list(apify_client.dataset(dataset_id).iterate_items())
    
    if items:
        print(f"Success! Found {items[0].get('title')}")
    else:
        print("No items found.")
except Exception as e:
    print("junglee scraper err:", e)
