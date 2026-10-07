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
                if (i >= 5) return;
                
                let image = '';
                let all_srcs = [];
                const imgs = $(el).find('img');
                
                imgs.each((j, imgEl) => {
                    let src = $(imgEl).attr('src') || '';
                    all_srcs.push(src);
                    
                    if (src && !src.includes('data:image/') && !src.includes('placeholder') && !src.includes('fa_9e47c1') && !src.includes('assured')) {
                        if (src.startsWith('//')) {
                            src = 'https:' + src;
                        }
                        if (!image || src.includes('rukminim')) {
                            image = src;
                        }
                    }
                });
                
                let href = $(el).attr('href');
                let url = href && href.startsWith('http') ? href : 'https://www.flipkart.com' + href;
                let cleanUrl = url.split('?')[0]; // Here is the bug that cuts out ?pid
                
                items.push({
                    index: i,
                    final_image: image,
                    all_srcs: all_srcs,
                    raw_href: href,
                    cleanUrl: cleanUrl,
                    url: url
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
