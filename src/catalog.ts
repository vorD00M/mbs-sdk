import type { DesignPresetV1 } from './builder.js';

export type CatalogLabels = Record<'ru-RU' | 'en-US', string>;
export type CompositionAxis = 'geometry' | 'media' | 'typography' | 'grid' | 'order' | 'decoration' | 'states' | 'responsive' | 'interaction';
export interface CatalogPresetV1 {
    format: 'mbs-catalog-preset-v1';
    preset: DesignPresetV1;
    metadata: { tags: Record<'ru-RU' | 'en-US', string[]>; features: Partial<Record<CompositionAxis, CatalogLabels>> };
    /** SHA-256 of RFC 8785 canonical {preset, metadata}, excluding this field. */
    contentDigest: string;
}
export interface DesignLibraryV2 {
    format: 'mbs-design-library-v2'; id: string; version: string;
    entries: { path: string; sha256: string }[];
    files: Record<string, string>;
}
export interface CatalogImportReportV1 {
    format: 'mbs-design-import-report-v1'; scope: 'offline' | 'workspace';
    workspaceId?: string; catalogRevision?: number;
    pack: { id: string; version: string; digest: string };
    presets: { id: string; version: string; contentDigest: string; action: 'add' | 'reuse' | 'conflict' }[];
    canApply: boolean; warnings: string[];
}
export interface CatalogStateV1 { revision: number; packages: { id: string; packId: string; version: string; digest: string; presetCount: number }[] }
export interface CatalogCommitV1 { packageId?: string; committedRevision: number; replayed: boolean }
