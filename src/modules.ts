// Additive contract: PageDocument v1 and the original ModuleManifest stay unchanged.
export interface BuiltinModulePackageV1 {
    format: 'mbs-module-package-v1';
    id: string;
    version: string;
    engineApi: 'core/v1';
    renderKind: 'react';
    propsSchema: Record<string, unknown>;
    defaultProps: Record<string, unknown>;
    capabilities: ('responsive' | 'ssr' | 'preview')[];
    entry: string;
    styles: string[];
    dependencies: string[];
    ssr: true;
    hydration: 'none';
    artifactDigest: string;
    status: 'builtin';
    trust: 'compiled-in';
}
export interface DraftPreviewV1 {
    format: 'mbs-draft-preview-v1';
    siteId: string;
    pageId: string;
    registryDigest: string;
    localization: import('./localization.js').SiteLocalizationConfig;
    document: import('./index.js').PageDocument;
    targets: { pageId: string; siteId: string; locale: string; path: string; previewHref: string }[];
}
