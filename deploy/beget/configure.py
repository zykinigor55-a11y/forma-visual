#!/usr/bin/env python3
"""Rewrite official PLUX Render URLs for the new Beget HTTPS origin, including API CORS."""
from pathlib import Path
from urllib.parse import urlsplit
import sys

root=Path(__file__).resolve().parent
if len(sys.argv)!=2:
    raise SystemExit("Usage: python3 configure.py https://plux.example.com")
origin=sys.argv[1].strip().rstrip("/")
url=urlsplit(origin)
if url.scheme!="https" or not url.hostname or url.port or url.path or url.query or url.fragment:
    raise SystemExit("Expected a simple HTTPS origin such as https://plux.example.com")
if not all(c.isalnum() or c in ".-" for c in url.hostname):
    raise SystemExit("Invalid domain")
old_urls=(
    "https://pluh-voice-demo.onrender.com",
    "https://plux-v12-2-2k-fixed.onrender.com",
)
rewritten=0
for folder in (root/"www",root/"server"):
    if not folder.is_dir():raise SystemExit(f"Missing {folder}")
    for p in folder.rglob("*"):
        if not p.is_file() or p.suffix not in {".js",".mjs",".html",".json",".css",".webmanifest",".xml"}:continue
        content=p.read_text("utf-8")
        new=content
        for address in old_urls:new=new.replace(address,origin)
        if new!=content:
            p.write_text(new,"utf-8")
            rewritten+=1
if rewritten<7:raise SystemExit(f"Only {rewritten} files updated; PLUX frontend may be incomplete")
server=root/"server/server.mjs"
body=server.read_text("utf-8")
before='.listen(port,"0.0.0.0"'
if before not in body:raise SystemExit("Unexpected server listen configuration")
server.write_text(body.replace(before,'.listen(port,"127.0.0.1"',1),"utf-8")
for area in ("www","server"):
    for p in (root/area).rglob("*"):
        if p.is_file() and p.suffix in {".js",".mjs",".html",".json",".css",".webmanifest"}:
            txt=p.read_text("utf-8")
            if any(u in txt for u in old_urls):raise SystemExit(f"Old Render endpoint remains in {p}")
print(f"PLUX configured for {origin}; {rewritten} files rewritten; Node.js restricted to loopback")
