from apify_client import ApifyClient
from dotenv import load_dotenv
import os
import json

load_dotenv()
client = ApifyClient(os.getenv('APIFY_API_TOKEN'))

print("AMZN START")
run = client.actor('junglee/free-amazon-product-scraper').call(run_input={
    'categoryUrls': [{'url': 'https://www.amazon.in/s?k=asus+laptop'}],
    'maxItemsPerStartUrl': 2,
    'maxSearchPagesPerStartUrl': 1,
    'scrapeProductDetails': False
})
dataset_id = run.get('defaultDatasetId') if isinstance(run, dict) else getattr(run, 'default_dataset_id', getattr(run, 'defaultDatasetId', None))
dataset = client.dataset(dataset_id)
for item in dataset.iterate_items():
    print('AMZN URL:', item.get('url'))
    print('AMZN IMG THUMB:', item.get('thumbnailImage'))
    print('AMZN IMG HIGH:', item.get('highResolutionImages'))

print("FLIP START")
run_flip = client.actor('apify/cheerio-scraper').call(run_input={
    'startUrls': [{'url': 'https://www.flipkart.com/search?q=asus+laptop'}],
    'pageFunction': '''async function pageFunction(context) {
        const { $, request, log } = context;
        const items = [];
        const productLinks = $("a[href*='/p/itm']");
        productLinks.each((i, el) => {
            if (i >= 2) return;
            const img = $(el).find("img").attr("src");
            const alt = $(el).find("img").attr("alt");
            items.push({url: $(el).attr("href"), img: img, alt: alt});
        });
        await context.pushData(items);
    }'''
})
dataset_id_flip = run_flip.get('defaultDatasetId') if isinstance(run_flip, dict) else getattr(run_flip, 'default_dataset_id', getattr(run_flip, 'defaultDatasetId', None))
dataset_flip = client.dataset(dataset_id_flip)
for item in dataset_flip.iterate_items():
    print('FLIP URL:', item.get('url'))
    print('FLIP IMG:', item.get('img'))
