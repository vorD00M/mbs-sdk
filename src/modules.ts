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

// Builder-only compiled packages. The frozen core/v1 package contract is not
// widened: legacy renderers cannot execute these modules accidentally.
export interface BuiltinModulePackageV2 extends Omit<BuiltinModulePackageV1, 'format'|'engineApi'|'hydration'|'capabilities'> {
    format: 'mbs-module-package-v2';
    engineApi: 'builder/v1';
    hydration: 'none'|'islands';
    capabilities: ('responsive'|'ssr'|'preview'|'client-islands')[];
    allowedSlots: import('./builder.js').BuilderSlot[];
    islands: ('navigation'|'carousel'|'tabs'|'collection'|'form')[];
    labels: Record<'ru-RU'|'en-US', {title:string;description:string}>;
}
