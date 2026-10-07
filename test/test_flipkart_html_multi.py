import os
import json
from dotenv import load_dotenv
load_dotenv()
from apify_client import ApifyClient

apify_client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "startUrls": [{"url": "https://www.flipkart.com/search?q=iphone+15"}],
    "pageFunction": """
        async function pageFunction(context) {
            const { $, request, log } = context;
            const productLinks = $('a[href*="/p/itm"]');
            const items = [];
            
            productLinks.each((i, el) => {
                if (i >= 3) return;
                items.push({
                    index: i,
                    html: $(el).html()
                });
            });
            return items;
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True }
}

run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
dataset_id = run.get("defaultDatasetId") if getattr(run, "get", None) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
items_data = list(apify_client.dataset(dataset_id).iterate_items())
for item in items_data:
    print(json.dumps(item, indent=2))
