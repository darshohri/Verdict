import os
from dotenv import load_dotenv
from apify_client import ApifyClient
import json

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

url = "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"

try:
    print("Testing easyapi/flipkart-product-scraper with correct params")
    run = apify_client.actor("easyapi/flipkart-product-scraper").call(run_input={"startUrls": [{"url": url}]}, memory_mbytes=512)
    dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
    items = list(apify_client.dataset(dataset_id).iterate_items())
    print(json.dumps(items[:1], indent=2))
except Exception as e:
    print("easyapi err:", e)
