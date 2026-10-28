import type { PageDocument, SiteLocalizationConfig } from './index.js';

export type BuilderSlot = 'topper' | 'header' | 'navigation' | 'hero' | 'breadcrumb' | 'left-sidebar' | 'main' | 'right-sidebar' | 'footer' | 'floating';
export type BuilderBreakpoint = 'mobile' | 'tablet' | 'desktop';
export type BuilderGrid = '1' | '2-equal' | '3-equal' | '4-equal' | '1/3+2/3' | '2/3+1/3' | '1/4+1/2+1/4' | 'sidebar-main' | 'main-sidebar';
export type BuilderColor = 'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'muted' | 'border' | 'success' | 'warning' | 'error' | 'contrast';
export type BuilderFont = 'system-sans' | 'system-serif' | 'humanist' | 'mono';
export interface RevisionRefV1 { id: string; revision: number; inherit: boolean }
export interface StyleTokensV1 {
    background?: BuilderColor; color?: BuilderColor; borderColor?: BuilderColor;
    padding?: number; gap?: number; radius?: number; borderWidth?: number;
    maxWidth?: number; width?: 'fluid' | 'boxed' | 'full-bleed';
    font?: BuilderFont; fontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'display';
    weight?: 400 | 500 | 600 | 700 | 800; align?: 'start' | 'center' | 'end';
    justify?: 'start' | 'center' | 'end' | 'between'; direction?: 'row' | 'column';
    shadow?: 'none' | 'subtle' | 'medium' | 'deep';
    sticky?: 'none' | 'top'; offset?: number;
    position?: 'flow' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'center';
    opacity?: number; rotate?: number; scale?: number; zIndex?: number;
    motion?: 'none' | 'fade' | 'slide' | 'reveal';
}
export interface ResponsiveLayoutV1 { columns?: number; layout?: BuilderGrid; colSpan?: number; order?: number; visible?: boolean; gap?: number }
export interface LayoutNodeBaseV2 {
    id: string;
    semanticRole?: 'div' | 'section' | 'main' | 'header' | 'nav' | 'aside' | 'footer';
    style?: StyleTokensV1;
    responsive?: Partial<Record<BuilderBreakpoint, ResponsiveLayoutV1>>;
    visibility?: Record<BuilderBreakpoint, boolean>;
}
export interface LayoutBranchV2 extends LayoutNodeBaseV2 {
    kind: 'grid' | 'flex' | 'stack' | 'region' | 'layer';
    slot?: BuilderSlot;
    children: LayoutNodeV2[];
}
export interface LayoutModuleV2 extends LayoutNodeBaseV2 {
    kind: 'module'; module: string; version: string; props: Record<string, unknown>;
    presetRef?: { id: string; version: string };
}
export interface LayoutSlotV2 extends LayoutNodeBaseV2 { kind: 'slot'; slot: 'main' }
export interface LayoutDividerV2 extends LayoutNodeBaseV2 { kind: 'divider' }
export interface LayoutRegionRefV2 extends LayoutNodeBaseV2 { kind: 'region-ref'; regionRef: RevisionRefV1 }
export type LayoutNodeV2 = LayoutBranchV2 | LayoutModuleV2 | LayoutSlotV2 | LayoutDividerV2 | LayoutRegionRefV2;

