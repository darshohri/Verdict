import requests

url = "https://api.apify.com/v2/store/actors?search=flipkart"
response = requests.get(url)
data = response.json()

for actor in data.get("data", {}).get("items", [])[:5]:
    print(f"Name: {actor['name']}")
    print(f"Title: {actor['title']}")
    print(f"Price: {actor.get('pricingModel')}")
    print("-" * 20)
