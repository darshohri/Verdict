import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://rukminim2.flixcart.com/image/612/612/xif0q/track-pant/i/i/y/xl-2-stripes-layzee-resized-original-imahhb9cbrwra3cr.jpeg?q=70"
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive'
})

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print(f"Status: {response.status}")
except Exception as e:
    print(f"Error: {e}")
