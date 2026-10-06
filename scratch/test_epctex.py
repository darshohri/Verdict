import os
from dotenv import load_dotenv
from apify_client import ApifyClient
import json

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

url = "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"

run_input = {
    "startUrls": [{"url": url}],
    "maxItems": 1
}

print("Running scraper...")
try:
    run = apify_client.actor("epctex/flipkart-scraper").call(run_input=run_input)
    dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
    items = list(apify_client.dataset(dataset_id).iterate_items())
    print(json.dumps(items, indent=2))
except Exception as e:
    print("Error:", e)
