import os
from dotenv import load_dotenv
from apify_client import ApifyClient
from groq import Groq
load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

apify_client = ApifyClient(APIFY_TOKEN) if APIFY_TOKEN else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
