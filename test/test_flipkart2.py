import os
import json
from dotenv import load_dotenv
load_dotenv()
from apify_client import ApifyClient

apify_client = ApifyClient(os.getenv("APIFY_API_TOKEN"))
runs = apify_client.actor("apify/playwright-scraper").runs().list().items
dataset_id = getattr(runs[0], 'default_dataset_id', runs[0].get("defaultDatasetId") if isinstance(runs[0], dict) else None)
if dataset_id:
    items_data = list(apify_client.dataset(dataset_id).iterate_items())
    for item in items_data:
        print(json.dumps(item, indent=2))
