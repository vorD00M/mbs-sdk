import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
test('versioned built-in package permits only compiled, non-hydrating entries',async()=>{
 const schema=JSON.parse(await readFile(new URL('../schemas/module-package.v1.schema.json',import.meta.url),'utf8'));
 const valid=new Ajv({strict:true}).compile(schema);
 const pkg={format:'mbs-module-package-v1',id:'mbs/hero',version:'1.0.0',engineApi:'core/v1',renderKind:'react',propsSchema:{type:'object'},defaultProps:{},capabilities:['responsive','ssr','preview'],entry:'builtin:hero',styles:['builtin:styles'],dependencies:[],ssr:true,hydration:'none',artifactDigest:'sha256:'+'a'.repeat(64),status:'builtin',trust:'compiled-in'};
 assert.ok(valid(pkg));
 for(const change of [{entry:'https://evil.test/run.js'},{hydration:'dynamic'},{trust:'signed'},{script:'alert(1)'},{dependencies:['unknown']}])assert.equal(valid({...pkg,...change}),false);
});
