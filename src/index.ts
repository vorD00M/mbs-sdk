export type Edition='CLOUD_UNLIMITED'|'OPERATOR'|'STUDIO';
export type { PageDocumentV2, EditablePageDocument, LayoutNodeV2, LayoutNodeBaseV2, LayoutBranchV2, LayoutModuleV2, LayoutSlotV2, LayoutDividerV2, LayoutRegionRefV2, StyleTokensV1, ResponsiveLayoutV1, BuilderSlot, BuilderBreakpoint, BuilderGrid, BuilderColor, BuilderFont, RevisionRefV1, RichTextV1, RichBlockV1, RichInlineV1, StaticSourceV1, StaticDataItemV1, ThemeTokensV1, ThemePackV1, SiteThemeV1, SiteShellV1, RegionDocumentV1, BuilderCompositionV1, DesignProvenanceV1, DesignCategoryV1, DesignPresetV1, SiteTemplateV1, BuilderPreviewV1 } from './builder.js';
export { designCategories } from './builder.js';
export type { SitePublicConfigV2, PublicRenderRequestV2 } from './builder.js';
export { layoutLocations, moveLayoutNode, insertLayoutNode, removeLayoutNode, duplicateLayoutNode, upgradePageV1 } from './layout.js';
export type { SitePublicConfigV1, PublicRenderRequestV1, PublicRenderResultV1, DeliveryProjectionV1, PublishState, PublishJobV1, VerifiedReleaseV1 } from './publishing.js';
export type {BuiltinModulePackageV1, BuiltinModulePackageV2, DraftPreviewV1} from './modules.js';
export type LicenseState='UNACTIVATED'|'VALID'|'GRACE'|'EXPIRED'|'REVOKED'|'INVALID_SIGNATURE'|'WRONG_INSTALLATION'|'UNSUPPORTED_FORMAT';
export interface LicensePayload {
 license_id:string;installation_id:string;installation_public_key:string;edition:Edition;features:string[];
 unlimited_sites:boolean;unlimited_accounts:boolean;white_label:boolean;resale_enabled:boolean;
 max_installations:number;issued_at:string;expires_at:string|null;updates_entitlement:'ALL_STANDARD_FOREVER';
 lease_mode:'online'|'offline';lease_expires_at:string|null;grace_period_seconds:number;sequence:number;revoked:boolean;
}
export interface LicenseEnvelope {format:'mbs-platform-license-v1';kid:string;payload:LicensePayload;signature:string}
export interface ModuleManifest {
 id:string;version:string;engineApi:string;renderKind:'react';propsSchemaRef:string;
 entry:string;styles:string[];artifactDigest:string;capabilities:('responsive'|'ssr'|'preview')[];
}
export interface PageBlock {
 id:string;module:string;version:string;props:Record<string,unknown>;
 visibility?:{mobile:boolean;tablet:boolean;desktop:boolean};
}
export interface PageDocument {
 schemaVersion:1;pageId:string;locale:string;seo:{title:string;description:string};themeRef:string;
 layout:{id:string;type:'grid';regions:{id:string;semantic:string;blocks:PageBlock[]}[]};
}
export interface ReleaseManifest {
 schemaVersion:1;releaseId:string;siteId:string;createdAt:string;
 pages:{pageId:string;locale:string;path:string;objectKey:string;sha256:string}[];
 modules:{id:string;version:string;sha256:string}[];
 assets:{objectKey:string;sha256:string;mimeType:string;sizeBytes:number}[];
}
export interface APIError {code:string;message:string;details:unknown[];requestId:string;params?:Record<string,string|number|boolean>}
export type {SiteLocalizationConfig,SiteLocalizationMode,TranslationState,LocaleDescriptor,LocalizedPageRef,LocaleRouteMapping} from './localization.js';
export {canonicalLocale,normalizeLocalizationConfig,localeRoutes} from './localization.js';
