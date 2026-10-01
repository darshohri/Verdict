import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}
url = 'https://www.flipkart.com/apple-iphone-13-starlight-128-gb/p/itmc9604f122ae7f'
response = requests.get(url, headers=headers)
with open('flipkart_dump.html', 'w', encoding='utf-8') as f:
    f.write(response.text)
