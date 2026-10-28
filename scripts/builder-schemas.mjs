import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../schemas/',import.meta.url),base='https://mbsplatform.online/schemas/';
const object=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const text=(max=200,min=0)=>({type:'string',minLength:min,maxLength:max});
const integer=(min,max)=>({type:'integer',minimum:min,maximum:max});
const number=(min,max)=>({type:'number',minimum:min,maximum:max});
const list=(items,max=500,min=0)=>({type:'array',minItems:min,maxItems:max,items});
const en=(...values)=>({enum:values});
const ref=name=>({$ref:base+'builder-common.v1.schema.json#/$defs/'+name});
const external=name=>({$ref:base+name+(name==='site-localization.v1'?'.json':'.schema.json')});
const schema=(name,value)=>({$schema:'https://json-schema.org/draft/2020-12/schema',$id:base+name+'.schema.json',...value});
const uuid={type:'string',format:'uuid'},version={type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'},id={type:'string',minLength:1,maxLength:100,pattern:'^[^\\x00-\\x1F\\x7F]+$'};
const packageId={type:'string',pattern:'^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*$',maxLength:150};
const themeRef={type:'string',pattern:'^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*@[0-9]+\\.[0-9]+\\.[0-9]+$',maxLength:200};
const locale={type:'string',pattern:'^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$',maxLength:35};
const colorNames=['primary','secondary','accent','background','surface','text','muted','border','success','warning','error','contrast'];
const font=en('system-sans','system-serif','humanist','mono'),shadow=en('none','subtle','medium','deep'),motion=en('none','fade','slide','reveal');
const slots=['topper','header','navigation','hero','breadcrumb','left-sidebar','main','right-sidebar','footer','floating'];
const categories=['topper','header','navigation','hero','breadcrumb','layout','left-sidebar','right-sidebar','footer','cards','carousel','tabs','accordion','stepper','pagination','filter','media','content','cta','social'];
const revision=object({id:uuid,revision:integer(1,Number.MAX_SAFE_INTEGER),inherit:{type:'boolean'}});
const labels=object(Object.fromEntries(['ru-RU','en-US'].map(l=>[l,object({title:text(160,1),description:text(1000)})])));
const provenance=object({creator:text(200,1),license:text(100,1),createdAt:{type:'string',format:'date-time'},sourceCategory:en('original','licensed','system'),source:{type:'string',pattern:'^https://',maxLength:1000}},['creator','license','createdAt','sourceCategory']);
const style=object({background:en(...colorNames),color:en(...colorNames),borderColor:en(...colorNames),padding:integer(0,96),gap:integer(0,96),radius:integer(0,48),borderWidth:integer(0,4),maxWidth:integer(240,1920),width:en('fluid','boxed','full-bleed'),font,fontSize:en('xs','sm','md','lg','xl','2xl','3xl','display'),weight:en(400,500,600,700,800),align:en('start','center','end'),justify:en('start','center','end','between'),direction:en('row','column'),shadow,sticky:en('none','top'),offset:integer(0,128),position:en('flow','top-start','top-end','bottom-start','bottom-end','center'),opacity:number(0,1),rotate:number(-15,15),scale:number(.5,1.5),zIndex:integer(0,4),motion},[]);
const responsive=object({columns:integer(1,12),layout:en('1','2-equal','3-equal','4-equal','1/3+2/3','2/3+1/3','1/4+1/2+1/4','sidebar-main','main-sidebar'),colSpan:integer(1,12),order:integer(0,64),visible:{type:'boolean'},gap:integer(0,96)},[]);
const nodeBase={id,semanticRole:en('div','section','main','header','nav','aside','footer'),style:ref('style'),responsive:object({mobile:ref('responsive'),tablet:ref('responsive'),desktop:ref('responsive')},[]),visibility:object({mobile:{type:'boolean'},tablet:{type:'boolean'},desktop:{type:'boolean'}})};
const node=(properties,required)=>object({...nodeBase,...properties},['id','kind',...required]);
const layoutNode={oneOf:[
 node({kind:en('grid','flex','stack','region','layer'),slot:en(...slots),children:list({$ref:'#/$defs/layoutNode'})},['children']),
 node({kind:{const:'module'},module:packageId,version,props:{type:'object',propertyNames:{not:en('__proto__','prototype','constructor')}},presetRef:object({id:{type:'string',pattern:'^mbs/[a-z-]+/[0-9]{3}$'},version})},['module','version','props']),
 node({kind:{const:'slot'},slot:{const:'main'}},['slot']),
 node({kind:{const:'divider'}},[]),
 node({kind:{const:'region-ref'},regionRef:ref('revision')},['regionRef']),
]};
const inline=object({text:text(10000),marks:{...list(en('bold','italic','code'),3),uniqueItems:true},link:{oneOf:[object({pageId:uuid}),object({href:{type:'string',pattern:'^https?://[^\\s]+$',maxLength:2048}})]}},['text']);
const richBlock={oneOf:[object({type:en('paragraph','h2','h3','quote'),children:list(ref('inline'),200)}),object({type:{const:'list'},ordered:{type:'boolean'},items:list(object({children:list(ref('inline'),200)}),100)})]};
const dataItem=object({id,title:text(200),description:text(4000),category:text(100),imageAssetId:uuid,targetPageId:uuid,tags:list(text(100),20),price:number(0,1000000000),date:{type:'string',format:'date'},label:text(100)},['id','title']);
const source=object({kind:en('static','manualSelection'),items:list(ref('dataItem'),1000),selection:{...list(id,1000),uniqueItems:true}},['kind','items']);
const tokens=object({colors:object(Object.fromEntries(colorNames.map(c=>[c,{type:'string',pattern:'^#[0-9a-fA-F]{6}$'}]))),typography:object({body:font,heading:font,bodySize:integer(14,24),headingSize:integer(24,96),lineHeight:number(1.2,2),headingWeight:en(400,500,600,700,800)}),spacing:object({unit:integer(2,12),section:integer(16,128),gutter:integer(12,64),maxWidth:integer(720,1920)}),effects:object({radius:integer(0,40),shadow,motion})});
const common=schema('builder-common.v1',{$defs:{id,uuid,version,packageId,locale,themeRef,revision,labels,provenance,style,responsive,layoutNode,inline,richText:object({version:{const:1},blocks:list(richBlock,200)}),dataItem,source,tokens}});
const page=schema('page.v2',object({schemaVersion:{const:2},pageId:uuid,locale,seo:object({title:text(200),description:text(500)}),themeRef,siteThemeRef:{anyOf:[ref('revision'),{type:'null'}]},siteShellRef:{anyOf:[ref('revision'),{type:'null'}]},layout:ref('layoutNode'),bindings:{type:'object',maxProperties:20,propertyNames:{pattern:'^[a-z][a-z0-9_-]{0,63}$',not:en('__proto__','prototype','constructor')},additionalProperties:ref('source')}},['schemaVersion','pageId','locale','seo','themeRef','siteThemeRef','siteShellRef','layout']));
const shell=schema('site-shell.v1',object({format:{const:'mbs-site-shell-v1'},siteId:uuid,locale,name:text(120,1),layout:ref('layoutNode')}));
const region=schema('region.v1',object({format:{const:'mbs-region-v1'},siteId:uuid,locale,name:text(120,1),layout:ref('layoutNode')}));
const theme=schema('theme-pack.v1',object({format:{const:'mbs-theme-pack-v1'},id:packageId,version,labels:ref('labels'),tokens:ref('tokens'),provenance:ref('provenance')}));
const siteTheme=schema('site-theme.v1',object({format:{const:'mbs-site-theme-v1'},siteId:uuid,baseThemeRef:themeRef,tokens:ref('tokens')}));
const relativePath={type:'string',pattern:'^[a-zA-Z0-9][a-zA-Z0-9_./-]*$',maxLength:500};
const hash={type:'string',pattern:'^[0-9a-f]{64}$'};
const preset=schema('design-preset.v1',object({format:{const:'mbs-design-preset-v1'},id:{type:'string',pattern:'^mbs/[a-z-]+/[0-9]{3}$'},version,category:en(...categories),allowedSlots:{...list(en(...slots),10,1),uniqueItems:true},moduleRefs:list(object({id:packageId,version}),100,1),labels:ref('labels'),layout:ref('layoutNode'),themeTokens:ref('style'),thumbnail:object({path:relativePath,sha256:hash,width:integer(1,4096),height:integer(1,4096)}),provenance:ref('provenance')},['format','id','version','category','allowedSlots','moduleRefs','labels','layout','thumbnail','provenance']));
const template=schema('site-template.v1',object({format:{const:'mbs-site-template-v1'},id:packageId,version,engineApi:{const:'builder/v1'},labels:ref('labels'),localization:external('site-localization.v1'),themeRef,shells:list(object({id:uuid,revision:integer(1,Number.MAX_SAFE_INTEGER),locale,document:external('site-shell.v1')}),32),pages:list(object({pageId:uuid,translationGroupId:uuid,locale,path:{type:'string',pattern:'^/',maxLength:2000},title:text(120,1),document:external('page.v2')}),100,1),assets:list(object({id:uuid,path:relativePath,sha256:hash,mimeType:en('image/jpeg','image/png','image/webp'),provenance:ref('provenance')}),300),provenance:ref('provenance')}));
const revDoc=(name)=>object({id:uuid,revision:integer(1,Number.MAX_SAFE_INTEGER),document:external(name)});
const composition=schema('builder-composition.v1',object({format:{const:'mbs-builder-composition-v1'},themePack:external('theme-pack.v1'),siteTheme:{anyOf:[revDoc('site-theme.v1'),{type:'null'}]},siteShell:{anyOf:[revDoc('site-shell.v1'),{type:'null'}]},regions:list(revDoc('region.v1'),100)}));
const publicV1=JSON.parse(await readFile(new URL('site-public-config.v1.schema.json',root),'utf8'));
const publicV2=schema('site-public-config.v2',{...structuredClone(publicV1),$id:base+'site-public-config.v2.schema.json'});
publicV2.properties.format={const:'mbs-site-public-config-v2'};publicV2.properties.renderer={const:'mbs-public-adapter-v2'};
publicV2.properties.pages.items.properties.documentVersion=en(1,2);publicV2.properties.pages.items.required.push('documentVersion');
publicV2.properties.compositions=list(object({pageId:uuid,value:external('builder-composition.v1')}),1000,1);publicV2.required.push('compositions');
// v1's URI is historical and intentionally retained rather than rewritten.
publicV2.properties.localization=external('site-localization.v1');
for(const value of [common,page,shell,region,theme,siteTheme,preset,template,composition,publicV2]){
 const file=new URL(value.$id.slice(base.length),root),encoded=JSON.stringify(value,null,2)+'\n';
 if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==encoded)throw Error('BUILDER_SCHEMA_GENERATION_MISMATCH: '+file.pathname);}else await writeFile(file,encoded);
}
