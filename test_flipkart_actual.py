import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.join(os.getcwd(), 'frontend', 'api'))

from core.config import apify_client
import urllib.parse

query = "asus laptop"
search_url = f"https://www.flipkart.com/search?q={urllib.parse.quote_plus(query)}"

run_input = {
    "startUrls": [{"url": search_url}],
    "pageFunction": """
        async function pageFunction(context) {
            const { $, request, log } = context;
            const items = [];
            
            const productContainers = $('div[data-id]');
            
            productContainers.each((i, el) => {
                if (i >= 5) return;
                
                const element = $(el);
                
                // Extract Title
                const title = element.find('div.KzDlHZ, a.wjcEIp, a.IRpwTa, div._4rR01T, a.s1Q9rs').first().text().trim();
                if (!title) return; // Skip if no title
                
                items.push({ title });
            });
            
            await context.pushData(items);
            return items;
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True }
}

run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
items_data = list(apify_client.dataset(dataset_id).iterate_items())
print("Total items found:", len(items_data))
