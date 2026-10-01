import requests
from bs4 import BeautifulSoup
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}
url = 'https://www.flipkart.com/apple-iphone-13-starlight-128-gb/p/itmc9604f122ae7f'
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')

title = soup.find('span', {'class': 'VU-Tz5'})
price = soup.find('div', {'class': 'Nx9bqj CxhGGd'})
print(f"Title: {title.text if title else 'N/A'}")
print(f"Price: {price.text if price else 'N/A'}")
