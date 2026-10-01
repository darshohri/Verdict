import os
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()
client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "startUrls": [{ "url": "https://www.flipkart.com/triggr-wukong-35db-anc-4-mic-enc-dual-pairing-fast-charge-40-hrs-gaming-tws-bluetooth-headset/p/itme74a274b5c77e" }],
    "maxItems": 1,
}

try:
    print("Running apify/flipkart-scraper...")
    run = client.actor("apify/flipkart-scraper").call(run_input=run_input)
    items = list(client.dataset(run.default_dataset_id).iterate_items())

    if items:
        print("KEYS:", items[0].keys())
        print("Data:", items[0])
    else:
        print("No items.")
except Exception as e:
    print("Error:", e)
