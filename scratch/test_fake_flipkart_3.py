import os
import json
from dotenv import load_dotenv
from apify_client import ApifyClient

load_dotenv()
apify_client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "startUrls": [{"url": "https://flipkart.com/12345"}],
    "pageFunction": """
        async function pageFunction(context) {
            const { $, request, log } = context;
            let product = {};
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    let data = JSON.parse($(el).html());
                    if (Array.isArray(data)) data = data[0];
                    if (data['@type'] === 'Product') {
                        product = data;
                    }
                } catch(e) {}
            });
            
            // Fallback manual DOM extraction
            if (!product.name) {
                product.name = $('span.VU-Tz5').text().trim() || $('span.B_NuCI').text().trim() || $('h1').text().trim();
            }
            if (!product.image) {
                product.image = $('img._396cs4, img._2r_T1I, img.v2-Aam').attr('src');
            }
            
            return { product };
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True },
    "maxRequestRetries": 0,
    "pageLoadTimeoutSecs": 15,
    "requestTimeoutSecs": 15
}

print("Running apify...")
try:
    run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
    items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
    print("Items:", items)
except Exception as e:
    print("Error:", e)
