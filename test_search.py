import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Add the API directory to sys.path
sys.path.insert(0, os.path.join(os.getcwd(), 'frontend', 'api'))

from services.marketplace.amazon_service import AmazonService
from services.marketplace.flipkart_service import FlipkartService

print("Searching Amazon...")
try:
    amazon_res = AmazonService.search("asus laptop", max_items=2)
    print("Amazon:", amazon_res)
except Exception as e:
    print("Amazon failed:", e)

print("Searching Flipkart...")
try:
    flip_res = FlipkartService.search("asus laptop", max_items=2)
    print("Flipkart:", flip_res)
except Exception as e:
    print("Flipkart failed:", e)
