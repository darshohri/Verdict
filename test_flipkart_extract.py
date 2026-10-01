from bs4 import BeautifulSoup
import re

with open('flipkart_dump.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

print("--- Title Elements ---")
for el in soup.find_all(string=re.compile("iPhone 13")):
    if el.parent.name in ['span', 'h1', 'div']:
        print(f"Tag: {el.parent.name}, Class: {el.parent.get('class')}, Text: {el.parent.text[:50]}")

print("\n--- Price Elements ---")
for el in soup.find_all(string=re.compile("₹")):
    if el.parent.name in ['div', 'span']:
        print(f"Tag: {el.parent.name}, Class: {el.parent.get('class')}, Text: {el.parent.text[:50]}")
