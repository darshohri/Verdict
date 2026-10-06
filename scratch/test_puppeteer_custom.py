import os
from dotenv import load_dotenv
from apify_client import ApifyClient
import json

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

url = "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"

page_function = """
async function pageFunction(context) {
    const { page, request, log } = context;
    const title = await page.title();
    
    // Check if we are blocked
    if (title.toLowerCase().includes('bot') || title.includes('Access Denied')) {
        return { error: 'Blocked by Flipkart', title };
    }
    
    // Extract basic product details
    const productTitle = await page.evaluate(() => {
        const el = document.querySelector('.VU-ZEz');
        return el ? el.innerText : null;
    });
    
    const price = await page.evaluate(() => {
        const el = document.querySelector('.Nx9bqj.CxhGGd');
        return el ? el.innerText : null;
    });
    
    const rating = await page.evaluate(() => {
        const el = document.querySelector('.XQDdHH');
        return el ? el.innerText : null;
    });
    
    return {
        url: request.url,
        title,
        productTitle,
        price,
        rating
    };
}
"""

run_input = {
    "startUrls": [{"url": url}],
    "pageFunction": page_function,
    "proxyConfiguration": {"useApifyProxy": True},
    "preNavigationHooks": """
        [
            async (crawlingContext, gotoOptions) => {
                gotoOptions.waitUntil = 'networkidle2';
            }
        ]
    """,
}

try:
    print("Testing apify/puppeteer-scraper with custom script...")
    run = apify_client.actor("apify/puppeteer-scraper").call(run_input=run_input, memory_mbytes=1024)
    dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
    items = list(apify_client.dataset(dataset_id).iterate_items())
    print(json.dumps(items, indent=2))
except Exception as e:
    print("apify/puppeteer-scraper err:", e)
