import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS} from '../data.js';
import {checkAnswer,geometry,hit,shuffle} from '../core.js';
const ib=ITEMS.filter(i=>i.scope==='iberia'),world=ITEMS.filter(i=>i.scope==='world');
const named=(name,pool=ib)=>pool.find(i=>i.name===name);
test('complete syllabus with unique IDs and no duplicated Nao',()=>{assert.equal(world.length,52);assert.equal(ib.length,22);assert.equal(new Set(ITEMS.map(i=>i.id)).size,74);assert.equal(ib.filter(i=>i.name==='Cabo de la Nao').length,1);});
test('canonical names, accents, case and meaningful abbreviations',()=>{const i=named('Cordillera Bética');assert.deepEqual(checkAnswer('CORDILLERA BETICA',i,ib),{ok:true,kind:'exact'});assert.deepEqual(checkAnswer('bética',i,ib),{ok:true,kind:'short'});assert.equal(checkAnswer('beticas',i,ib).ok,true);assert.equal(checkAnswer('cordillera',i,ib).ok,false);assert.equal(checkAnswer('cantabrica',i,ib).ok,false);});
test('small typo accepted but wrong nearby names not accepted',()=>{assert.equal(checkAnswer('Guadarrma',named('Sierra de Guadarrama'),ib).kind,'typo');assert.equal(checkAnswer('Gredos',named('Sierra de Guadarrama'),ib).ok,false);assert.equal(checkAnswer('',ib[0],ib).ok,false);});
test('ambiguous abbreviations and distinct places are rejected',()=>{assert.equal(checkAnswer('victoria',named('Gran Desierto Victoria',world),world).kind,'ambiguous');assert.equal(checkAnswer('siberia',named('Gran Meseta de Siberia Central',world),world).ok,false);assert.equal(checkAnswer('alpes',named('Alpes del Sur',world),world).ok,false);});
test('every official name is accepted, every map centre hits and remote points miss',()=>{for(const i of ITEMS){assert.equal(checkAnswer(i.name,i,i.scope==='world'?world:ib).ok,true,i.name);for(const base of ['natural','original','terrain']){const g=geometry(i,base);assert.ok(g.center.every(Number.isFinite));assert.equal(hit(i,base,g.center),true,`${i.name} ${base}`);assert.equal(hit(i,base,[-1000,-1000]),false);}}});
test('mountain zones accept points along the range',()=>{const i=named('Cordillera de los Andes',world);for(const b of ['natural','original','terrain']){const g=geometry(i,b);for(const poly of g.polygons)for(const p of poly)assert.equal(hit(i,b,p),true);}});
test('shuffle preserves source and membership',()=>{const a=[1,2,3,4];assert.deepEqual(shuffle(a).sort(),a);assert.deepEqual(a,[1,2,3,4]);});
test('generic landform words never identify a specific feature',()=>{for(const word of ['meseta','cordillera','sistema','sierra','cabo','golfo','mar','gran meseta','montes','llanura','cuenca','desierto','peninsula','macizo','pico'])for(const item of ITEMS)assert.equal(checkAnswer(word,item,item.scope==='world'?world:ib).ok,false,`${word}: ${item.name}`);assert.equal(checkAnswer('central',named('Meseta Central'),ib).kind,'ambiguous');});
test('Meseta Central covers both submesetas but not the Ebro, Guadalquivir or Mediterranean coast',async()=>{const {project}=await import('../core.js');const meseta=named('Meseta Central');for(const p of [[-4.72,41.65],[-5.66,40.97],[-1.86,38.99],[-3.7,40.4],[-3.92,38.99]])assert.equal(hit(meseta,'natural',project(...p,'iberia','natural')),true,JSON.stringify(p));for(const p of [[-.88,41.65],[-5.99,37.39],[-.38,39.47],[-8.72,42.24]])assert.equal(hit(meseta,'natural',project(...p,'iberia','natural')),false,JSON.stringify(p));for(const p of [[410,220],[600,450],[330,400]])assert.equal(hit(meseta,'original',[p[0]/1057*1000,p[1]/753*712.4]),true);for(const p of [[700,230],[360,580],[750,400]])assert.equal(hit(meseta,'original',[p[0]/1057*1000,p[1]/753*712.4]),false);});
test('anchors are separated, hit their own targets and retain geographic origins',async()=>{const {layoutAnchors,closestAnchor,WORLD_H}=await import('../core.js');for(const p of [world,ib])for(const base of ['natural','original','terrain'])for(const scale of [.5,1,3]){const dims=p===world?(base!=='original'?[1200,WORLD_H]:[1200,855]):(base!=='original'?[1000,885]:[1000,712.4]);const anchors=layoutAnchors(p,base,dims,scale);assert.equal(anchors.length,p.length);for(let n=0;n<anchors.length;n++){const a=anchors[n];assert.deepEqual(a.center,geometry(a.item,base).center);assert.equal(closestAnchor(anchors,a.pos,scale).item.id,a.item.id);for(const b of anchors.slice(n+1))assert.ok(Math.hypot(a.pos[0]-b.pos[0],a.pos[1]-b.pos[1])*scale>=23.99);}assert.equal(closestAnchor(anchors,[-100,-100],scale),undefined);}});
test('Alicante and La Nao stay on their geographic centres when both circles fit',async()=>{const {layoutAnchors}=await import('../core.js');const pair=[named('Golfo de Alicante'),named('Cabo de la Nao')];for(const items of [pair,[...pair].reverse()]){for(const a of layoutAnchors(items,'original',[1000,712.4],.9587))assert.deepEqual(a.pos,a.center);}});

