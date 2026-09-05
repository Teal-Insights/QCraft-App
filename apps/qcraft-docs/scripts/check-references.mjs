import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const engine=process.env.QCRAFT_ENGINE_ROOT;
if(!engine) throw new Error('Set QCRAFT_ENGINE_ROOT to the pinned engine checkout.');
execFileSync('python3',['scripts/python-reference.py','--source-root',engine,'--check'],{stdio:'inherit'});
fs.mkdirSync('.cache',{recursive:true});
const temp=fs.mkdtempSync(path.resolve('.cache/reference-check-'));
try {
 execFileSync(process.execPath,['scripts/typescript-reference.mjs'],{stdio:'inherit',env:{...process.env,QCRAFT_REFERENCE_OUT:temp}});
 const inventory=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?inventory(path.join(dir,e.name)).map(x=>e.name+'/'+x):[e.name]).sort();
 const saved='reference-snapshots/typescript';
 const files=inventory(saved);
 if(JSON.stringify(files)!==JSON.stringify(inventory(temp))) throw new Error('Stale TypeScript file inventory');
 for(const f of files)if(!fs.readFileSync(path.join(saved,f)).equals(fs.readFileSync(path.join(temp,f))))throw new Error('Stale TypeScript reference: '+f);
 console.log('REFERENCE_STALE_CHECK_PASS: '+files.length+' TypeScript Markdown files');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
