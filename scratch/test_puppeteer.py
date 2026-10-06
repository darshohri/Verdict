import os
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

run_input = {
    "startUrls": [{"url": "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"}],
    "pageFunction": """
        async function pageFunction(context) {
            const { page } = context;
            const title = await page.title();
            return { title };
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True },
    "useChrome": True
}
try:
    run = apify_client.actor("apify/puppeteer-scraper").call(run_input=run_input)
    dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
    items = list(apify_client.dataset(dataset_id).iterate_items())
    print(items)
except Exception as e:
    print(e)
