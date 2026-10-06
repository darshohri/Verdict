import httpx

url = "http://localhost:8000/api/v1/verdict/evaluate"
payload = {"search_query": "https://www.flipkart.com/motorola-g34-5g-ocean-green-128-gb/p/itm6b1a33b9d9191"}

response = httpx.post(url, json=payload, timeout=120.0)
print("Status Code:", response.status_code)
print("Response JSON:")
import json
try:
    print(json.dumps(response.json(), indent=2)[:1000])
except:
    print(response.text)
