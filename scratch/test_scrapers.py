import os
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

url = "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"

actor_ids = [
    "smacient/flipkart-scraper",
    "insights-data/flipkart-product-scraper",
    "easyapi/flipkart-product-scraper",
    "canadesk/flipkart-scraper",
    "epctex/flipkart-scraper",
    "scrapeitcloud/flipkart-scraper"
]

for act in actor_ids:
    print(f"Testing {act}")
    try:
        run = apify_client.actor(act).call(run_input={"startUrls": [{"url": url}]}, memory_mbytes=512)
        dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
        items = list(apify_client.dataset(dataset_id).iterate_items())
        print(f"Success for {act}: found {len(items)} items")
    except Exception as e:
        print(f"{act} failed: {e}")
