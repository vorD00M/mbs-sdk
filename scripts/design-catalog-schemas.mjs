import { readFile, writeFile } from 'node:fs/promises';
const base = 'https://mbsplatform.online/schemas/';
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const text = (max = 200) => ({ type: 'string', minLength: 1, maxLength: max });
const hash = { type: 'string', pattern: '^[0-9a-f]{64}$' };
const version = { type: 'string', pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$', maxLength: 40 };
const labels = object({ 'ru-RU': text(300), 'en-US': text(300) });
const featureNames = ['geometry', 'media', 'typography', 'grid', 'order', 'decoration', 'states', 'responsive', 'interaction'];
const preset = object({ format: { const: 'mbs-catalog-preset-v1' }, preset: { $ref: base + 'design-preset.v1.schema.json' }, metadata: object({ tags: object(Object.fromEntries(['ru-RU', 'en-US'].map(l => [l, { type: 'array', minItems: 1, maxItems: 12, uniqueItems: true, items: text(40) }]))), features: { ...object(Object.fromEntries(featureNames.map(f => [f, labels])), []), minProperties: 2 } }), contentDigest: hash });
const pack = object({ format: { const: 'mbs-design-library-v2' }, id: { type: 'string', pattern: '^[a-z][a-z0-9-]{0,39}$' }, version, entries: { type: 'array', minItems: 1, maxItems: 1040, items: object({ path: { type: 'string', pattern: '^presets/[a-z-]+-[0-9]{3}-[0-9]+\\.[0-9]+\\.[0-9]+\\.json$', maxLength: 160 }, sha256: hash }) }, files: { type: 'object', minProperties: 3, maxProperties: 3200, propertyNames: { pattern: '^[a-zA-Z0-9][a-zA-Z0-9_./-]*$', maxLength: 200 }, additionalProperties: hash } });
const report = object({ format: { const: 'mbs-design-import-report-v1' }, scope: { enum: ['offline', 'workspace'] }, workspaceId: { type: 'string', format: 'uuid' }, catalogRevision: { type: 'integer', minimum: 0 }, pack: object({ id: text(40), version, digest: hash }), presets: { type: 'array', minItems: 1, maxItems: 1040, items: object({ id: { type: 'string', pattern: '^mbs/[a-z-]+/[0-9]{3}$' }, version, contentDigest: hash, action: { enum: ['add', 'reuse', 'conflict'] } }) }, canApply: { type: 'boolean' }, warnings: { type: 'array', maxItems: 20, items: text(200) } }, ['format', 'scope', 'pack', 'presets', 'canApply', 'warnings']);
for (const [name, body] of Object.entries({ 'catalog-preset.v1': preset, 'design-library.v2': pack, 'design-import-report.v1': report })) {
    const bytes = JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', $id: base + name + '.schema.json', ...body }, null, 2) + '\n';
    const path = new URL('../schemas/' + name + '.schema.json', import.meta.url);
    if (process.argv.includes('--check')) { if (await readFile(path, 'utf8') !== bytes) throw Error('Stale catalog schema: ' + name); }
    else await writeFile(path, bytes);
}
