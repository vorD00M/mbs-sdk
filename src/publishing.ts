import type { DraftPreviewV1, ReleaseManifest, SiteLocalizationConfig } from './index.js';

// Companion, not a mutation of Release v1. All keys are private storage keys.
export interface SitePublicConfigV1 {
    format: 'mbs-site-public-config-v1';
    installationId: string;
    siteId: string;
    releaseId: string;
    siteName: string;
    origin: string;
    host: string;
    localization: SiteLocalizationConfig;
    renderer: 'mbs-public-adapter-v1';
    rendererDigest: string;
    assets: { id: string; objectKey: string; sha256: string; mimeType: string; sizeBytes: number; width: number; height: number }[];
    pages: { pageId: string; revision: number; locale: string; path: string; translationGroupId: string; title: string; description: string }[];
}
export interface PublicRenderRequestV1 {
    format: 'mbs-public-render-v1';
    config: SitePublicConfigV1;
    inputs: DraftPreviewV1[];
}
export interface PublicRenderResultV1 {
    format: 'mbs-public-render-result-v1';
    rendererDigest: string;
    pages: { pageId: string; html: string }[];
}
export interface DeliveryProjectionV1 {
    format: 'mbs-delivery-projection-v1';
    installationId: string; siteId: string; releaseId: string;
    host: string; origin: string; generation: number;
    manifestKey: string; manifestSha256: string;
    configKey: string; configSha256: string;
}
export type PublishState = 'pending' | 'building' | 'verifying' | 'ready' | 'activating' | 'reconciling' | 'completed' | 'failed';
export interface PublishJobV1 {
    id: string; releaseId: string; status: PublishState; attempts: number;
    errorCode: string | null; createdAt: string; completedAt: string | null;
}
export type VerifiedReleaseV1 = { manifest: ReleaseManifest; config: SitePublicConfigV1 };
