import os
from dotenv import load_dotenv, find_dotenv
from apify_client import ApifyClient
from groq import Groq

_dotenv_path = find_dotenv(usecwd=True)
if not _dotenv_path:
    for candidate in [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")),
    ]:
        if os.path.exists(candidate):
            _dotenv_path = candidate
            break

if _dotenv_path:
    load_dotenv(_dotenv_path)
else:
    load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

apify_client = ApifyClient(APIFY_TOKEN) if APIFY_TOKEN else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
