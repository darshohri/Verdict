import sys

file_path = r"c:\Users\ASUS\Desktop\Projects\Verdict\frontend\api\index.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "            if is_flipkart:\n                run_input = {\n                    \"startUrls\": [{\"url\": url}],"
end_marker = "                llm_context = json.dumps(llm_context_dict)[:6000]\n"

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    
    replacement = """            is_flipkart_redirect = False
            if is_flipkart:
                import urllib.parse
                parsed_url = urllib.parse.urlparse(url)
                path_parts = parsed_url.path.strip('/').split('/')
                if len(path_parts) > 0 and path_parts[0] not in ('p', 'search'):
                    slug = path_parts[0]
                    keyword = slug.replace('-', '+')
                    url = f"https://www.amazon.in/s?k={keyword}"
                    is_flipkart_redirect = True
                else:
                    return {"error": "Could not parse Flipkart product name from URL."}

            run_input = {
                "categoryUrls": [{ "url": url }],
                "maxItemsPerStartUrl": 1,
                "maxSearchPagesPerStartUrl": 1,
                "maxProductVariantsAsSeparateResults": 0,
                "useCaptchaSolver": False,
                "scrapeProductVariantPrices": False,
                "scrapeProductDetails": True,
            }

            try:
                run = apify_client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
                dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
                items = list(apify_client.dataset(dataset_id).iterate_items())
                
                if not items:
                    if is_flipkart_redirect:
                        return {"error": "Could not fetch equivalent product data from Amazon for this Flipkart URL."}
                    return {"error": "Could not extract data from the provided URL"}
                    
                product_data = items[0]
                product_name = product_data.get("title", "Unknown Product")
                
                high_res = product_data.get("highResolutionImages", [])
                product_image = high_res[0] if high_res else product_data.get("thumbnailImage", "")
                
                price_val = product_data.get("price")
                if isinstance(price_val, dict):
                    price = price_val.get("value", "Unknown")
                    currency = price_val.get("currency", "INR")
                else:
                    price = price_val if price_val is not None else "Unknown"
                    currency = product_data.get("currency", "INR")
                    
                llm_context_dict = {
                    "title": product_name,
                    "description": product_data.get("description", ""),
                    "price": price,
                    "currency": currency,
                    "bullets": product_data.get("features", []),
                    "rating": product_data.get("stars", 0),
                    "reviewsCount": product_data.get("reviewsCount", 0)
                }
                llm_context = json.dumps(llm_context_dict)[:6000]
"""
    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched index.py")
else:
    print("Markers not found!")
    if start_marker not in content:
        print("Start marker not found.")
    if end_marker not in content:
        print("End marker not found.")
