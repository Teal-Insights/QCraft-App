import path from 'node:path';
// Keep authored Markdown readable on GitHub while producing deployed route links.
export default function relativeDocLinks() {
  return (tree, file) => {
    const filename = file.history?.[0] ?? '';
    const marker = '/src/content/docs/';
    const relative = filename.split(marker)[1];
    if (!relative) return;
    function walk(node) {
      if ((node.type === 'link' || node.type === 'definition') && /\.md(?:#.*)?$/.test(node.url) && !/^[a-z]+:|^\//i.test(node.url)) {
        const [url, anchor] = node.url.split('#');
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(relative), url));
        const slug = target.replace(/(?:^|\/)index\.md$/, '').replace(/\.md$/, '');
        node.url = '/QCraft-App/docs/' + (slug ? slug + '/' : '') + (anchor ? '#' + anchor : '');
      }
      for (const child of node.children ?? []) walk(child);
    }
    walk(tree);
  };
}
