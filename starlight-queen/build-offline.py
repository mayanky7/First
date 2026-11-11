#!/usr/bin/env python3
"""Build one self-contained file for playing Starlight Queen with no internet:

    python3 build-offline.py      ->  offline/Starlight Queen.html

Every script is inlined and the two typefaces (Cinzel and EB Garamond, both under the SIL Open Font
Licence) are embedded, so the file can be copied to any laptop and opened with a double-click.
If the fonts cannot be fetched, the file is still built and falls back to the system's serif faces.
"""
import base64, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CSS_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30).read()

def font_css():
    try:
        css = fetch(CSS_URL).decode()
    except Exception as e:
        print('fonts not fetched (%s); the file will use system serif faces' % e, file=sys.stderr)
        return ''
    out, cache = [], {}
    for name, block in re.findall(r'/\* ([a-z-]+) \*/\s*(@font-face\s*{[^}]*})', css):
        if name != 'latin':
            continue  # the game's text is all in the basic Latin subset
        url = re.search(r'url\((https://[^)]+)\)', block).group(1)
        if url not in cache:
            cache[url] = base64.b64encode(fetch(url)).decode()
        out.append(block.replace(url, 'data:font/woff2;base64,' + cache[url]))
    return '\n'.join(out)

def main():
    html = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
    html = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', html)
    fonts = font_css()
    html, n = re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n?', lambda m: '<style>\n' + fonts + '\n</style>\n' if fonts else '', html)
    assert n == 1, 'font link not found'
    def inline(m):
        src = open(os.path.join(HERE, m.group(1)), encoding='utf-8').read()
        assert '</script' not in src.lower(), m.group(1)
        return '<script>\n' + src + '\n</script>'
    html, n = re.subn(r'<script src="([^"]+)"></script>', inline, html)
    assert n >= 10, 'scripts not found'
    assert 'http://' not in html.replace('http://www.w3.org', '') and 'https://' not in html, 'the offline file must not reach for the network'
    html = html.replace('<head>', '<head>\n<!-- Starlight Queen, offline edition: one file, nothing to install, no internet needed. Double-click to play.\n     Typefaces: Cinzel and EB Garamond, embedded under the SIL Open Font Licence 1.1. -->', 1)
    os.makedirs(os.path.join(HERE, 'offline'), exist_ok=True)
    dest = os.path.join(HERE, 'offline', 'Starlight Queen.html')
    open(dest, 'w', encoding='utf-8').write(html)
    print('%s  (%d KB, fonts %s)' % (dest, len(html.encode()) // 1024, 'embedded' if fonts else 'NOT embedded'))

if __name__ == '__main__':
    main()
