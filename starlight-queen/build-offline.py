#!/usr/bin/env python3
"""Build one self-contained file for playing Starlight Queen with no internet:

    python3 build-offline.py                 ->  offline/Starlight Queen.html
    python3 build-offline.py --site <folder>  ->  <folder>/index.html, sw.js, manifest.json, icon.png  (for a website)

Every script is inlined and the two typefaces (Cinzel and EB Garamond, both under the SIL Open Font
Licence) are embedded, so the file can be copied to any laptop and opened with a double-click.
If the fonts cannot be fetched, the file is still built and falls back to the system's serif faces.
"""
import base64, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CSS_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

# The service worker for the site edition: the page is the whole game, so it is the only thing to keep.
# Network first, cache fallback; and only ever cache a real page, never a sign-in screen served in its place.
SITE_SW = """// Offline cache for Starlight Queen: network-first, cache fallback.
// The whole game is this one page, so the page is all there is to keep.
var CACHE = "starlight-queen-v1";

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) {
        // Fetch the folder itself, never ./index.html: hosts that tidy URLs answer that with a redirect, and a
        // redirected response cannot be handed back to a page load later, which would break the first offline open.
        return fetch("./").then(function (r) { if (r.ok) return c.put("./index.html", r); }).catch(function () {});
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    e.respondWith(
      fetch(e.request)
        .then(function (r) {
          // Only cache a real page. If the folder sits behind a passcode, a signed-out fetch returns the
          // sign-in page; caching that would shadow the game offline until site data is cleared.
          if (r.ok && !r.redirected) {
            var copy = r.clone();
            caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
          }
          return r;
        })
        .catch(function () { return caches.match("./index.html"); })
    );
  }
});
"""

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
    site = sys.argv[sys.argv.index('--site') + 1] if '--site' in sys.argv else None
    if site:  # an edition for a folder on a website: one page, a manifest, and a small service worker beside it
        html = html.replace('href="manifest.webmanifest"', 'href="./manifest.json"').replace('href="apple-touch-icon.png"', 'href="./icon.png"')
    else:
        html = re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\n?', '', html)  # those belong to the hosted edition
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
    if site:
        import json, shutil
        os.makedirs(site, exist_ok=True)
        dest = os.path.join(site, 'index.html')
        open(dest, 'w', encoding='utf-8').write(html)
        open(os.path.join(site, 'manifest.json'), 'w').write(json.dumps({'name': 'Starlight Queen', 'short_name': 'Starlight Queen', 'start_url': './', 'display': 'fullscreen', 'orientation': 'landscape', 'background_color': '#05060c', 'theme_color': '#05060c'}, indent=2) + '\n')
        open(os.path.join(site, 'sw.js'), 'w').write(SITE_SW)
        shutil.copyfile(os.path.join(HERE, 'apple-touch-icon.png'), os.path.join(site, 'icon.png'))
        print('%s  (%d KB, fonts %s) + sw.js, manifest.json, icon.png' % (dest, len(html.encode()) // 1024, 'embedded' if fonts else 'NOT embedded'))
        return
    os.makedirs(os.path.join(HERE, 'offline'), exist_ok=True)
    dest = os.path.join(HERE, 'offline', 'Starlight Queen.html')
    open(dest, 'w', encoding='utf-8').write(html)
    print('%s  (%d KB, fonts %s)' % (dest, len(html.encode()) // 1024, 'embedded' if fonts else 'NOT embedded'))

if __name__ == '__main__':
    main()