test('questions distinguish peaks, ranges and their component sierras',async()=>{const {featureType}=await import('../core.js');for(const [name,type] of [['Everest','pico'],['Cordillera del Himalaya','cordillera'],['Sierra de Gredos','sierra'],['Sistema Central','sistema'],['Rift Valley','valle'],['Tierra de Fuego','archipiélago'],['Picos de Europa','macizo']])assert.equal(featureType(named(name,ITEMS)),type);});
test('nearby anchor choice is independent of the answer and respects zoom',async()=>{const {anchorChoices}=await import('../core.js');const a=[{index:1,pos:[50,50]},{index:2,pos:[74,50]},{index:3,pos:[120,50]}];assert.deepEqual(anchorChoices(a,[50,50]).map(x=>x.index),[1,2]);assert.deepEqual(anchorChoices(a,[50,50],2).map(x=>x.index),[1]);assert.deepEqual(anchorChoices(a,[0,0]),[]);});

test('Finisterre sits on its own headland of the original map, not on Monte Louro',async()=>{const {mapPosition,originalIberia}=await import('../core.js');const cape=named('Cabo de Finisterre');const [x,y]=mapPosition(cape,'original');assert.ok(Math.abs(x-156/1057*1000)<.5&&Math.abs(y-96/753*712.4)<.5);assert.ok(Math.abs(cape.lon+9.2722)<.001&&Math.abs(cape.lat-42.8825)<.001);for(const item of ITEMS)assert.deepEqual(mapPosition(item,'terrain'),mapPosition(item,'natural'));
 // Capes are pinned to the drawn coast; they must agree with the coastline registration.
 for(const c of ib.filter(i=>i.category==='Cabos')){const [x,y]=mapPosition(c,'original'),[u,v]=originalIberia(c.lon,c.lat);assert.ok(Math.hypot(x-u,y-v)<5,c.name);}
});

test('screen-space tolerance prevents tiny targets without growing with zoom',()=>{
 const peak=named('Everest',world),center=geometry(peak,'terrain').center;
 for(const scale of [.4,1,3]){
  const p=[center[0]+16/scale,center[1]];
  assert.equal(hit(peak,'terrain',p,18/scale),true);
  assert.equal(hit(peak,'terrain',[center[0]+24/scale,center[1]],18/scale),false);
 }
 const meseta=named('Meseta Central'),g=geometry(meseta,'terrain');
 const poly=g.polygons[0],west=Math.min(...poly.map(p=>p[0]));const vertex=poly.find(p=>p[0]===west);
 assert.equal(hit(meseta,'terrain',[vertex[0]-10,vertex[1]],18),true);
 assert.equal(hit(meseta,'terrain',[vertex[0]-25,vertex[1]],18),false);
});

test('Localiza accepts any part of a feature and rejects its neighbours on every base',async()=>{const {project,originalIberia}=await import('../core.js');
 const at=(lon,lat,base)=>base==='original'?originalIberia(lon,lat):project(lon,lat,'iberia',base);
 const cases=[['Picos de Europa',[[-5.05,43.2],[-4.6,43.22]],[[-3.8,43.1]]],['Sierra de Gredos',[[-5.7,40.3],[-4.6,40.35]],[[-3.96,40.85]]],['Sierra de Guadarrama',[[-3.96,40.85],[-4.3,40.6]],[[-5.29,40.25]]],['Sierra Nevada',[[-3.31,37.05],[-2.7,37.12]],[[-4.42,36.9],[-2.2,36.8]]],['Sistema Ibérico',[[-1.84,41.79],[-1.0,40.1],[-3.0,42.2]],[[-3.7,40.4]]],['Cordillera Bética',[[-5.4,36.76],[-0.3,38.65]],[[-4.8,38.2]]],['Golfo de Valencia',[[0.4,40.0],[0.1,39.1]],[[-0.6,39.5]]],['Golfo de Cádiz',[[-7.5,36.7],[-6.4,36.6]],[[-6.0,37.4]]]];
 for(const [name,yes,no] of cases){const i=named(name);for(const base of ['natural','original','terrain']){for(const p of yes)assert.equal(hit(i,base,at(...p,base)),true,`${name} ${base} ${p}`);for(const p of no)assert.equal(hit(i,base,at(...p,base)),false,`${name} ${base} rejects ${p}`);}}
 const w=(n,lon,lat,ok)=>{const i=named(n,world);for(const b of ['natural','original'])assert.equal(hit(i,b,project(lon,lat,'world',b)),ok,`${n} ${b} ${lon},${lat}`);};
 w('Montañas Rocosas',-116.5,51.5,true);w('Montañas Rocosas',-106,37,true);w('Cordillera del Himalaya',77,33,true);w('Cordillera del Himalaya',92,28,true);w('Mar Caspio',50,45.5,true);w('Mar Caspio',53,39,true);w('Alpes',7,45.8,true);w('Alpes',2,46,false);w('Pirineos',-1,43,true);w('Pirineos',-1,40.5,false);
});

