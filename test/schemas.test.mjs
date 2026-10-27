import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const ajv=new Ajv2020({allErrors:true});addFormats(ajv);

test('public companion binds immutable release, assets and revision routes without changing Release v1',async()=>{
 const local=await json('../schemas/site-localization.v1.schema.json');
 const validator=new Ajv2020({strict:true});addFormats(validator);validator.addSchema(local,'https://mbsplatform.online/schemas/site-localization.v1.schema.json');
 const validate=validator.compile(await json('../schemas/site-public-config.v1.schema.json'));
 const id='00000000-0000-4000-8000-000000000001';
 const c={format:'mbs-site-public-config-v1',installationId:id,siteId:id,releaseId:id,siteName:'Example',origin:'https://example.test',host:'example.test',renderer:'mbs-public-adapter-v1',rendererDigest:'0'.repeat(64),localization:{schemaVersion:1,mode:'SINGLE',defaultLocale:'ru-RU',locales:['ru-RU'],routing:{strategy:'NONE'},missingTranslationPolicy:'OMIT'},assets:[],pages:[{pageId:id,revision:1,locale:'ru-RU',path:'/',translationGroupId:id,title:'Example',description:''}]};
 assert.equal(validate(c),true,JSON.stringify(validate.errors));
 assert.equal(validate({...c,secret:'forbidden'}),false);
 assert.equal(validate({...c,rendererDigest:'sha256:'+'0'.repeat(64)}),false);
 assert.equal(validate({...c,pages:[]}),false);
});

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
test('localization config is separate from published page/release v1',async()=>{
 const validate=ajv.compile(await json('../schemas/site-localization.v1.schema.json'));
 const c={schemaVersion:1,mode:'SINGLE',defaultLocale:'ru-RU',locales:['ru-RU'],routing:{strategy:'NONE'},missingTranslationPolicy:'OMIT'};
 assert.equal(validate(c),true,JSON.stringify(validate.errors));assert.equal(validate({...c,locales:['ru-RU','en-US']}),false);
 assert.equal(validate({...c,mode:'MULTI',locales:['ru-RU','en-US'],routing:{strategy:'SUBPATH'}}),true);
 assert.equal(validate({...c,routing:{strategy:'SUBPATH'}}),false);
});
