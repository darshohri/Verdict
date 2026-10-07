import json
from bs4 import BeautifulSoup

with open('flipkart_dump.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

scripts = soup.find_all('script', type='application/ld+json')
for s in scripts:
    try:
        data = json.loads(s.string)
        if isinstance(data, list):
            data = data[0]
        if data.get('@type') == 'Product':
            print("Title:", data.get('name'))
            offers = data.get('offers', {})
            if isinstance(offers, list):
                offers = offers[0]
            print("Price:", offers.get('price'))
            print("Image:", data.get('image'))
            break
    except Exception as e:
        pass
