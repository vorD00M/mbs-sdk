import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const ajv=new Ajv2020({allErrors:true});addFormats(ajv);

test('valid page fixture and rejection of executable fields',async()=>{
 const validate=ajv.compile(await json('../schemas/page.v1.schema.json'));
 const page=await json('../examples/page.json');assert.equal(validate(page),true,JSON.stringify(validate.errors));
 assert.equal(validate({...page,jsx:'<script />'}),false);
 assert.equal(validate({...page,schemaVersion:2}),false);
});
test('release rejects unpublished/private fields',async()=>{
 const validate=ajv.compile(await json('../schemas/release.v1.schema.json'));
 const release={schemaVersion:1,releaseId:'00000000-0000-4000-8000-000000000001',siteId:'00000000-0000-4000-8000-000000000002',createdAt:'2026-10-27T00:00:00Z',pages:[{pageId:'00000000-0000-4000-8000-000000000003',locale:'ru-RU',path:'/',objectKey:'releases/site/release/home.json',sha256:'0'.repeat(64)}],modules:[],assets:[]};
 assert.equal(validate(release),true,JSON.stringify(validate.errors));assert.equal(validate({...release,sessionToken:'not-allowed'}),false);
});
test('license validates shape, not cryptographic trust',async()=>{
 const validate=ajv.compile(await json('../schemas/license.v1.schema.json'));
 assert.equal(validate({format:'mbs-platform-license-v1',kid:'example',payload:{edition:'STUDIO'},signature:'not-a-signature'}),false);
});
