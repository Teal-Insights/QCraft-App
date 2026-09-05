import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import accessibleTables from './scripts/accessible-tables.mjs';
const manifest = JSON.parse(fs.readFileSync(new URL('./source-manifest.json',import.meta.url),'utf8')); 
const engine = process.env.QCRAFT_ENGINE_ROOT;
if (engine && execFileSync('git',['-C',engine,'rev-parse','HEAD'],{encoding:'utf8'}).trim() !== manifest.engine_ref) throw new Error('Reference source must match source-manifest.json');
const referencePlugin = engine ? [starlightTypeDoc({
  entryPoints: [path.join(engine, 'packages/qcraft-engine-ts/src/index.ts')],
  tsconfig: path.join(engine, 'packages/qcraft-engine-ts/tsconfig.build.json'),
  output: 'reference/typescript',
  sidebar: {label:'TypeScript API',collapsed:true},
  typeDoc: {basePath:engine, compilerOptions:{types:[]}, gitRevision:manifest.engine_ref,
    sourceLinkTemplate:'https://github.com/Teal-Insights/QCraft-App/blob/{gitRevision}/{path}#L{line}',
    treatWarningsAsErrors:true, validation:{notExported:true,invalidLink:true}},
})] : [];
import relativeDocLinks from './scripts/relative-doc-links.mjs';
export default defineConfig({
  site: 'https://teal-insights.github.io',
  base: '/QCraft-App/docs/',
  trailingSlash: 'always',
  markdown: { remarkPlugins: [relativeDocLinks], rehypePlugins: [accessibleTables] },
  integrations: [starlight({
    title: 'Q-CRAFT Explorer',
    plugins: referencePlugin,
    description: 'Review the assumptions, evidence and code behind Q-CRAFT Explorer.',
    customCss: ['./src/styles/brand.css'],
    components: { Footer: './src/components/Footer.astro' },
    social: [{ icon: 'github', label: 'Source code', href: 'https://github.com/Teal-Insights/QCraft-App' }],
    sidebar: [
      {label:'Start here',slug:'index'},
      {label:'For reviewers',slug:'reviewers'},
      {label:'Assumptions',slug:'assumptions'},
      {label:'Verification',slug:'verification'},
      {label:'Architecture',slug:'architecture'},
      {label:'Data',slug:'data'},
      {label:'Run and reproduce',slug:'reproduce'},
      {label:'Reference',slug:'reference'},
      {label:'Python API',slug:'reference/python'},
      ...(engine ? [typeDocSidebarGroup] : [{label:'TypeScript API',autogenerate:{directory:'reference/typescript'},collapsed:true}]),
      {label:'Release notes',slug:'release-notes'},
      {label:'Contributing',slug:'contributing'},
    ],
  })],
});