export interface RichInlineV1 { text: string; marks?: ('bold' | 'italic' | 'code')[]; link?: { pageId: string } | { href: string } }
export type RichBlockV1 = { type: 'paragraph' | 'h2' | 'h3' | 'quote'; children: RichInlineV1[] } | { type: 'list'; ordered: boolean; items: { children: RichInlineV1[] }[] };
export interface RichTextV1 { version: 1; blocks: RichBlockV1[] }
export interface StaticDataItemV1 {
    id: string; title: string; description?: string; category?: string;
    imageAssetId?: string; targetPageId?: string; tags?: string[];
    price?: number; date?: string; label?: string;
}
export interface StaticSourceV1 { kind: 'static' | 'manualSelection'; items: StaticDataItemV1[]; selection?: string[] }
export interface PageDocumentV2 {
    schemaVersion: 2; pageId: string; locale: string;
    seo: { title: string; description: string };
    themeRef: string; siteThemeRef: RevisionRefV1 | null; siteShellRef: RevisionRefV1 | null;
    layout: LayoutNodeV2; bindings?: Record<string, StaticSourceV1>;
}
export type EditablePageDocument = PageDocument | PageDocumentV2;
export interface SiteShellV1 { format: 'mbs-site-shell-v1'; siteId: string; locale: string; name: string; layout: LayoutNodeV2 }
export interface RegionDocumentV1 { format: 'mbs-region-v1'; siteId: string; locale: string; name: string; layout: LayoutNodeV2 }
export interface ThemeTokensV1 {
    colors: Record<BuilderColor, string>;
    typography: { body: BuilderFont; heading: BuilderFont; bodySize: number; headingSize: number; lineHeight: number; headingWeight: 400 | 500 | 600 | 700 | 800 };
    spacing: { unit: number; section: number; gutter: number; maxWidth: number };
    effects: { radius: number; shadow: 'none' | 'subtle' | 'medium' | 'deep'; motion: 'none' | 'fade' | 'slide' | 'reveal' };
}
export interface DesignProvenanceV1 { creator: string; license: string; createdAt: string; sourceCategory: 'original' | 'licensed' | 'system'; source?: string }
export interface ThemePackV1 { format: 'mbs-theme-pack-v1'; id: string; version: string; labels: Record<'ru-RU' | 'en-US', { title: string; description: string }>; tokens: ThemeTokensV1; provenance: DesignProvenanceV1 }
export interface SiteThemeV1 { format: 'mbs-site-theme-v1'; siteId: string; baseThemeRef: string; tokens: ThemeTokensV1 }
export interface BuilderCompositionV1 {
    format: 'mbs-builder-composition-v1';
    themePack: ThemePackV1;
    siteTheme: { id: string; revision: number; document: SiteThemeV1 } | null;
    siteShell: { id: string; revision: number; document: SiteShellV1 } | null;
    regions: { id: string; revision: number; document: RegionDocumentV1 }[];
}
export const designCategories = ['topper', 'header', 'navigation', 'hero', 'breadcrumb', 'layout', 'left-sidebar', 'right-sidebar', 'footer', 'cards', 'carousel', 'tabs', 'accordion', 'stepper', 'pagination', 'filter', 'media', 'content', 'cta', 'social'] as const;
export type DesignCategoryV1 = typeof designCategories[number];
export interface DesignPresetV1 {
    format: 'mbs-design-preset-v1'; id: string; version: string; category: DesignCategoryV1;
    allowedSlots: BuilderSlot[];
    moduleRefs: { id: string; version: string }[];
    labels: Record<'ru-RU' | 'en-US', { title: string; description: string }>;
    layout: LayoutNodeV2; themeTokens?: StyleTokensV1;
    thumbnail: { path: string; sha256: string; width: number; height: number };
    provenance: DesignProvenanceV1;
}
export interface SiteTemplateV1 {
    format: 'mbs-site-template-v1'; id: string; version: string; engineApi: 'builder/v1';
    labels: Record<'ru-RU' | 'en-US', { title: string; description: string }>;
    localization: SiteLocalizationConfig; themeRef: string;
    shells: { id: string; revision: number; locale: string; document: SiteShellV1 }[];
    pages: { pageId: string; translationGroupId: string; locale: string; path: string; title: string; document: PageDocumentV2 }[];
    assets: { id: string; path: string; sha256: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; provenance: DesignProvenanceV1 }[];
    provenance: DesignProvenanceV1;
}
export interface BuilderPreviewV1 {
    format: 'mbs-builder-preview-v1'; siteId: string; pageId: string; registryDigest: string;
    localization: SiteLocalizationConfig; document: PageDocumentV2; composition: BuilderCompositionV1;
    targets: { pageId: string; siteId: string; locale: string; path: string; previewHref: string }[];
    assets: { id: string; href: string; width: number; height: number }[];
}
export interface SitePublicConfigV2 extends Omit<import('./publishing.js').SitePublicConfigV1, 'format' | 'renderer' | 'pages'> {
    format: 'mbs-site-public-config-v2'; renderer: 'mbs-public-adapter-v2';
    pages: (import('./publishing.js').SitePublicConfigV1['pages'][number] & { documentVersion: 1 | 2 })[];
    compositions: { pageId: string; value: BuilderCompositionV1 }[];
}
export interface PublicRenderRequestV2 {
    format: 'mbs-public-render-v2'; config: SitePublicConfigV2;
    inputs: (import('./modules.js').DraftPreviewV1 | BuilderPreviewV1)[];
}
