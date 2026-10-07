import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Test wsrv proxy
url = "https://wsrv.nl/?url=https%3A%2F%2Frukminim2.flixcart.com%2Fimage%2F612%2F612%2Fxif0q%2Ftrack-pant%2Fi%2Fi%2Fy%2Fxl-2-stripes-layzee-resized-original-imahhb9cbrwra3cr.jpeg%3Fq%3D70"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print(f"Status: {response.status}")
except Exception as e:
    print(f"Error: {e}")
