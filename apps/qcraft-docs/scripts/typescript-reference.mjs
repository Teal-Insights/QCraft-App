import { Application, TSConfigReader } from 'typedoc';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const engine = process.env.QCRAFT_ENGINE_ROOT;
if (!engine) throw new Error('Set QCRAFT_ENGINE_ROOT to the exact reference checkout.');
const manifest = JSON.parse(fs.readFileSync('source-manifest.json','utf8'));
const commit = execFileSync('git',['-C',engine,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(commit !== manifest.engine_ref) throw new Error(`Wrong reference commit ${commit}`);
const app = await Application.bootstrapWithPlugins({
  entryPoints:[path.join(engine,'packages/qcraft-engine-ts/src/index.ts')],
  tsconfig:path.join(engine,'packages/qcraft-engine-ts/tsconfig.build.json'),
  compilerOptions:{types:[]},basePath:engine,
  plugin:['typedoc-plugin-markdown'],
  readme:'none',gitRevision:commit,
  sourceLinkTemplate:'https://github.com/Teal-Insights/QCraft-App/blob/{gitRevision}/{path}#L{line}',
  treatWarningsAsErrors:true,validation:{notExported:true,invalidLink:true},
  excludePrivate:true,excludeProtected:true,excludeInternal:true,
  outputs:[{name:'markdown',path:process.env.QCRAFT_REFERENCE_OUT || 'reference-snapshots/typescript'}],
},[new TSConfigReader()]);
const project=await app.convert();
if(!project) throw new Error('TypeDoc conversion failed');
app.validate(project);
if(app.logger.hasErrors() || app.logger.hasWarnings()) throw new Error('TypeDoc emitted errors or unresolved warnings');
await app.generateOutputs(project);
console.log('STRICT_TYPESCRIPT_REFERENCE_PASS');
