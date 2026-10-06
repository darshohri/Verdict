import os
from dotenv import load_dotenv
from apify_client import ApifyClient
import json

load_dotenv(r"c:\Users\ASUS\Desktop\Projects\Verdict\.env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(APIFY_TOKEN)

url = "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"

run_input = {
    "startUrls": [{"url": url}],
    "pageFunction": """
        async function pageFunction(context) {
            const { page, request, log } = context;
            let product = {};
            
            // Wait for body
            await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
            
            const title = await page.title();
            
            try {
                // Try to get JSON-LD
                const jsonLds = await page.$$eval('script[type="application/ld+json"]', els => els.map(el => el.innerHTML));
                for (let text of jsonLds) {
                    try {
                        let data = JSON.parse(text);
                        if (Array.isArray(data)) data = data[0];
                        if (data['@type'] === 'Product') {
                            product = data;
                        }
                    } catch(e) {}
                }
            } catch(e) {}
            
            // If no product name from jsonld, try DOM
            if (!product.name) {
                product.name = await page.$eval('span.VU-Tz5', el => el.innerText).catch(() => '') 
                    || await page.$eval('span.B_NuCI', el => el.innerText).catch(() => '') 
                    || await page.$eval('h1', el => el.innerText).catch(() => '');
            }
            if (!product.image) {
                product.image = await page.$eval('img._396cs4, img._2r_T1I, img.v2-Aam', el => el.src).catch(() => '');
            }
            
            const priceText = await page.$eval('div.Nx9bqj.CrvsUO, div._30jeq3._16Jk6d', el => el.innerText).catch(() => '');
            if (priceText) {
                product.offers = product.offers || {};
                product.offers.price = priceText;
                product.offers.priceCurrency = 'INR';
            }
            
            const ratingText = await page.$eval('div.ipqd2A, div._3LWZlK, div.XQDdHH', el => el.innerText).catch(() => '');
            const reviewsText = await page.$eval('span.Wphh3N, span._2_R_DZ', el => el.innerText).catch(() => '');
            if (ratingText || reviewsText) {
                product.aggregateRating = product.aggregateRating || {};
                if (ratingText) product.aggregateRating.ratingValue = ratingText;
                if (reviewsText) {
                        const revCount = reviewsText.replace(/[^0-9]/g, '');
                        if (revCount) product.aggregateRating.reviewCount = revCount;
                }
            }
            
            if (!product.description) {
                const desc = await page.$eval('div.yN\\+eNk, div._1mXcCf', el => el.innerText).catch(() => '');
                product.description = desc;
            }
            
            return { product, title };
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True }
}

print("Running scraper...")
run = apify_client.actor("apify/playwright-scraper").call(run_input=run_input)
dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
items = list(apify_client.dataset(dataset_id).iterate_items())

print(json.dumps(items, indent=2))
