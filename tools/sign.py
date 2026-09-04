#!/usr/bin/env python3
"""thefixer source signature — inserts the ASCII logo comment + gold console banner into HTML files.

usage: sign.py [--place doctype|charset] [--no-console] [--zip] [--replace] PATH [PATH...]
  --place doctype : comment right after <!DOCTYPE html>, before <html>   (hosts that send charset in headers: Netlify)
  --place charset : comment right after <meta charset=...>                (Hostinger/Apache: header has no charset,
                    the 1.6 KB comment would push <meta charset> past the 1024-byte prescan)
Idempotent: markers are "created by thefixer" and data-thefixer-signature. Skips fragments without anchors.
"""
import sys, re, pathlib, zipfile, io
HERE = pathlib.Path(__file__).resolve().parent
def _snippet(name):
    for c in (HERE/name, HERE.parent/'template'/name):
        if c.exists(): return c.read_text(encoding='utf-8')
    raise SystemExit(f'missing {name}')
SIG = _snippet('_signature.html')
CON = _snippet('_signature-console.html')
SKIP_DIRS = {'node_modules','.git','.astro','.next','source-photos','photos','_research','.wrangler'}
RE_DOCTYPE = re.compile(r'<!doctype\s+html[^>]*>', re.I)
RE_CHARSET = re.compile(r'<meta\s+[^>]*charset\s*=[^>]*>', re.I)
RE_OLD_SIG = re.compile(r'\n?<!--(?:(?!-->).)*?created by thefixer(?:(?!-->).)*?-->\n?', re.S)
RE_OLD_CON = re.compile(r'<script data-thefixer-signature>.*?</script>\n?', re.S)

def strip_signature(src):
    return RE_OLD_CON.sub('', RE_OLD_SIG.sub('\n', src, count=1))

def sign_text(src, place='charset', console=True, replace=False):
    changed = False
    if replace and ('created by thefixer' in src or 'data-thefixer-signature' in src):
        src = strip_signature(src); changed = True
    if 'created by thefixer' not in src:
        if place == 'doctype':
            m = RE_DOCTYPE.search(src)
            if m: src = src[:m.end()] + '\n' + SIG.rstrip('\n') + '\n' + src[m.end():].lstrip('\n'); changed = True
        else:
            m = RE_CHARSET.search(src)
            if m: src = src[:m.end()] + '\n' + SIG.rstrip('\n') + '\n' + src[m.end():].lstrip('\n'); changed = True
    if console and 'data-thefixer-signature' not in src:
        i = src.rfind('</body>')
        if i > 0: src = src[:i] + CON + src[i:]; changed = True
    return src, changed

def sign_file(p, place, console, replace=False):
    try: src = p.read_text(encoding='utf-8')
    except UnicodeDecodeError: return 'skip-enc'
    if not RE_DOCTYPE.search(src) and '<html' not in src.lower(): return 'skip-fragment'
    new, ch = sign_text(src, place, console, replace)
    if ch: p.write_text(new, encoding='utf-8'); return 'signed'
    return 'already' if 'created by thefixer' in src else 'skip-noanchor'

def sign_zip(zp, place, console, replace=False):
    buf = io.BytesIO(); n = 0
    with zipfile.ZipFile(zp) as zin, zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.lower().endswith(('.html','.htm')) and not item.filename.startswith('__MACOSX'):
                try:
                    txt = data.decode('utf-8'); new, ch = sign_text(txt, place, console, replace)
                    if ch: data = new.encode('utf-8'); n += 1
                except UnicodeDecodeError: pass
            zout.writestr(item, data)
    if n: pathlib.Path(zp).write_bytes(buf.getvalue())
    return n

def main(argv):
    place, console, do_zip, replace, paths = 'charset', True, False, False, []
    it = iter(argv)
    for a in it:
        if a == '--place': place = next(it)
        elif a == '--no-console': console = False
        elif a == '--zip': do_zip = True
        elif a == '--replace': replace = True
        else: paths.append(a)
    stats = {}
    for root in paths:
        root = pathlib.Path(root)
        files = [root] if root.is_file() else [p for p in root.rglob('*') if p.suffix.lower() in ('.html','.htm','.zip') and not (set(p.relative_to(root).parts[:-1]) & SKIP_DIRS) and not p.name.startswith('_signature')]
        for p in files:
            if p.suffix.lower() == '.zip':
                if do_zip: n = sign_zip(p, place, console, replace); stats[f'zip:{p.name}'] = n
                continue
            r = sign_file(p, place, console, replace); stats[r] = stats.get(r, 0) + 1
    print(f'{place}: ' + ', '.join(f'{k}={v}' for k, v in sorted(stats.items())))
if __name__ == '__main__': main(sys.argv[1:])
