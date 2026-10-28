import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import formats from 'ajv-formats';
const read=name=>JSON.parse(readFileSync(new URL('../schemas/'+name,import.meta.url)));
test('builder module packages declare bounded client islands without changing core/v1',()=>{
 const ajv=new Ajv({strict:true});formats(ajv);ajv.addSchema(read('builder-common.v1.schema.json'));
 const validate=ajv.compile(read('module-package.v2.schema.json')),legacy=ajv.compile(read('module-package.v1.schema.json'));
 const pkg={format:'mbs-module-package-v2',id:'builder/collection',version:'1.0.0',engineApi:'builder/v1',renderKind:'react',propsSchema:{type:'object',additionalProperties:false},defaultProps:{},capabilities:['responsive','ssr','preview','client-islands'],entry:'builtin:mbs-builder/visual/v1',styles:['builtin:mbs-builder/visual/v1/styles'],dependencies:[],ssr:true,hydration:'islands',artifactDigest:'sha256:'+'a'.repeat(64),status:'builtin',trust:'compiled-in',allowedSlots:['main'],islands:['collection'],labels:{'ru-RU':{title:'Каталог',description:''},'en-US':{title:'Collection',description:''}}};
 assert.ok(validate(pkg),JSON.stringify(validate.errors));assert.equal(legacy(pkg),false);
 for(const mutate of [p=>p.islands=['arbitrary-script'],p=>p.hydration='none',p=>p.islands=[],p=>p.allowedSlots=['unknown'],p=>p.engineApi='core/v1',p=>p.customHTML='<script>bad</script>']){const bad=structuredClone(pkg);mutate(bad);assert.equal(validate(bad),false)}
 const staticPackage={...pkg,hydration:'none',islands:[],capabilities:['responsive','ssr','preview']};assert.ok(validate(staticPackage));
});
