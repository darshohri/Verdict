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
            
            const productLinks = $('a[href*="/p/itm"]');
            const seen = new Set();
            
            productLinks.each((i, el) => {
                if (items.length >= 5) return;
                const url = $(el).attr('href');
                const cleanUrl = url.split('?')[0];
                if (seen.has(cleanUrl)) return;
                seen.add(cleanUrl);
                
                // image alt is usually the best title
                let title = $(el).find('img').attr('alt');
                if (!title) {
                    title = $(el).text().replace('Add to Compare', '').trim();
                }
                if (!title || title.length < 5) {
                    const parts = cleanUrl.split('/')[1];
                    if (parts) title = parts.replace(/-/g, ' ');
                }
                
                let container = $(el).closest('div[data-id]');
                if (!container.length) container = $(el).parent().parent().parent();
                
                const text = container.text();
                
                // Extract Price
                let priceText = "";
                const priceMatch = text.match(/₹([\\d,]+)/);
                if (priceMatch) {
                    priceText = priceMatch[1];
                }
                
                // Extract Rating
                let ratingText = "";
                const ratingMatch = text.match(/(\\d\\.\\d)★/);
                if (ratingMatch) {
                    ratingText = ratingMatch[1];
                }
                
                // Extract original price
                let origPrice = "";
                // usually there are two rupees symbols, second is original, or just use regex with strikethrough if we could, but text() strips html. 
                // Let's just find all matches
                const allPrices = [...text.matchAll(/₹([\\d,]+)/g)];
                if (allPrices.length > 1) {
                    origPrice = allPrices[1][1];
                }
                
                items.push({ 
                    title: title, 
                    url: 'https://www.flipkart.com' + cleanUrl,
                    priceText: priceText,
                    originalPriceText: origPrice,
                    ratingText: ratingText,
                    image: $(el).find('img').attr('src') || ''
                });
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
print("Found items:", len(items_data))
for i in items_data:
    try:
        print(i)
    except Exception:
        pass
