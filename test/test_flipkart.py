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
            const { page, request, log } = context;
            
            // Wait for products to load
            await page.waitForSelector('a[href*="/p/itm"]', { timeout: 10000 }).catch(() => {});
            
            // Scroll down a bit to trigger lazy loading for images
            await page.evaluate(async () => {
                for(let i=0; i<3; i++) {
                    window.scrollBy(0, window.innerHeight);
                    await new Promise(r => setTimeout(r, 500));
                }
            });
            
            // Evaluate in browser context
            const extracted = await page.evaluate(() => {
                const results = [];
                const productLinks = document.querySelectorAll('a[href*="/p/itm"]');
                const seen = new Set();
                
                for (const el of productLinks) {
                    if (results.length >= 10) break;
                    const href = el.getAttribute('href');
                    if (!href) continue;
                    
                    const url = href.startsWith('http') ? href : 'https://www.flipkart.com' + href;
                    let cleanUrl = url;
                    if (url.includes('?')) {
                        const urlObj = new URL(url);
                        const pid = urlObj.searchParams.get('pid');
                        const lid = urlObj.searchParams.get('lid');
                        urlObj.search = '';
                        if (pid) urlObj.searchParams.set('pid', pid);
                        if (lid) urlObj.searchParams.set('lid', lid);
                        cleanUrl = urlObj.toString();
                    }
                    
                    if (seen.has(cleanUrl)) continue;
                    seen.add(cleanUrl);
                    
                    let title = '';
                    const imgEl = el.querySelector('img');
                    if (imgEl) title = imgEl.getAttribute('alt');
                    
                    let image = '';
                    const imgs = el.querySelectorAll('img');
                    for (const img of imgs) {
                        let src = img.getAttribute('src') || '';
                        if (src && !src.includes('data:image/') && !src.includes('placeholder') && !src.includes('fa_9e47c1') && !src.includes('assured')) {
                            if (src.startsWith('//')) {
                                src = 'https:' + src;
                            }
                            if (!image || src.includes('rukminim')) {
                                image = src;
                            }
                        }
                    }
                    
                    results.push({ 
                        title: title, 
                        url: cleanUrl,
                        image: image
                    });
                }
                return results;
            });
            
            return extracted;
        }
    """,
    "proxyConfiguration": { "useApifyProxy": True }
}

run = apify_client.actor("apify/playwright-scraper").call(run_input=run_input)
dataset_id = run.get("defaultDatasetId")
items_data = list(apify_client.dataset(dataset_id).iterate_items())
for item in items_data:
    print(json.dumps(item, indent=2))
