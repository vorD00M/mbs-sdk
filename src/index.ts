export type Edition='CLOUD_UNLIMITED'|'OPERATOR'|'STUDIO';
export type LicenseState='UNACTIVATED'|'VALID'|'GRACE'|'EXPIRED'|'REVOKED'|'INVALID_SIGNATURE'|'WRONG_INSTALLATION'|'UNSUPPORTED_FORMAT';
export interface LicensePayload {
 license_id:string;installation_id:string;edition:Edition;features:string[];
 unlimited_sites:boolean;unlimited_accounts:boolean;white_label:boolean;resale_enabled:boolean;
 max_installations:number;issued_at:string;expires_at:string|null;updates_entitlement:'ALL_STANDARD_FOREVER';
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
export interface APIError {code:string;message:string;details:unknown[];requestId:string}
