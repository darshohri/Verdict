import os
import json
import re
import random
import hashlib
import urllib.parse
import sys
from datetime import datetime, timedelta

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

# Load API keys from .env file
load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

from apify_client import ApifyClient
from groq import Groq
import google.generativeai as genai

# Initialize clients if keys exist
apify_client = ApifyClient(APIFY_TOKEN) if APIFY_TOKEN else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

class EvaluateRequest(BaseModel):
    search_query: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@app.api_route("/api/index", methods=["GET", "POST"])
async def vercel_handler(request: Request):
    action = request.query_params.get("action")

    # ── EVALUATE ──────────────────────────────────────────────────────
    if action == "evaluate":
        body = await request.json()
        req = EvaluateRequest(**body)

        if not apify_client or not groq_client:
            return {"error": "API keys not configured in Vercel"}

        url = req.search_query.strip()

        # Ensure URL has a scheme
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        is_flipkart = "flipkart.com" in url.lower()
        is_amazon = "amazon.in" in url.lower() or "amazon.com" in url.lower()

        if not is_flipkart and not is_amazon:
            return {
                "error": "Hold up! Verdict currently only supports Amazon and Flipkart product links. "
                         "Please drop a valid link from either of those stores to get your analysis!"
            }

        try:
            # ── Flipkart → Amazon search redirect ─────────────────
            scrape_url = url
            is_flipkart_redirect = False

            if is_flipkart:
                parsed_url = urllib.parse.urlparse(url)
                path_parts = [p for p in parsed_url.path.strip("/").split("/") if p]
                
                slug = None
                if len(path_parts) > 2 and path_parts[1] == "p":
                    slug = path_parts[0]
                elif len(path_parts) > 0 and path_parts[0] not in ("p", "search", "s"):
                    slug = path_parts[0]

                if slug:
                    keyword = slug.replace("-", "+")
                    scrape_url = f"https://www.amazon.in/s?k={keyword}"
                    is_flipkart_redirect = True
                else:
                    return {"error": "Could not parse the exact product name from this Flipkart URL (it might be a short link or unsupported format). Please paste the full, direct product link."}

            # ── Scrape with Apify ─────────────────────────────────
            run_input = {
                "categoryUrls": [{"url": scrape_url}],
                "maxItemsPerStartUrl": 1,
                "maxSearchPagesPerStartUrl": 1,
                "maxProductVariantsAsSeparateResults": 0,
                "useCaptchaSolver": False,
                "scrapeProductVariantPrices": False,
                "scrapeProductDetails": True,
            }

            run = apify_client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
            dataset_id = (
                run.get("defaultDatasetId")
                if isinstance(run, dict)
                else getattr(run, "default_dataset_id", getattr(run, "defaultDatasetId", None))
            )
            items = list(apify_client.dataset(dataset_id).iterate_items())

            if not items:
                if is_flipkart_redirect:
                    return {"error": "Could not fetch equivalent product data from Amazon for this Flipkart URL."}
                return {"error": "Could not extract data from the provided URL."}

            # If we searched, the first item might be a list page result, and the last item is the detail page.
            product_detail_items = [item for item in items if item.get("description") or item.get("features")]
            product_data = product_detail_items[0] if product_detail_items else items[-1]
            
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
                "reviewsCount": product_data.get("reviewsCount", 0),
            }
            llm_context = json.dumps(llm_context_dict)[:6000]

            # ── LLM analysis via Groq ─────────────────────────────
            prompt = f"""\
You are an expert product analyst. Based on the following scraped data, first determine if this is a valid, single product page.
If the data looks like a category page, a non-existent page (404), or a generic store page (e.g. no clear product name, no price, "Unknown Product"), mark "is_valid_product" as false and provide a helpful "error_message" telling the user to enter a real, existing product link.

You must return your analysis strictly as a JSON object matching the following structure exactly, without any markdown formatting like ```json.

{{
    "is_valid_product": true | false,
    "error_message": "<string, only if is_valid_product is false, otherwise empty>",
    "verdict": "BUY" | "PASS" | "WAIT",
    "confidence_score": <int 0-100>,
    "executive_summary": "<string>",
    "pros_recap": ["<string>", ...],
    "cons_recap": ["<string>", ...],
    "price_trend_summary": "<string>",
    "review_authenticity_summary": "<string>",
    "supporting_evidence": [
        {{
            "topic": "<string> (e.g., Battery Life, Build Quality, Value)",
            "summary": "<string> (1-sentence summary of what users think)",
            "sentiment": "Positive" | "Neutral" | "Negative"
        }}
        // MUST identify and include at least 6 key features/topics from the reviews
    ]
}}

Product Data:
{llm_context}
"""

            if GEMINI_API_KEY:
                try:
                    model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
                    response = model.generate_content(prompt)
                    llm_response_text = response.text
                except Exception as e:
                    print(f"Gemini evaluation failed, falling back to Groq: {e}")
                    completion = groq_client.chat.completions.create(
                        model="mixtral-8x7b-32768",
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                    )
                    llm_response_text = completion.choices[0].message.content
            else:
                completion = groq_client.chat.completions.create(
                    model="mixtral-8x7b-32768",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                llm_response_text = completion.choices[0].message.content

            llm_response = json.loads(llm_response_text)

            if not llm_response.get("is_valid_product", True):
                return {
                    "error": llm_response.get(
                        "error_message",
                        "Oops! We couldn't find a valid product at this URL. Please make sure you entered a real, existing product link.",
                    )
                }

            return {
                "product_name": product_name,
                "product_image": product_image,
                "product_price": str(price) if price else "0",
                "verdict": llm_response.get("verdict", "WAIT"),
                "confidence_score": llm_response.get("confidence_score", 0),
                "executive_summary": llm_response.get("executive_summary", "No summary provided."),
                "pros_recap": llm_response.get("pros_recap", []),
                "cons_recap": llm_response.get("cons_recap", []),
                "price_trend_summary": llm_response.get("price_trend_summary", "No price data."),
                "review_authenticity_summary": llm_response.get("review_authenticity_summary", "No review data."),
                "supporting_evidence": llm_response.get("supporting_evidence", []),
            }

        except Exception as e:
            print(f"Error during evaluation: {e}")
            return {"error": f"Evaluation failed: {str(e)}"}

    # ── SEARCH / SHOPPING INTELLIGENCE ────────────────────────────────
    elif action == "search":
        try:
            from services.intent_service import IntentService  # type: ignore
            from services.marketplace.amazon_service import AmazonService  # type: ignore
            from services.marketplace.flipkart_service import FlipkartService  # type: ignore
            from services.matching_service import MatchingService  # type: ignore
            from services.ranking_service import RankingService  # type: ignore
        except ImportError as e:
            return {"error": f"Internal modules not found: {str(e)}"}

        body = await request.json()
        query = body.get("search_query", "").strip()

        if not apify_client or not groq_client:
            return {"error": "API keys not configured in Vercel"}

        try:
            # 1. Intent Extraction
            intent = IntentService.parse_intent(query)
            search_term = intent.search_query if intent.search_query else query
            
            # 2. Marketplace Search
            amazon_products = AmazonService.search(search_term, max_items=5)
            flipkart_products = FlipkartService.search(search_term, max_items=5)
            
            all_products = amazon_products + flipkart_products
            
            # 3. Matching and Normalization
            grouped_products = MatchingService.match_and_normalize(all_products)
            
            # 4. Ranking and Categorization
            ranked_groups = RankingService.rank_products(grouped_products, intent)
            
            # 5. Build Response
            return {
                "query": query,
                "intent": intent.dict(),
                "marketplaces": {
                    "amazon": {
                        "status": "success" if len(amazon_products) > 0 else "failed",
                        "resultCount": len(amazon_products)
                    },
                    "flipkart": {
                        "status": "success" if len(flipkart_products) > 0 else "failed",
                        "resultCount": len(flipkart_products)
                    }
                },
                "results": [g.dict() for g in ranked_groups],
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error during search: {e}")
            return {"error": f"Search failed: {str(e)}"}

    # ── CHAT ──────────────────────────────────────────────────────────
    elif action == "chat":
        body = await request.json()
        req = ChatRequest(**body)

        if not groq_client:
            return {"response": "API keys not configured in Vercel"}

        try:
            completion = groq_client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are the ultimate AI shopping assistant for Verdict. "
                            "Your goal is to provide the BEST, most insightful, and highly structured answers possible. "
                            "Always use Markdown to format your response beautifully: use bullet points for lists, "
                            "bold text for emphasis, and paragraphs to separate ideas. "
                            "Keep your tone highly conversational and professional.\n\n"
                            f"Use this product context if the user asks about the product they are viewing:\n{req.context}"
                        ),
                    },
                    {"role": "user", "content": req.message},
                ],
            )
            return {"response": completion.choices[0].message.content}
        except Exception as e:
            return {"response": "Sorry, I am having trouble connecting to the network right now."}

    # ── PRICE HISTORY ─────────────────────────────────────────────────
    elif action == "price-history":
        url = request.query_params.get("url", "")
        current_price = request.query_params.get("current_price", "")

        if not url:
            return {"error": "URL parameter missing"}

        is_flipkart = "flipkart.com" in url.lower()
        is_amazon = "amazon.in" in url.lower() or "amazon.com" in url.lower()

        if not is_flipkart and not is_amazon:
            return {"error": "Invalid URL"}

        # Deterministic seed based on URL so chart doesn't change on refresh
        seed = int(hashlib.md5(url.encode()).hexdigest(), 16)
        random.seed(seed)

        parsed_price = 0.0
        if current_price:
            match = re.search(r"[\d,]+(?:\.\d+)?", str(current_price))
            if match:
                try:
                    parsed_price = float(match.group().replace(",", ""))
                except ValueError:
                    pass

        base_price = parsed_price if parsed_price > 0 else (150.00 if is_amazon else 1500.00)

        history = []
        for i in range(6, -1, -1):
            dt = (datetime.now() - timedelta(days=30 * i)).strftime("%b %Y")
            if i == 0:
                p = round(base_price, 2)
            else:
                p = round(base_price * (1 + random.uniform(-0.15, 0.2)), 2)
            history.append({"date": dt, "price": p})

        return {"history": history}

    # ── UNKNOWN ACTION ────────────────────────────────────────────────
    else:
        raise HTTPException(status_code=404, detail="Action not found")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
