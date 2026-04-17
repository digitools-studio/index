#!/usr/bin/env python3
"""
Fetch https://invoice.etax.nat.gov.tw/invoice.xml and output prize-data.json.
Run: python3 .github/scripts/fetch_invoice.py > prize-data.json
"""
import urllib.request
import xml.etree.ElementTree as ET
import json
import re
import sys


def html_to_text(html_str):
    text = re.sub(r'<[^>]+>', ' ', html_str or '')
    return re.sub(r'\s+', ' ', text).strip()


def grab(text, keyword, length, max_count):
    idx = text.find(keyword)
    if idx < 0:
        return []
    rest = text[idx + len(keyword):]
    return [m for m in re.findall(r'\d+', rest) if len(m) == length][:max_count]


url = 'https://invoice.etax.nat.gov.tw/invoice.xml'
req = urllib.request.Request(
    url,
    headers={'User-Agent': 'Mozilla/5.0 (compatible; GitHubActions/fetch-invoice)'}
)

try:
    with urllib.request.urlopen(req, timeout=30) as f:
        xml_text = f.read().decode('utf-8')
except Exception as e:
    print(f'Error fetching XML: {e}', file=sys.stderr)
    sys.exit(1)

# Strip namespace declarations to simplify element access
xml_text = re.sub(r'\s+xmlns(?::\w+)?="[^"]+"', '', xml_text)

try:
    root = ET.fromstring(xml_text)
except ET.ParseError as e:
    print(f'XML parse error: {e}', file=sys.stderr)
    sys.exit(1)

results = []
for item in root.findall('.//item'):
    title_el = item.find('title')
    desc_el  = item.find('description')
    if title_el is None or desc_el is None:
        continue

    title = (title_el.text or '').strip()
    raw   = html_to_text(desc_el.text or '')

    spec          = grab(raw, '特別獎', 8, 1)
    special_prize = spec[0] if spec else ''

    post_spec   = raw[raw.index(special_prize) + 8:] if special_prize and special_prize in raw else raw
    grand       = grab(post_spec, '特獎', 8, 1)
    grand_prize = grand[0] if grand else ''

    post_grand = (
        post_spec[post_spec.index(grand_prize) + 8:]
        if grand_prize and grand_prize in post_spec
        else post_spec
    )

    hi = post_grand.find('頭獎')
    si = post_grand.find('增開六獎')
    head_sec     = post_grand[hi:si] if hi >= 0 and si > hi else (post_grand[hi:] if hi >= 0 else '')
    first_prizes = [m for m in re.findall(r'\d+', head_sec) if len(m) == 8][:6]

    sixth_sec   = post_grand[si:] if si >= 0 else ''
    sixth_extra = [m for m in re.findall(r'\d+', sixth_sec) if len(m) == 3][:8]

    results.append({
        'title':        title,
        'specialPrize': special_prize,
        'grandPrize':   grand_prize,
        'firstPrizes':  first_prizes,
        'sixthExtra':   sixth_extra,
    })

print(json.dumps(results, ensure_ascii=False, indent=2))
