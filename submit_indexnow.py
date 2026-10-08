import os
import urllib.request
import json
import xml.etree.ElementTree as ET
import sys

# IndexNow API Configuration
HOST = "chat.hashgang.com"
KEY = "8f3b4a2c1d9e8f7a6b5c4d3e2f1a0987"
KEY_LOCATION = f"https://hashgang.com/{KEY}.txt"

# Dynamic path resolution (Works seamlessly in local & production servers)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITEMAP_PATH = os.path.join(BASE_DIR, "sitemap.xml")

def get_sitemap_urls():
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    urls = [elem.text for elem in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    return urls

def ping_indexnow(urls):
    endpoint = "https://api.indexnow.org/indexnow"
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls
    }
    data = json.dumps(payload).encode('utf-8')
    headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (compatible; HashGANGIndexNow/1.0; +https://chat.hashgang.com)'
    }
    req = urllib.request.Request(endpoint, data=data, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"IndexNow Ping Response Code: {response.status}")
            if response.status in [200, 202]:
                print(f"Successfully submitted {len(urls)} URLs to IndexNow!")
            else:
                print(f"IndexNow submission returned status {response.status}")
    except Exception as e:
        print(f"Error submitting to IndexNow: {e}")

if __name__ == "__main__":
    urls = get_sitemap_urls()
    print(f"Loaded {len(urls)} URLs from sitemap.xml")
    ping_indexnow(urls)
