import os
import json
from apify_client import ApifyClient

APIFY_TOKEN = os.environ.get("APIFY_API_TOKEN", "apify_api_EANH3HhE7CjSReO254m006Bv1V9vGZ0W1O0O")
apify_client = ApifyClient(APIFY_TOKEN)

run_input = {
    "startUrls": [{"url": "https://www.flipkart.com/red-tape-lifestyle-elevated-everyday-style-walking-shoes-men/p/itmd5db05b38ed6b"}],
    "maxItems": 1
}

run = apify_client.actor("epctex/flipkart-scraper").call(run_input=run_input)
items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())

print(json.dumps(items, indent=2))
