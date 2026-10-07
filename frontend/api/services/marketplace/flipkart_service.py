import datetime
import urllib.parse
from core.config import apify_client
from models.product import ShoppingProduct

class FlipkartService:
    @staticmethod
    def search(query: str, max_items: int = 5) -> list[ShoppingProduct]:
        if not apify_client:
            return []
            
        keyword = urllib.parse.quote_plus(query)
        search_url = f"https://www.flipkart.com/search?q={keyword}"
        
        run_input = {
            "startUrls": [{"url": search_url}],
            "pageFunction": """
                async function pageFunction(context) {
                    const { $, request, log } = context;
                    const items = [];
                    
                    const productLinks = $('a[href*="/p/itm"]');
                    const seen = new Set();
                    
                    productLinks.each((i, el) => {
                        if (items.length >= 10) return;
                        const href = $(el).attr('href');
                        if (!href) return;
                        
                        const url = href.startsWith('http') ? href : 'https://www.flipkart.com' + href;
                        const cleanUrl = url.split('?')[0];
                        if (seen.has(cleanUrl)) return;
                        seen.add(cleanUrl);
                        
                        let title = $(el).find('img').attr('alt');
                        if (!title) {
                            title = $(el).text().replace('Add to Compare', '').trim();
                        }
                        if (!title || title.length < 5) {
                            const parts = cleanUrl.split('/')[3] || cleanUrl.split('/')[1];
                            if (parts) title = parts.replace(/-/g, ' ');
                        }
                        
                        let container = $(el).closest('div[data-id]');
                        if (!container.length) container = $(el).parent().parent().parent();
                        
                        const text = container.text();
                        
                        let priceText = "";
                        const priceMatch = text.match(/₹([\\d,]+)/);
                        if (priceMatch) priceText = priceMatch[1];
                        
                        let ratingText = "";
                        const ratingMatch = text.match(/(\\d\\.\\d)★/);
                        if (ratingMatch) ratingText = ratingMatch[1];
                        
                        let origPrice = "";
                        const allPrices = [...text.matchAll(/₹([\\d,]+)/g)];
                        if (allPrices.length > 1) {
                            origPrice = allPrices[1][1];
                        }
                        
                        let image = '';
                        const imgs = $(el).find('img');
                        imgs.each((j, imgEl) => {
                            let src = $(imgEl).attr('src') || '';
                            if (src && !src.includes('data:image/') && !src.includes('placeholder') && !src.includes('fa_9e47c1') && !src.includes('assured')) {
                                if (src.startsWith('//')) {
                                    src = 'https:' + src;
                                }
                                if (!image || src.includes('rukminim')) {
                                    image = src;
                                }
                            }
                        });
                        
                        // We do not have easy access to reviews and features via this generic traversal, 
                        // but this ensures we don't break when DOM classes change.
                        
                        items.push({ 
                            title: title, 
                            url: url,
                            priceText: priceText,
                            originalPriceText: origPrice,
                            ratingText: ratingText,
                            image: image,
                            reviewsText: "",
                            features: []
                        });
                    });
                    
                    return items;
                }
            """,
            "proxyConfiguration": { "useApifyProxy": True }
        }
        
        try:
            run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
            dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
            items_data = list(apify_client.dataset(dataset_id).iterate_items())
            
            products = []
            if items_data and len(items_data) > 0:
                raw_items = items_data
                
                for item in raw_items:
                    title = item.get("title", "")
                    
                    # Parse price
                    price_text = item.get("priceText", "").replace(",", "").replace("₹", "").strip()
                    price = float(price_text) if price_text.isdigit() else None
                    if not price and price_text:
                        try: price = float(price_text)
                        except: pass
                        
                    if price and price > 10000000:
                        s = str(int(price))
                        try: price = float(s[:len(s)//2])
                        except: pass
                        
                    orig_text = item.get("originalPriceText", "").replace(",", "").replace("₹", "").strip()
                    original_price = float(orig_text) if orig_text.isdigit() else None
                    if not original_price and orig_text:
                        try: original_price = float(orig_text)
                        except: pass
                        
                    if original_price and original_price > 10000000:
                        s = str(int(original_price))
                        try: original_price = float(s[:len(s)//2])
                        except: pass
                        
                    rating_text = item.get("ratingText", "")
                    rating = float(rating_text) if rating_text else None
                    
                    reviews_text = item.get("reviewsText", "").replace(",", "").replace("(", "").replace(")", "").replace("Ratings", "").replace("Reviews", "").strip()
                    review_count = None
                    # Split usually gives something like "1,200 & 400" where first is ratings, second is reviews
                    try:
                        if "&" in reviews_text:
                            reviews_text = reviews_text.split("&")[0].strip()
                        review_count = int(reviews_text)
                    except:
                        pass
                        
                    product_id = item.get('url', '').split('/p/')[-1].split('?')[0][:15] if '/p/' in item.get('url', '') else str(hash(item.get('url', '')))[:10]
                    products.append(ShoppingProduct(
                        id=f"flp_{product_id}",
                        title=title,
                        store="flipkart",
                        url=item.get("url", ""),
                        image=item.get("image", ""),
                        price=price,
                        originalPrice=original_price,
                        currency="INR",
                        rating=rating,
                        reviewCount=review_count,
                        features=item.get("features", []),
                        sourceTimestamp=datetime.datetime.now().isoformat()
                    ))
            return products[:max_items]
        except Exception as e:
            print(f"Flipkart search error: {e}")
            return []
