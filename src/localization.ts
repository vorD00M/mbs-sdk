export type SiteLocalizationMode='SINGLE'|'MULTI';
export type TranslationState='missing'|'draft'|'review'|'published'|'stale';
export interface SiteLocalizationConfig{schemaVersion:1;mode:SiteLocalizationMode;defaultLocale:string;locales:string[];routing:{strategy:'NONE'|'SUBPATH';defaultLocalePrefix?:boolean};missingTranslationPolicy:'OMIT'}
export interface LocaleDescriptor{locale:string;direction:'ltr'|'rtl';isDefault:boolean;status:'active'|'disabled'}
export interface LocalizedPageRef{siteId:string;pageId:string;translationGroupId:string;locale:string;path:string;state:TranslationState}
export interface LocaleRouteMapping{locale:string;prefix:string}
export function canonicalLocale(raw:string):string{if(!raw||raw.length>63||/[ _/\\]/.test(raw))throw new Error('INVALID_LOCALE');const locale=Intl.getCanonicalLocales(raw)[0];if(!locale||locale==='und'||locale.startsWith('und-'))throw new Error('INVALID_LOCALE');return locale}
export function normalizeLocalizationConfig(input:SiteLocalizationConfig):SiteLocalizationConfig{
 if(input.schemaVersion!==1||!Array.isArray(input.locales)||input.locales.length<1||input.locales.length>32)throw new Error('INVALID_LOCALIZATION_CONFIG');
 const config={...input,defaultLocale:canonicalLocale(input.defaultLocale),locales:input.locales.map(canonicalLocale),routing:{...input.routing}};
 if(new Set(config.locales).size!==config.locales.length)throw new Error('DUPLICATE_LOCALE');if(!config.locales.includes(config.defaultLocale))throw new Error('DEFAULT_LOCALE_REQUIRED');if(config.missingTranslationPolicy!=='OMIT')throw new Error('UNSUPPORTED_TRANSLATION_POLICY');
 if(config.mode==='SINGLE'){if(config.locales.length!==1||config.routing.strategy!=='NONE'||config.routing.defaultLocalePrefix)throw new Error('INVALID_SINGLE_LOCALIZATION')}
 else if(config.mode==='MULTI'){if(config.locales.length<2||config.routing.strategy!=='SUBPATH')throw new Error('INVALID_MULTI_LOCALIZATION')}
 else throw new Error('INVALID_LOCALIZATION_MODE');return config;
}
export function localeRoutes(input:SiteLocalizationConfig):LocaleRouteMapping[]{const c=normalizeLocalizationConfig(input),counts=new Map<string,number>();for(const l of c.locales){const b=l.split('-')[0];counts.set(b,(counts.get(b)??0)+1)}return c.locales.map(locale=>{let prefix='';if(c.mode==='MULTI'&&(locale!==c.defaultLocale||c.routing.defaultLocalePrefix)){const b=locale.split('-')[0];prefix='/'+((counts.get(b)??0)>1?locale.toLowerCase():b)}return{locale,prefix}})}
