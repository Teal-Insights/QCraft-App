#!/usr/bin/env python3
"""Check generated local pages, assets, anchors and pinned source targets."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import argparse,json,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--engine-root',type=Path);args=parser.parse_args()
pkg=Path(__file__).resolve().parents[1];dist=pkg/'dist';manifest=json.loads((pkg/'source-manifest.json').read_text());base='/QCraft-App/docs/'
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=set();self.links=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.add(attrs['id'])
        for key in ('href','src'):
            if key in attrs:self.links.append(attrs[key])
pages={p:Page(p.read_text()) for p in dist.rglob('*.html')};errors=[];source_urls=set();external=set();checked=0
for file,page in pages.items():
    url='https://teal-insights.github.io'+base+file.relative_to(dist).as_posix()
    for link in page.links:
        target=urlsplit(urljoin(url,link));path=unquote(target.path)
        if target.netloc=='teal-insights.github.io' and path.startswith(base):
            relative=path[len(base):];dest=dist/relative
            if path.endswith('/'):dest/='index.html'
            if path==base+'404/':dest=dist/'404.html'
            if not dest.is_file():errors.append(f'{file.relative_to(dist)} -> missing {path}');continue
            if target.fragment and dest in pages and unquote(target.fragment) not in pages[dest].ids:errors.append(f'{file.relative_to(dist)} -> missing anchor {path}#{target.fragment}')
            checked+=1
        elif target.netloc=='github.com' and path.startswith('/Teal-Insights/QCraft-App/blob/'+manifest['engine_ref']+'/'):
            source_urls.add(target.geturl())
        elif target.scheme in ('http','https'):external.add(target.geturl())
if args.engine_root:
    actual=subprocess.check_output(['git','-C',str(args.engine_root),'rev-parse','HEAD'],text=True).strip()
    assert actual==manifest['engine_ref']
    prefix='/Teal-Insights/QCraft-App/blob/'+actual+'/'
    for url in source_urls:
        target=urlsplit(url);rel=unquote(target.path[len(prefix):]);p=args.engine_root/rel
        if not p.exists():errors.append('Missing pinned source: '+rel)
        elif target.fragment.startswith('L') and p.is_file():
            try:line=int(target.fragment[1:]);assert 0<line<=len(p.read_text().splitlines())
            except (ValueError,AssertionError):errors.append('Invalid pinned source line: '+url)
print(json.dumps({'html_pages':len(pages),'local_links_checked':checked,'pinned_source_urls':len(source_urls),'other_external_urls':sorted(external),'errors':errors},indent=2))
raise SystemExit(bool(errors))
