import type { LayoutNodeV2, LayoutBranchV2, PageDocumentV2, RevisionRefV1 } from './builder.js';
import type { PageDocument } from './index.js';

export interface LayoutLocationV2 { node: LayoutNodeV2; parent: LayoutBranchV2 | null; index: number; depth: number }
const branch = (n: LayoutNodeV2): n is LayoutBranchV2 => 'children' in n;

export function layoutLocations(root: LayoutNodeV2, limits = { nodes: 500, depth: 8 }): LayoutLocationV2[] {
    const result: LayoutLocationV2[] = [], ids = new Set<string>(), objects = new Set<object>();
    const todo: LayoutLocationV2[] = [{ node: root, parent: null, index: 0, depth: 1 }];
    while (todo.length) {
        const v = todo.pop()!;
        if (!v.node || typeof v.node !== 'object' || typeof v.node.id !== 'string' || objects.has(v.node) || ids.has(v.node.id)) throw Error('DUPLICATE_LAYOUT_NODE');
        if (v.depth > limits.depth) throw Error('LAYOUT_TOO_DEEP');
        if (result.length >= limits.nodes) throw Error('TOO_MANY_LAYOUT_NODES');
        objects.add(v.node); ids.add(v.node.id); result.push(v);
        if (branch(v.node)) {
            if (!Array.isArray(v.node.children) || v.node.children.length + result.length > limits.nodes) throw Error('TOO_MANY_LAYOUT_NODES');
            for (let i = v.node.children.length - 1; i >= 0; i--) todo.push({ node: v.node.children[i], parent: v.node, index: i, depth: v.depth + 1 });
        }
    }
    return result;
}
export function moveLayoutNode(root: LayoutNodeV2, id: string, destination: string, index: number): LayoutNodeV2 {
    layoutLocations(root);
    const next = structuredClone(root), locations = layoutLocations(next);
    const source = locations.find(v => v.node.id === id), target = locations.find(v => v.node.id === destination);
    if (!source?.parent || !target || !branch(target.node) || !Number.isInteger(index) || index < 0 || index > target.node.children.length) throw Error('INVALID_LAYOUT_MOVE');
    if (layoutLocations(source.node).some(v => v.node.id === destination)) throw Error('LAYOUT_CYCLE');
    source.parent.children.splice(source.index, 1);
    target.node.children.splice(index - (target.node === source.parent && source.index < index ? 1 : 0), 0, source.node);
    layoutLocations(next);
    return next;
}
export function insertLayoutNode(root: LayoutNodeV2, destination: string, index: number, node: LayoutNodeV2): LayoutNodeV2 {
    layoutLocations(root); layoutLocations(node);
    const next = structuredClone(root), target = layoutLocations(next).find(v => v.node.id === destination);
    if (!target || !branch(target.node) || !Number.isInteger(index) || index < 0 || index > target.node.children.length) throw Error('INVALID_LAYOUT_INSERT');
    target.node.children.splice(index, 0, structuredClone(node)); layoutLocations(next); return next;
}
export function removeLayoutNode(root: LayoutNodeV2, id: string): LayoutNodeV2 {
    layoutLocations(root);
    const next = structuredClone(root), source = layoutLocations(next).find(v => v.node.id === id);
    if (!source?.parent) throw Error('INVALID_LAYOUT_REMOVE');
    source.parent.children.splice(source.index, 1); return next;
}
export function duplicateLayoutNode(root: LayoutNodeV2, id: string, newID: () => string): LayoutNodeV2 {
    const source = layoutLocations(root).find(v => v.node.id === id);
    if (!source?.parent) throw Error('INVALID_LAYOUT_DUPLICATE');
    const copied = structuredClone(source.node);
    for (const v of layoutLocations(copied)) v.node.id = newID();
    return insertLayoutNode(root, source.parent.id, source.index + 1, copied);
}
export function upgradePageV1(page: PageDocument, shell: RevisionRefV1 | null = null): PageDocumentV2 {
    const make = (old: string, used: Set<string>) => { let value = old, n = 0; while (used.has(value)) value = old.slice(0, 80) + '-v2-' + (++n); used.add(value); return value; };
    const used = new Set<string>(page.layout.regions.flatMap(r => [r.id, ...r.blocks.map(b => b.id)]));
    const root = make(page.layout.id, used);
    const children = page.layout.regions.map(r => ({ id: r.id, kind: 'region' as const, slot: r.semantic === 'main' ? 'main' as const : undefined, children: r.blocks.map(b => ({ ...structuredClone(b), kind: 'module' as const })) }));
    return { schemaVersion: 2, pageId: page.pageId, locale: page.locale, seo: { ...page.seo }, themeRef: 'mbs/builder-default@1.0.0', siteThemeRef: null, siteShellRef: shell, layout: { id: root, kind: 'stack', semanticRole: 'main', children } };
}
