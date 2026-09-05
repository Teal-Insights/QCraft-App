#!/usr/bin/env python3
"""Generate public Python API references without importing the engine."""
import argparse
import ast
import copy
import hashlib
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--source-root', type=Path, required=True)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
package = Path(__file__).resolve().parents[1]
manifest = json.loads((package / 'source-manifest.json').read_text())
source = args.source_root.resolve()
commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
if commit != manifest['engine_ref']:
    raise SystemExit(f'Expected engine {manifest["engine_ref"]}, got {commit}')
root = source / 'packages/qcraft-engine/src/qcraft_engine'
items = []
pages = ['---', 'title: "Python API"', 'description: "Signatures and source descriptions extracted without importing the engine."', '---', '', '**These signatures and docstrings are extracted from the pinned Python source using the standard-library AST.** Import functions from their named modules. The package root does not re-export them. Source descriptions report implementation intent and must be read alongside the assumptions and verification pages.', '', f'Engine commit: `{commit}`.', '']
for path in sorted(root.glob('*.py')):
    tree = ast.parse(path.read_text())
    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) or node.name.startswith('_'):
            continue
        qualified = f'qcraft_engine.{path.stem}.{node.name}'
        if isinstance(node, ast.ClassDef):
            init = next((n for n in node.body if isinstance(n, ast.FunctionDef) and n.name == '__init__'), None)
            signature_args = copy.deepcopy(init.args) if init else ast.arguments(posonlyargs=[], args=[], kwonlyargs=[], kw_defaults=[], defaults=[])
            if signature_args.args and signature_args.args[0].arg == 'self': signature_args.args.pop(0)
            signature = f'{qualified}({ast.unparse(signature_args)})'
            kind='exception'
        else:
            signature = f'{qualified}({ast.unparse(node.args)})'
            if node.returns: signature += ' -> ' + ast.unparse(node.returns)
            kind='function'
        doc = ast.get_docstring(node) or ''
        rel = path.relative_to(source).as_posix()
        items.append({'name':qualified,'kind':kind,'signature':signature,'source':rel,'line':node.lineno,'doc_sha256':hashlib.sha256(doc.encode()).hexdigest()})
        pages += [f'## {qualified}', '', f'[Source](https://github.com/Teal-Insights/QCraft-App/blob/{commit}/{rel}#L{node.lineno})', '', '```python', signature, '```', '', '```text', doc, '```', '']
counts = {kind:sum(x['kind']==kind for x in items) for kind in ('function','exception')}
pages.insert(9,f'Observed inventory: {counts["function"]} functions and {counts["exception"]} exception classes.')
outputs={package/'src/content/docs/reference/python.md':'\n'.join(pages)+'\n',package/'reference-snapshots/python-inventory.json':json.dumps({'engine_ref':commit,'counts':counts,'items':items},indent=2)+'\n'}
for dest,text in outputs.items():
    if args.check:
        if not dest.exists() or dest.read_text()!=text: raise SystemExit(f'Stale Python reference: {dest}')
    else:
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(text)
print(json.dumps({'engine_ref':commit,'inventory':counts,'stale_check':args.check}))
