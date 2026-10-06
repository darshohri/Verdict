import httpx

url = "http://localhost:8000/api/index?action=evaluate"
payload = {"search_query": "https://www.flipkart.com/motorola-g34-5g-ocean-green-128-gb/p/itm6b1a33b9d9191"}

response = httpx.post(url, json=payload, timeout=60.0)
print("Status Code:", response.status_code)
print("Response JSON:")
import json
print(json.dumps(response.json(), indent=2)[:1000])
