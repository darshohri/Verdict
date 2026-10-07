import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://rukminim2.flixcart.com/image/612/612/xif0q/track-pant/i/i/y/xl-2-stripes-layzee-resized-original-imahhb9cbrwra3cr.jpeg?q=70"
req1 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
req2 = urllib.request.Request(url, headers={'Referer': 'https://www.flipkart.com', 'User-Agent': 'Mozilla/5.0'})

for i, r in enumerate([req1, req2]):
    try:
        with urllib.request.urlopen(r, context=ctx) as response:
            print(f"Req {i}: {response.status}")
    except Exception as e:
        print(f"Req {i}: {e}")
