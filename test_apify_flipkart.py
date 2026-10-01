import requests
import json

response = requests.get('https://api.apify.com/v2/store/items?search=flipkart')
if response.status_code == 200:
    items = response.json().get('data', {}).get('items', [])
    for item in items[:10]:
        print(f"Actor: {item.get('name')}, Pricing: {item.get('pricingModel')}, ID: {item.get('id')}")
else:
    print("Failed to fetch")
