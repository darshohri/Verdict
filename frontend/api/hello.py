import os
from fastapi import FastAPI
from groq import Groq
from apify_client import ApifyClient

app = FastAPI()

@app.get("/api/hello")
def hello():
    try:
        groq_key = os.getenv("GROQ_API_KEY")
        apify_key = os.getenv("APIFY_API_TOKEN")
        
        has_groq = bool(groq_key)
        has_apify = bool(apify_key)
        
        groq_client = Groq(api_key=groq_key) if groq_key else None
        apify_client = ApifyClient(apify_key) if apify_key else None
        
        # Test Groq
        if groq_client:
            models = groq_client.models.list()
            groq_status = "Connected"
        else:
            groq_status = "Missing Key"
            
        return {
            "message": "Hello from FastAPI!",
            "groq_status": groq_status,
            "has_apify": has_apify
        }
    except Exception as e:
        return {"error": str(e), "message": "Failed during test"}
