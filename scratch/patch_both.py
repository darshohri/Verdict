import sys
import re

files_to_patch = [
    r"c:\Users\ASUS\Desktop\Projects\Verdict\frontend\api\index.py",
    r"c:\Users\ASUS\Desktop\Projects\Verdict\main.py"
]

replacement = """        is_flipkart_redirect = False
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
        except Exception as e:
            return {"error": f"Scraper error: {str(e)}"}"""

for file_path in files_to_patch:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # We want to replace from `if is_flipkart:` up to the end of the amazon block where it does `llm_context = json.dumps(...)[:6000]`
    # The pattern should be non-greedy.
    # Wait, there might be two `llm_context = json.dumps...` lines.
    # Let's match from `if is_flipkart:` to `llm_context = json.dumps(llm_context_dict)[:6000]` then `\n` or `\r\n`
    # and then there is `prompt = `
    
    # Let's split content by `if is_flipkart:`
    parts = content.split("        if is_flipkart:\n")
    if len(parts) == 2:
        before = parts[0]
        after_if = parts[1]
        
        # Now find `prompt = ` to know where the block ends completely.
        prompt_idx = after_if.find("        prompt = ")
        
        if prompt_idx != -1:
            after = after_if[prompt_idx:]
            
            new_content = before + replacement + "\n\n" + after
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Successfully patched {file_path}")
        else:
            print(f"Could not find prompt= in {file_path}")
            
            # For main.py, it's also `prompt = f"""`
            
    else:
        print(f"Could not find 'if is_flipkart:\\n' exactly once in {file_path}. Found {len(parts)} parts.")
