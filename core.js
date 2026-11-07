export const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
export function distance(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]!==b[j-1]));return d[a.length][b.length];}
export function checkAnswer(value,item,pool){
 const input=normalize(value);if(!input)return {ok:false,kind:'empty'};
 const generic=new Set('gran grande grandes cordillera cordilleras monte montes montana montanas sierra sierras meseta mesetas cuenca cuencas cabo cabos golfo golfos peninsula peninsulas macizo macizos escudo mar mares lago llanura llanuras desierto desiertos valle pico picos sistema sistemas de del la los las el'.split(' '));
 if(input.split(' ').every(t=>generic.has(t)))return {ok:false,kind:'generic'};
 const variants=i=>[i.name,...i.aliases].map(normalize);
 if(input===normalize(item.name))return {ok:true,kind:'exact'};
 const matching=pool.filter(i=>variants(i).includes(input));
 if(matching.length>1)return {ok:false,kind:'ambiguous'};
 if(matching.length===1)return {ok:matching[0].id===item.id,kind:matching[0].id===item.id?'short':'wrong'};
 if(input.length<5)return {ok:false,kind:'wrong'};
 const candidates=pool.map(i=>({id:i.id,d:Math.min(...variants(i).map(v=>distance(input,v)))})).filter(i=>i.d<=(input.length>10?2:1));
 if(candidates.length===1&&candidates[0].id===item.id)return {ok:true,kind:'typo'};
 return {ok:false,kind:'wrong'};
}
export function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// Colour world maps share the Mercator projection of the original planisphere, framed
// 84N..60S (scripts/mercator.py): 1200 x WORLD_H map units, about 1.47:1.
const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360)),MERC_TOP=merc(84);
export const WORLD_H=(MERC_TOP-merc(-60))/(2*Math.PI)*1200;
export function project(lon,lat,scope,base){
 if(scope==='world')return base==='original'?[(676+4*lon)/1435*1200,(618-229*merc(lat))/1022*855]:[(lon+180)/360*1200,(MERC_TOP-merc(lat))/(2*Math.PI)*1200];
 return [(lon+11)/15.5*1000,(45.5-lat)/10.5*885];
}
export function mapPosition(item,base){
 if(item.scope==='iberia'&&base==='original')return item.original?[item.original[0]*1000,item.original[1]*712.4]:originalIberia(item.lon,item.lat);
 return project(item.lon,item.lat,item.scope,base);
}
// Original Iberian map: quadratic [lon,lat] -> image-pixel registration fitted to the
// Natural Earth 10m coastline (median error ~1 px on the 1057 x 753 image).
const IB_X=[1196.350587,69.667337,-26.393858,-0.100313,-0.066351,0.39109];
const IB_Y=[3720.280603,-3.102963,-82.105603,-0.345505,0.032024,-0.047331];
export function originalIberia(lon,lat){const v=[1,lon,lat,lon*lon,lon*lat,lat*lat],dot=c=>c.reduce((s,k,i)=>s+k*v[i],0);return [dot(IB_X)/1057*1000,dot(IB_Y)/753*712.4];}
export function toMap(lon,lat,scope,base){return scope==='iberia'&&base==='original'?originalIberia(lon,lat):project(lon,lat,scope,base);}
// Tolerances are evaluated only by Localiza. Other modes use mapPosition.
export function geometry(item,base){
 const scope=item.scope,center=mapPosition(item,base);
 const proj=([lon,lat])=>scope==='iberia'&&base==='original'?originalIberia(lon,lat):project(lon,lat,scope,base);
 const a=proj([item.lon,item.lat]),b=proj([item.lon,item.lat+item.radius]);
 return {center,polygons:item.polygons?.map(r=>r.map(proj)),points:item.path?.map(proj),radius:Math.max(scope==='world'?5:10,Math.hypot(b[0]-a[0],b[1]-a[1])),min:scope==='world'?5:10};
}
export function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export function insidePolygon(p,vertices){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if(segmentDistance(p,a,b)<.001)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function hit(item,base,p,minRadius=0){
 const g=geometry(item,base);
 if(g.polygons?.some(poly=>insidePolygon(p,poly)||poly.some((a,i)=>segmentDistance(p,a,poly[(i+1)%poly.length])<=minRadius)))return true;
 if(g.points&&Math.min(...g.points.slice(1).map((b,i)=>segmentDistance(p,g.points[i],b)))<=Math.max(g.radius,minRadius))return true;
 const r=g.polygons||g.points?Math.max(g.min,minRadius):Math.max(g.radius,minRadius);
 return Math.hypot(p[0]-g.center[0],p[1]-g.center[1])<=r;
}

// Work in rendered pixels so anchor targets remain usable at any zoom level.
export function layoutAnchors(items,base,dims,scale=1){
 const k=1/scale,placed=[],centers=items.map(item=>({id:item.id,p:mapPosition(item,base)}));
 for(const item of items){
  const center=mapPosition(item,base);let pos=center;
  search:for(let ring=0;ring<20;ring++){
   const steps=ring?24:1;
   for(let n=0;n<steps;n++){
    const angle=n/steps*Math.PI*2-Math.PI/2,r=ring*24*k;
    const p=[center[0]+Math.cos(angle)*r,center[1]+Math.sin(angle)*r];
    if(p[0]<13*k||p[0]>dims[0]-13*k||p[1]<13*k||p[1]>dims[1]-13*k)continue;
    if(placed.every(a=>Math.hypot(a.pos[0]-p[0],a.pos[1]-p[1])>=24*k)&&(!ring||centers.every(c=>c.id===item.id||Math.hypot(c.p[0]-p[0],c.p[1]-p[1])>=24*k))){pos=p;break search;}
   }
  }
  placed.push({item,center,pos,index:placed.length+1});
 }
 return placed;
}
export function closestAnchor(anchors,p,scale=1){return anchors.map(a=>({a,d:Math.hypot(a.pos[0]-p[0],a.pos[1]-p[1])})).filter(o=>o.d<=17/scale).sort((a,b)=>a.d-b.d)[0]?.a;}

export function featureType(item){
 if(item.name==='Rift Valley')return 'valle';
 if(item.name==='Tierra de Fuego')return 'archipiélago';
 if(item.name==='Picos de Europa')return 'macizo';
 for(const type of ['sierra','sistema','macizo'])if(item.name.toLowerCase().startsWith(type+' '))return type;
 const types={'Cordilleras':'cordillera','Picos':'pico','Mesetas':'meseta','Mares':'mar','Cabos':'cabo','Desiertos':'desierto','Golfos':'golfo'};
 if(item.category==='Llanuras y cuencas')return /cuenca/i.test(item.name)?'cuenca':'llanura';
 if(item.category==='Penínsulas e islas')return /pen[ií]nsula/i.test(item.name)?'península':'isla';
 return types[item.category]||'accidente geográfico';
}
export function anchorChoices(anchors,p,scale=1){
 const nearest=closestAnchor(anchors,p,scale);
 return nearest?anchors.filter(a=>Math.hypot(a.pos[0]-nearest.pos[0],a.pos[1]-nearest.pos[1])*scale<=32).sort((a,b)=>a.index-b.index):[];
}

// Inverse of the map projection for any base (Newton with a numeric Jacobian).
export function toLonLat(p,scope,base,guess=[0,scope==='world'?20:40]){
 const f=([lon,lat])=>scope==='iberia'&&base==='original'?originalIberia(lon,lat):project(lon,lat,scope,base);
 let g=[...guess];
 for(let n=0;n<20;n++){
  const a=f(g),h=1e-4,dx=f([g[0]+h,g[1]]),dy=f([g[0],g[1]+h]);
  const j=[[(dx[0]-a[0])/h,(dy[0]-a[0])/h],[(dx[1]-a[1])/h,(dy[1]-a[1])/h]],det=j[0][0]*j[1][1]-j[0][1]*j[1][0];
  const ex=p[0]-a[0],ey=p[1]-a[1];if(Math.hypot(ex,ey)<1e-6||!det)break;
  g=[g[0]+(j[1][1]*ex-j[0][1]*ey)/det,Math.max(-85,Math.min(85,g[1]+(-j[1][0]*ex+j[0][0]*ey)/det))];
 }
 return g;
}
export function km([lon1,lat1],[lon2,lat2]){const r=Math.PI/180,a=Math.sin((lat2-lat1)*r/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin((lon2-lon1)*r/2)**2;return 12742*Math.asin(Math.sqrt(a));}
function closestOnSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return [a[0]+t*dx,a[1]+t*dy];}
// Closest accepted point of a feature's Localiza zone, used to explain a miss.
export function closestZonePoint(item,base,p){
 const g=geometry(item,base),cands=[];
 const toward=(c,r)=>{const d=Math.hypot(p[0]-c[0],p[1]-c[1])||1;return [c[0]+(p[0]-c[0])*Math.min(1,r/d),c[1]+(p[1]-c[1])*Math.min(1,r/d)];};
 for(const poly of g.polygons||[])poly.forEach((a,i)=>cands.push(closestOnSegment(p,a,poly[(i+1)%poly.length])));
 if(g.points)g.points.slice(1).forEach((b,i)=>cands.push(toward(closestOnSegment(p,g.points[i],b),g.radius)));
 cands.push(toward(g.center,g.polygons||g.points?g.min:g.radius));
 return cands.sort((a,b)=>Math.hypot(a[0]-p[0],a[1]-p[1])-Math.hypot(b[0]-p[0],b[1]-p[1]))[0];
}
export function missKm(item,base,p){const q=closestZonePoint(item,base,p),guess=[item.lon,item.lat];return km(toLonLat(p,item.scope,base,guess),toLonLat(q,item.scope,base,guess));}