test('every module and stylesheet reference carries the same cache version',async()=>{const {readFileSync}=await import('node:fs');const v=new Set();for(const f of ['index.html','app.js','data.js']){const refs=[...readFileSync(new URL('../'+f,import.meta.url),'utf8').matchAll(/(?:href|src|from) ?=? ?["']\.?\/?([\w-]+\.(?:js|css))(\?v=[\w]+)?["']/g)];for(const m of refs){assert.ok(m[2],`${f}: ${m[1]} sin versión`);v.add(m[2]);}}assert.equal(v.size,1);});

test('miss distance is measured to the nearest accepted point, consistently on every base',async()=>{const {missKm,project,originalIberia,toLonLat}=await import('../core.js');
 const gredos=named('Sierra de Gredos');const d=['natural','terrain','original'].map(b=>missKm(gredos,b,b==='original'?originalIberia(-3.96,40.85):project(-3.96,40.85,'iberia',b)));
 for(const x of d)assert.ok(x>40&&x<90,String(x));assert.ok(Math.abs(d[0]-d[2])<5);
 const andes=named('Cordillera de los Andes',world);{const x=missKm(andes,'natural',project(-58.4,-34.6,'world','natural'));assert.ok(x>700&&x<1100,String(x));}
 for(const b of ['natural','original']){const [lon,lat]=toLonLat(project(-70,-33,'world',b),'world',b);assert.ok(Math.abs(lon+70)<1e-4&&Math.abs(lat+33)<1e-4);}
});

test('one criterion: every zone is a polygon whose reference point sits well inside it',async()=>{const {insidePolygon,segmentDistance}=await import('../core.js');
 for(const i of ITEMS){if(['Picos','Cabos'].includes(i.category)){assert.ok(!i.polygons,i.name);continue;}
  assert.ok(i.polygons?.length,`${i.name} sin zona`);
  for(const base of ['natural','original']){const g=geometry(i,base);const ring=g.polygons.find(r=>insidePolygon(g.center,r));assert.ok(ring,`${i.name} ${base}: punto fuera de su zona`);
   const edge=Math.min(...ring.map((a,k)=>segmentDistance(g.center,a,ring[(k+1)%ring.length])));const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),size=Math.min(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));assert.ok(edge>Math.min(1,size*.15),`${i.name} ${base}: punto pegado al borde (${edge.toFixed(2)})`);}}
});
test('land zones stay out of the sea and the Labrador peninsula is complete',async()=>{const {project}=await import('../core.js');
 const w=(n,lon,lat,ok)=>{const i=named(n,world);assert.equal(hit(i,'natural',project(lon,lat,'world','natural')),ok,`${n} ${lon},${lat}`);};
 w('Península del Labrador',-71,53.5,true);w('Península del Labrador',-75,57,true);w('Península del Labrador',-62,54,true);
 w('Meseta de Irán',54,32,true);w('Meseta de Irán',51,42,false);w('Meseta de Irán',51.5,27,false);
 w('Escudo Canadiense',-86,60,false);w('Montes Escandinavos',12,63.5,true);
});

test('hints keep the landform words and mask only what identifies the place',async()=>{const {hintPattern}=await import('../core.js');
 assert.equal(hintPattern('Macizo de las Guayanas'),'Macizo de las G·······');assert.equal(hintPattern('Cordillera Bética'),'Cordillera B·····');assert.equal(hintPattern('Everest'),'E······');
 for(const i of ITEMS)assert.notEqual(hintPattern(i.name),i.name,i.name);
});

test('places.js is generated from the names in sources/lugares.json with stable ids',async()=>{const {readFileSync}=await import('node:fs');
 const read=f=>JSON.parse(readFileSync(new URL('../sources/'+f,import.meta.url),'utf8'));const lugares=read('lugares.json'),ids=read('ids.json');
 const expected=[];for(const [sk,scope] of [['mundo','world'],['peninsula','iberia']])for(const [group,names] of Object.entries(lugares[sk]))for(const name of names)expected.push({id:ids[`${sk}:${name}`],scope,group,name});
 assert.deepEqual(ITEMS.map(({id,scope,group,name})=>({id,scope,group,name})),expected);
});
