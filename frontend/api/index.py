import os
import json
import asyncio
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

# Initialize clients if keys exist
apify_client = ApifyClient(APIFY_TOKEN) if APIFY_TOKEN else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI()

class EvaluateRequest(BaseModel):
    search_query: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

@app.post("/api/index")
async def vercel_handler(request: Request):
    action = request.query_params.get("action")
    if action == "evaluate":
        body = await request.json()
        req = EvaluateRequest(**body)
        
        if not apify_client or not groq_client:
            return {"error": "API keys not configured in Vercel"}
            
        url = req.search_query
        is_flipkart = "flipkart.com" in url.lower()
        is_amazon = "amazon.in" in url.lower() or "amazon.com" in url.lower()
        
        if not is_flipkart and not is_amazon:
            return {"error": "Hold up! Verdict currently only supports Amazon and Flipkart product links. Please drop a valid link from either of those stores to get your analysis!"}
            
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url
            req.search_query = url
            
        try:
            url = req.search_query
            is_flipkart = "flipkart.com" in url.lower()
            product_name = "Unknown Product"
            product_image = ""
            llm_context = ""
            
            if is_flipkart:
                run_input = {
                    "startUrls": [{"url": url}],
                    "pageFunction": """
                        async function pageFunction(context) {
                            const { $, request, log } = context;
                            let product = null;
                            $('script[type="application/ld+json"]').each((i, el) => {
                                try {
                                    let data = JSON.parse($(el).html());
                                    if (Array.isArray(data)) data = data[0];
                                    if (data['@type'] === 'Product') {
                                        product = data;
                                    }
                                } catch(e) {}
                            });
                            return { product };
                        }
                    """,
                    "proxyConfiguration": { "useApifyProxy": True }
                }
                
                try:
                    run = apify_client.actor("apify/cheerio-scraper").call(run_input=run_input)
                    items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
                    
                    if items and items[0].get("product"):
                        data = items[0]["product"]
                        product_name = data.get("name", "Unknown Product")
                        
                        offers = data.get("offers", {})
                        if isinstance(offers, list):
                            offers = offers[0] if offers else {}
                        price = offers.get("price", "Unknown")
                        
                        img = data.get("image", [])
                        if isinstance(img, list) and len(img) > 0:
                            product_image = img[0]
                        elif isinstance(img, str):
                            product_image = img
                            
                        reviews_list = []
                        if isinstance(data.get("review"), list):
                            for r in data.get("review"):
                                if "reviewBody" in r:
                                    reviews_list.append(r["reviewBody"])
                                    
                        llm_context_dict = {
                            "title": product_name,
                            "description": data.get("description", ""),
                            "price": price,
                            "currency": offers.get("priceCurrency", "INR"),
                            "rating": data.get("aggregateRating", {}).get("ratingValue", 0),
                            "reviewsCount": data.get("aggregateRating", {}).get("reviewCount", 0),
                            "reviews": reviews_list[:15]
                        }
                        llm_context = json.dumps(llm_context_dict)[:6000]
                    else:
                        return {"error": "Could not extract data from Flipkart URL"}
                except Exception as e:
                    return {"error": f"Scraper error: {str(e)}"}
                    
            else:
                run_input = {
                    "categoryUrls": [{ "url": url }],
                    "maxItemsPerStartUrl": 1,
                    "maxSearchPagesPerStartUrl": 1,
                    "maxProductVariantsAsSeparateResults": 0,
                    "useCaptchaSolver": False,
                    "scrapeProductVariantPrices": False,
                    "scrapeProductDetails": True,
                }

                run = apify_client.actor("junglee/free-amazon-product-scraper").call(run_input=run_input)
                items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
                if not items:
                    return {"error": "Could not extract data from the provided URL"}
                    
                product_data = items[0]
                product_name = product_data.get("title", "Unknown Product")
                
                high_res = product_data.get("highResolutionImages", [])
                product_image = high_res[0] if high_res else product_data.get("thumbnailImage", "")
                
                llm_context_dict = {
                    "title": product_name,
                    "description": product_data.get("description", ""),
                    "price": product_data.get("price", {}),
                    "currency": product_data.get("currency", "USD"),
                    "bullets": product_data.get("bullets", []),
                    "rating": product_data.get("rating", 0),
                    "reviewsCount": product_data.get("reviewsCount", 0)
                }
                llm_context = json.dumps(llm_context_dict)[:6000]

            prompt = f"""
You are an expert product analyst. Based on the following product data, generate a comprehensive evaluation report.
You must return your analysis strictly as a JSON object matching the following structure exactly, without any markdown formatting like ```json.

{{
    "verdict": "BUY" | "PASS" | "WAIT",
    "confidence_score": <int 0-100>,
    "executive_summary": "<string>",
    "pros_recap": ["<string>", ...],
    "cons_recap": ["<string>", ...],
    "price_trend_summary": "<string>",
    "review_authenticity_summary": "<string>",
    "supporting_evidence": ["<string>", ...]
}}

Product Data:
{llm_context}
"""
            completion = groq_client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            llm_response_text = completion.choices[0].message.content
            llm_response = json.loads(llm_response_text)
            
            return {
                "product_name": product_name,
                "product_image": product_image,
                "verdict": llm_response.get("verdict", "WAIT"),
                "confidence_score": llm_response.get("confidence_score", 0),
                "executive_summary": llm_response.get("executive_summary", "No summary provided."),
                "pros_recap": llm_response.get("pros_recap", []),
                "cons_recap": llm_response.get("cons_recap", []),
                "price_trend_summary": llm_response.get("price_trend_summary", "No price data."),
                "review_authenticity_summary": llm_response.get("review_authenticity_summary", "No review data."),
                "supporting_evidence": llm_response.get("supporting_evidence", [])
            }
            
        except Exception as e:
            print(f"Error during evaluation: {e}")
            return {"error": f"Evaluation failed: {str(e)}"}
            
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
                        "content": f"You are the ultimate AI shopping assistant for Verdict. Your goal is to provide the BEST, most insightful, and highly structured answers possible. Always use Markdown to format your response beautifully: use bullet points for lists, bold text for emphasis, and paragraphs to separate ideas. Keep your tone highly conversational and professional.\n\nUse this product context if the user asks about the product they are viewing:\n{req.context}"
                    },
                    {
                        "role": "user",
                        "content": req.message
                    }
                ]
            )
            return {
                "response": completion.choices[0].message.content
            }
        except Exception as e:
            return {"response": "Sorry, I am having trouble connecting to the network right now."}
    else:
        raise HTTPException(status_code=404, detail="Action not found")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
