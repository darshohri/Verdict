import requests
from bs4 import BeautifulSoup
import json
import sys

url = 'https://www.flipkart.com/red-tape-lifestyle-elevated-everyday-style-walking-shoes-men/p/itmd5db05b38ed6b'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.content, 'html.parser')

scripts = soup.find_all('script', type='application/ld+json')
found_product = False
for s in scripts:
    try:
        data = json.loads(s.string)
        if isinstance(data, list):
            data = data[0]
        if data.get('@type') == 'Product':
            found_product = True
            print("Found Product in ld+json!")
            print(data.get('name'))
            sys.exit(0)
    except Exception as e:
        print("Error parsing json:", e)

if not found_product:
    print("No Product found in ld+json. Checking H1...")
    h1 = soup.find('h1')
    if h1:
        print("H1 found:", h1.text)
    else:
        print("No H1 found. Title:", soup.title.string if soup.title else None)
