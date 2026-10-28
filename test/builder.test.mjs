import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {layoutLocations,moveLayoutNode,insertLayoutNode,removeLayoutNode,duplicateLayoutNode,upgradePageV1,designCategories} from '../dist/index.js';
const root=new URL('../',import.meta.url);
const json=async name=>JSON.parse(await readFile(new URL('schemas/'+name+'.schema.json',root),'utf8'));
const id='00000000-0000-4000-8000-000000000001';
const block=n=>({id:n,kind:'module',module:'mbs/rich-text',version:'1.0.0',props:{text:n}});
const layout=()=>({id:'root',kind:'grid',semanticRole:'main',children:[{id:'left',kind:'region',slot:'left-sidebar',children:[block('a')]},{id:'main',kind:'stack',children:[block('b')]}]});
test('v2 is additive and strictly excludes executable style/JS/unknown properties',async()=>{
 const ajv=new Ajv2020({strict:true,allErrors:true});addFormats(ajv);ajv.addSchema(await json('builder-common.v1'));
 const v=ajv.compile(await json('page.v2'));
 const page={schemaVersion:2,pageId:id,locale:'ru-RU',seo:{title:'Example',description:''},themeRef:'mbs/builder-default@1.0.0',siteThemeRef:null,siteShellRef:null,layout:layout()};
 assert.equal(v(page),true,JSON.stringify(v.errors));
 for(const wrong of [{...page,jsx:'x'},{...page,layout:{...page.layout,style:{padding:'url(javascript:alert(1))'}}},{...page,layout:{...page.layout,children:[{...block('x'),children:[]}]}},{...page,themeRef:'mbs/default@latest'}])assert.equal(v(wrong),false);
 assert.equal(new Set(designCategories).size,20);
});
test('moves are immutable, stable-ID preserving and reject self/descendant moves',()=>{
 const before=layout(),saved=structuredClone(before),next=moveLayoutNode(before,'a','main',1);
 assert.deepEqual(before,saved);assert.deepEqual(next.children[0].children,[]);assert.deepEqual(next.children[1].children.map(v=>v.id),['b','a']);
 assert.throws(()=>moveLayoutNode(before,'root','main',0),/INVALID_LAYOUT_MOVE/);
 assert.throws(()=>moveLayoutNode(before,'main','main',0),/LAYOUT_CYCLE/);
 assert.deepEqual(removeLayoutNode(next,'b').children[1].children.map(v=>v.id),['a']);
 let n=0;const duplicate=duplicateLayoutNode(before,'left',()=>`copy-${++n}`);assert.equal(duplicate.children[1].id,'copy-1');assert.equal(duplicate.children[1].children[0].id,'copy-2');assert.equal(duplicate.children[1].children[0].props.text,'a');
});
test('node/depth limits apply before cloning and failed operations retain original',()=>{
 const root=layout();assert.throws(()=>insertLayoutNode(root,'main',0,block('a')),/DUPLICATE_LAYOUT_NODE/);assert.equal(root.children[1].children.length,1);
 const large={id:'root',kind:'stack',children:Array.from({length:500},(_,i)=>block('n'+i))};assert.throws(()=>layoutLocations(large),/TOO_MANY_LAYOUT_NODES/);
 let deep=block('leaf');for(let i=0;i<8;i++)deep={id:'p'+i,kind:'stack',children:[deep]};assert.throws(()=>layoutLocations(deep),/LAYOUT_TOO_DEEP/);
 const cycle={id:'cycle',kind:'stack',children:[]};cycle.children.push(cycle);assert.throws(()=>layoutLocations(cycle),/DUPLICATE_LAYOUT_NODE/);
});
test('explicit v1 upgrade retains original bytes, IDs and exact legacy container versions',async()=>{
 const raw=await readFile(new URL('examples/page.json',root),'utf8'),before=createHash('sha256').update(raw).digest('hex'),page=JSON.parse(raw);
 const v2=upgradePageV1(page);assert.equal(v2.schemaVersion,2);assert.equal(v2.pageId,page.pageId);assert.equal(v2.layout.semanticRole,'main');
 const modules=layoutLocations(v2.layout).filter(v=>v.node.kind==='module').map(v=>v.node);
 assert.deepEqual(modules.map(v=>[v.id,v.module,v.version,v.props]),page.layout.regions.flatMap(r=>r.blocks.map(v=>[v.id,v.module,v.version,v.props])));
 assert.equal(createHash('sha256').update(JSON.stringify(page,null,2)).digest('hex'),createHash('sha256').update(JSON.stringify(JSON.parse(raw),null,2)).digest('hex'));
 assert.equal(createHash('sha256').update(await readFile(new URL('examples/page.json',root),'utf8')).digest('hex'),before);
});
test('all new schemas compile with strict closed contracts and their exact references',async()=>{
 const ajv=new Ajv2020({strict:true});addFormats(ajv);
 for(const name of ['site-localization.v1','builder-common.v1','page.v2','site-shell.v1','region.v1','theme-pack.v1','site-theme.v1','design-preset.v1','site-template.v1','builder-composition.v1','site-public-config.v2'])ajv.addSchema(await json(name));
 for(const name of ['page.v2','site-shell.v1','region.v1','theme-pack.v1','site-theme.v1','design-preset.v1','site-template.v1','builder-composition.v1','site-public-config.v2'])assert.equal(typeof ajv.getSchema('https://mbsplatform.online/schemas/'+name+'.schema.json'),'function');
});
