import os
import time
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv()
apify_client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "startUrls": [{"url": "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"}],
    "pageFunction": "async function pageFunction(context) { return { product: { name: 'iPhone' } }; }",
    "proxyConfiguration": { "useApifyProxy": True }
}
start = time.time()
print("Running apify...")
run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
end = time.time()
print(f"Time taken: {end - start:.2f} seconds")
