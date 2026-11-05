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
export function project(lon,lat,scope,base){
 if(scope==='world')return base==='original'?[(676+4*lon)/1435*1200,(618-229*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360)))/1022*855]:[(lon+180)/360*1200,(90-lat)/150*500];
 return [(lon+11)/15.5*1000,(45.5-lat)/10.5*885];
}
export function geometry(item,base){
 const scope=item.scope;const p=project(item.lon,item.lat,scope,base);
 if(scope==='iberia'&&base==='original'){
  const c=[item.original[0]*1000,item.original[1]*712.4];
  return {center:c,polygon:item.originalPolygon,rings:item.originalRings,points:item.path?.map(([x,y])=>[c[0]+(x-item.lon)*62,c[1]-(y-item.lat)*76]),radius:Math.max(10,item.radius*74)};
 }
 const rp=project(item.lon,item.lat+item.radius,scope,base);
 return {center:p,polygon:item.polygon?.map(([x,y])=>project(x,y,scope,base)),rings:item.rings?.map(r=>r.map(([x,y])=>project(x,y,scope,base))),points:item.path?.map(([x,y])=>project(x,y,scope,base)),radius:Math.max(scope==='world'?5:10,Math.abs(rp[1]-p[1]))};
}
export function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export function insidePolygon(p,vertices){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const a=vertices[i],b=vertices[j];if(segmentDistance(p,a,b)<.001)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function hit(item,base,p){const g=geometry(item,base);if(g.rings)return g.rings.reduce((inside,ring)=>inside!==insidePolygon(p,ring),false);if(g.polygon)return insidePolygon(p,g.polygon);const dist=g.points?Math.min(...g.points.slice(1).map((b,i)=>segmentDistance(p,g.points[i],b))):Math.hypot(p[0]-g.center[0],p[1]-g.center[1]);return dist<=g.radius;}

// Work in rendered pixels so anchor targets remain usable at any zoom level.
export function layoutAnchors(items,base,dims,scale=1){
 const k=1/scale,placed=[];
 for(const item of items){
  const center=geometry(item,base).center;let pos=center;
  search:for(let ring=0;ring<20;ring++){
   const steps=ring?24:1;
   for(let n=0;n<steps;n++){
    const angle=n/steps*Math.PI*2-Math.PI/2,r=ring*24*k;
    const p=[center[0]+Math.cos(angle)*r,center[1]+Math.sin(angle)*r];
    if(p[0]<13*k||p[0]>dims[0]-13*k||p[1]<13*k||p[1]>dims[1]-13*k)continue;
    if(placed.every(a=>Math.hypot(a.pos[0]-p[0],a.pos[1]-p[1])>=28*k)){pos=p;break search;}
   }
  }
  placed.push({item,center,pos,index:placed.length+1});
 }
 return placed;
}
export function closestAnchor(anchors,p,scale=1){return anchors.map(a=>({a,d:Math.hypot(a.pos[0]-p[0],a.pos[1]-p[1])})).filter(o=>o.d<=17/scale).sort((a,b)=>a.d-b.d)[0]?.a;}
