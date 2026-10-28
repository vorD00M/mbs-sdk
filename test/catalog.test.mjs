import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ strict: true }); addFormats(ajv);
for (const name of ['builder-common.v1', 'design-preset.v1', 'catalog-preset.v1', 'design-library.v2', 'design-import-report.v1']) ajv.addSchema(JSON.parse(await readFile(new URL('../schemas/' + name + '.schema.json', import.meta.url), 'utf8')));
const schema = name => ajv.getSchema('https://mbsplatform.online/schemas/' + name + '.schema.json');
const labels = { 'ru-RU': { title: 'Contract fixture', description: 'Not an accepted catalog design' }, 'en-US': { title: 'Contract fixture', description: 'Not an accepted catalog design' } };
const preset = { format: 'mbs-design-preset-v1', id: 'mbs/content/001', version: '1.0.0', category: 'content', allowedSlots: ['main'], moduleRefs: [{ id: 'mbs/rich-text', version: '1.0.0' }], labels, layout: { id: 'example', kind: 'module', module: 'mbs/rich-text', version: '1.0.0', props: { text: 'Fixture' } }, thumbnail: { path: 'previews/content-001.png', width: 8, height: 8, sha256: 'a'.repeat(64) }, provenance: { creator: 'MBS tests', license: 'CC0-1.0', createdAt: '2026-10-28T00:00:00Z', sourceCategory: 'original' } };
const envelope = () => ({ format: 'mbs-catalog-preset-v1', preset: structuredClone(preset), metadata: { tags: { 'ru-RU': ['контент'], 'en-US': ['content'] }, features: { geometry: { 'ru-RU': 'Одна колонка', 'en-US': 'One column' }, typography: { 'ru-RU': 'Текстовая секция', 'en-US': 'Text section' } } }, contentDigest: 'b'.repeat(64) });

test('catalog envelope is additive: the frozen preset still validates independently', () => {
    assert.equal(schema('design-preset.v1')(preset), true);
    assert.equal(schema('catalog-preset.v1')(envelope()), true, JSON.stringify(schema('catalog-preset.v1').errors));
    assert.equal(schema('design-preset.v1')({ ...preset, metadata: envelope().metadata }), false);
});
test('catalog requires bilingual tags and two different typed composition axes, not arbitrary code', () => {
    for (const mutate of [e => delete e.metadata.tags['ru-RU'], e => delete e.metadata.features.geometry, e => e.metadata.features.RGB = { 'ru-RU': 'x', 'en-US': 'x' }, e => e.metadata.tags['en-US'] = ['same', 'same'], e => e.script = 'alert(1)', e => e.contentDigest = 'invalid', e => e.preset.layout.style = { customCSS: 'body{display:none}' }]) {
        const value = envelope(); mutate(value); assert.equal(schema('catalog-preset.v1')(value), false);
    }
});
test('manifest and dry-run report have closed versioned contracts and no signature bypass flag', () => {
    const pack = { format: 'mbs-design-library-v2', id: 'fixture', version: '1.0.0', entries: [{ path: 'presets/content-001-1.0.0.json', sha256: 'a'.repeat(64) }], files: { 'NOTICE.txt': 'a'.repeat(64), 'previews/content-001.png': 'b'.repeat(64), 'presets/content-001-1.0.0.json': 'c'.repeat(64) } };
    assert.equal(schema('design-library.v2')(pack), true);
    for (const value of [{ ...pack, trusted: true }, { ...pack, version: 'latest' }, { ...pack, signature: 'ignore' }, { ...pack, entries: [{ path: '../escape', sha256: 'a'.repeat(64) }] }]) assert.equal(schema('design-library.v2')(value), false);
    const report = { format: 'mbs-design-import-report-v1', scope: 'offline', pack: { id: 'fixture', version: '1.0.0', digest: 'a'.repeat(64) }, presets: [{ id: preset.id, version: preset.version, contentDigest: 'b'.repeat(64), action: 'add' }], canApply: true, warnings: ['WORKSPACE_CONFLICTS_NOT_CHECKED'] };
    assert.equal(schema('design-import-report.v1')(report), true);
    assert.equal(schema('design-import-report.v1')({ ...report, csrfDisabled: true }), false);
});
