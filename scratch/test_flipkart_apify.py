import os
from apify_client import ApifyClient
from dotenv import load_dotenv
import json

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

run_input = {
    "startUrls": [{"url": "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4"}],
    "pageFunction": """
        async function pageFunction(context) {
            const { $ } = context;
            
            // Get raw JSON-LD
            const jsonLds = [];
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    jsonLds.push(JSON.parse($(el).html()));
                } catch(e) {}
            });
            
            // Try to manually scrape some elements as fallback
            const title = $('span.VU-Tz5').text() || $('span.B_NuCI').text() || $('h1').text();
            const price = $('div.Nx9bqj.CrvsUO').text() || $('div._30jeq3._16Jk6d').text();
            
            const rating = $('div.ipqd2A').text() || $('div._3LWZlK').text();
            const reviewCountStr = $('span.Wphh3N').text() || $('span._2_R_DZ').text();
            
            const description = $('div.yN+eNk').text() || $('div._1mXcCf').text();
            
            const bullets = [];
            $('ul.GNDEQ- li, ul._1mXcCf li').each((i, el) => {
                bullets.push($(el).text());
            });

            const reviews = [];
            $('div.Zmyqri, div.t-ZTKy').each((i, el) => {
                reviews.push($(el).text());
            });
            
            return {
                title,
                price,
                rating,
                reviewCountStr,
                description,
                bullets,
                reviews,
                jsonLds
            };
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True }
}

print("Running apify actor...")
run = client.actor("apify/cheerio-scraper").call(run_input=run_input)
print("Finished actor")

items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
print(json.dumps(items, indent=2))
