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
                    
                    // Try targeting common search result container classes
                    const productContainers = $('div[data-id]');
                    
                    productContainers.each((i, el) => {
                        if (i >= 5) return; // Limit to max_items internally
                        
                        const element = $(el);
                        
                        // Extract Title
                        const title = element.find('div.KzDlHZ, a.wjcEIp, a.IRpwTa, div._4rR01T, a.s1Q9rs').first().text().trim();
                        if (!title) return; // Skip if no title
                        
                        // Extract URL
                        let url = element.find('a.CGtC98, a.VJA3rP, a').first().attr('href');
                        if (url && !url.startsWith('http')) {
                            url = 'https://www.flipkart.com' + url.split('?')[0]; // Clean URL tracking params
                        }
                        
                        // Extract Price
                        const priceText = element.find('div.Nx9bqj, div._30jeq3').first().text().trim();
                        const originalPriceText = element.find('div.yRaY8j, div._3I9_wc').first().text().trim();
                        
                        // Extract Image
                        const image = element.find('img.DByuf4, img._396cs4, img').first().attr('src');
                        
                        // Extract Rating & Reviews
                        const ratingText = element.find('div.XQDdHH, div._3LWZlK').first().text().trim();
                        const reviewsText = element.find('span.Wphh3N, span._2_R_DZ').first().text().trim();
                        
                        // Extract Features (usually bullet points in list view)
                        const features = [];
                        element.find('ul.G4BRas li, ul.vFw0gD li, li.rgWa7D').each((j, li) => {
                            features.push($(li).text().trim());
                        });
                        
                        items.push({
                            title,
                            url: url || search_url,
                            priceText,
                            originalPriceText,
                            image,
                            ratingText,
                            reviewsText,
                            features
                        });
                    });
                    
                    return { items };
                }
            """,
            "proxyConfiguration": { "useApifyProxy": True }
        }
        
        try:
            run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
            dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
            items_data = list(apify_client.dataset(dataset_id).iterate_items())
            
            products = []
            if items_data and len(items_data) > 0 and 'items' in items_data[0]:
                raw_items = items_data[0]['items']
                
                for item in raw_items:
                    title = item.get("title", "")
                    
                    # Parse price
                    price_text = item.get("priceText", "").replace(",", "").replace("₹", "").strip()
                    price = float(price_text) if price_text.isdigit() else None
                    if not price and price_text:
                        try: price = float(price_text)
                        except: pass
                        
                    orig_text = item.get("originalPriceText", "").replace(",", "").replace("₹", "").strip()
                    original_price = float(orig_text) if orig_text.isdigit() else None
                    if not original_price and orig_text:
                        try: original_price = float(orig_text)
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
                        
                    products.append(ShoppingProduct(
                        id=f"flp_{item.get('url', '').split('/p/')[0].split('/')[-1][:10]}",
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
