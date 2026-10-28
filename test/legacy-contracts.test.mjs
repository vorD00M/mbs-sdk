import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const accepted={
 'page.v1':'308e5d7f100431d82c5b8bb0968dbd95b95a104ea0eb068b8c966282b0eb6017',
 'release.v1':'f3ebec2632b0a4ba9971932923f9ae75621f26f28b0b9618eaf51b425222e6d9',
 'site-localization.v1':'cfd2ced6d31c0ded8d22772edc20c81ade5a5511c6db2c917a52680eb135981c',
 'license.v1':'fe1391f62971f6f365ebc8fb8b2396a2d61d9e1054a6d7755e925d29ecd082d2',
 'module-package.v1':'8f96a83c3d9cb3b8570271600ceff5ea818c3f17630059aa61a20c1f1e9154a2',
 'site-public-config.v1':'5bea37ad18f74b39440a7888989a5ba9f01d49901b6ca899bb85f07c33b2a737',
};
test('accepted v1 schemas remain byte-for-byte unchanged while v2 is additive',async()=>{
 for(const [name,hash] of Object.entries(accepted))assert.equal(createHash('sha256').update(await readFile(new URL('../schemas/'+name+'.schema.json',import.meta.url))).digest('hex'),hash,name);
});
