import os
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()
client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "categoryUrls": [{ "url": "https://www.amazon.in/RUGMORA-Hand-Tufted-Wool-Rug/dp/B0GRMZVP5X" }],
    "maxItemsPerStartUrl": 1,
    "maxSearchPagesPerStartUrl": 1,
    "maxProductVariantsAsSeparateResults": 0,
    "useCaptchaSolver": False,
    "scrapeProductVariantPrices": False,
    "scrapeProductDetails": True,
}

print("Running actor...")
run = client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
items = list(client.dataset(run.default_dataset_id).iterate_items())

if items:
    data = items[0]
    keys = list(data.keys())
    print("KEYS:", keys)
    for k in keys:
        if "img" in k.lower() or "image" in k.lower() or "pic" in k.lower() or "thumb" in k.lower():
            print(f"FOUND IMAGE KEY '{k}':", data[k])
else:
    print("No items.")
