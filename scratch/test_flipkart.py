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
            
            if (!product.name) {
                product.name = $('span.VU-Tz5').text().trim() || $('span.B_NuCI').text().trim() || $('h1').text().trim();
            }
            if (!product.image) {
                product.image = $('img._396cs4, img._2r_T1I, img.v2-Aam').attr('src');
            }
            
            const priceText = $('div.Nx9bqj.CrvsUO').text().trim() || $('div._30jeq3._16Jk6d').text().trim();
            if (priceText) {
                product.offers = product.offers || {};
                product.offers.price = priceText;
                product.offers.priceCurrency = 'INR';
            }
            
            const ratingText = $('div.ipqd2A, div._3LWZlK, div.XQDdHH').first().text().trim();
            const reviewsText = $('span.Wphh3N, span._2_R_DZ').first().text().trim();
            if (ratingText || reviewsText) {
                product.aggregateRating = product.aggregateRating || {};
                if (ratingText) product.aggregateRating.ratingValue = ratingText;
                if (reviewsText) {
                        const revCount = reviewsText.replace(/[^0-9]/g, '');
                        if (revCount) product.aggregateRating.reviewCount = revCount;
                }
            }
            
            if (!product.description) {
                const desc = $('div.yN\\+eNk, div._1mXcCf').text().trim();
                const highlights = [];
                $('ul.GNDEQ- li, ul._1mXcCf li, div.X3BRps li').each((i, el) => {
                    highlights.push($(el).text().trim());
                });
                product.description = desc + " " + highlights.join(". ");
            }
            
            let reviewList = product.review || [];
            if (!Array.isArray(reviewList)) reviewList = [reviewList];
            if (reviewList.length === 0) {
                $('div.Zmyqri, div.t-ZTKy').each((i, el) => {
                    reviewList.push({ reviewBody: $(el).text().trim() });
                });
                if (reviewList.length > 0) product.review = reviewList;
            }

            return { product, html_snippet: $('body').text().substring(0, 1000) };
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True }
}

print("Running scraper...")
run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
items = list(apify_client.dataset(dataset_id).iterate_items())

print(json.dumps(items, indent=2))
