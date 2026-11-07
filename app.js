import {ITEMS} from './data.js?v=20261107m';
import {WORLD_H,checkAnswer,shuffle,mapPosition,hit,layoutAnchors,closestAnchor,featureType,anchorChoices,closestZonePoint,missKm,toLonLat,toMap} from './core.js?v=20261107m';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
// Small line icons shared by panel buttons.
const ICON={zoom:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8M8 10.5h5M10.5 8v5"/></svg>',eye:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',home:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/></svg>',exit:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/></svg>'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved={};try{saved=JSON.parse(localStorage.getItem('relieve-progress-v1')||'{}');if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};}catch{}
let scope='world',mode='write',base='natural',baseChosen=false,session=null,selected=null,view=[0,0,1200,WORLD_H],dims=[1200,WORLD_H],cursor=null,draggingPan=null,anchors=[];
const descriptions={write:['¿Cuántos recuerdas?','Identifica el punto señalado. La pregunta indica qué tipo de relieve buscamos.'],point:['Encuentra su lugar.','Lee el nombre y señala su ubicación. Amplía el mapa cuando necesites precisión.'],drag:['Todo por colocar.','Cada ancla señala un lugar. Arrastra las etiquetas al ancla correspondiente, o selecciona una y haz clic.'],challenge:['Un reto para recordar.','Escribe el nombre de cada punto señalado. Verás la corrección al finalizar. Si una respuesta es genérica o ambigua, te pediremos precisarla.'],review:['Una segunda vuelta.','Repite los lugares que fallaste en el mismo tipo de juego: los que fallaste en el mapa se señalan y los demás se escriben. Desaparecen del repaso cuando los aciertas sin ayuda.'],study:['Mira con calma.','Selecciona un nombre para ver su punto de referencia. Explora el mapa sin tiempo ni puntuación.']};
// Review repeats each place in the kind of game where it was missed: on the map or writing.
function qmode(i=current()){return mode==='review'?(saved[i?.id]?.game==='map'?'point':'write'):mode;}
function pool(){return ITEMS.filter(i=>i.scope===scope);}
function filtered(){return pool().filter(i=>($('#group').value==='all'||i.group===$('#group').value)&&($('#category').value==='all'||i.category===$('#category').value)&&(mode!=='review'||saved[i.id]?.last===false));}
function updateStats(){const n=ITEMS.filter(i=>saved[i.id]?.last===true).length;$('#mastered').innerHTML=`${n} <small>/ 74</small>`;$('#overall-bar').style.width=`${n/74*100}%`;}
function persist(item,ok,game=qmode(item)){const old=saved[item.id]||{};saved[item.id]={attempts:(Number(old.attempts)||0)+1,correct:(Number(old.correct)||0)+(ok?1:0),last:ok,game:game==='drag'||game==='point'?'map':'write'};try{localStorage.setItem('relieve-progress-v1',JSON.stringify(saved));}catch{$('.local-badge').textContent='Progreso solo durante esta visita';}updateStats();}
function updateFilters(){
 $('#group').innerHTML=scope==='world'?'<option value="all">Todo el mundo</option>'+['Asia','América','África','Europa','Oceanía'].map(v=>`<option>${v}</option>`).join(''):'<option value="all">Toda la Península</option>';
 $('#category').innerHTML='<option value="all">Todos los tipos</option>'+[...new Set(pool().map(i=>i.category))].map(v=>`<option>${v}</option>`).join('');
}
function updateSetup(){const n=filtered().length;$('#available').textContent=`${n} ${n===1?'lugar disponible':'lugares disponibles'}${mode==='review'&&n===0?' · No tienes lugares pendientes de repaso en esta selección.':''}`;$('#start').disabled=n===0;$('#count').disabled=['drag','study'].includes(mode);$('#session-title').textContent=descriptions[mode][0];$('#mode-description').textContent=descriptions[mode][1];$('#start').innerHTML=(mode==='study'?'Explorar mapa':'Empezar práctica')+' <span>→</span>';$('#setup-note').textContent=mode==='drag'?'Se incluyen todos los lugares de la selección. Pasa por un ancla para ver su tipo de relieve.':mode==='challenge'?'Cada respuesta se guarda al avanzar. El tiempo es informativo.':mode==='study'?'Consulta los puntos de referencia y aprende antes de practicar.':'Sin prisas. Las tildes y las pequeñas erratas no te frenan.';}
function setMap(){dims=scope==='world'?(base==='original'?[1200,855]:[1200,WORLD_H]):(base==='original'?[1000,712.4]:[1000,885]);$('#map-image').setAttribute('href',`assets/${base}-${scope}.webp`);$('#map-image').setAttribute('width',dims[0]);$('#map-image').setAttribute('height',dims[1]);$('#map-title').textContent=scope==='world'?'Relieve mundial':'Península Ibérica';$('#map-kicker').textContent=scope==='world'?'PLANISFERIO FÍSICO':'RELIEVE PENINSULAR';$('#map-tag').textContent=base==='original'?'MAPA ORIGINAL':base==='terrain'?'RELIEVE DETALLADO':'NATURAL EARTH';$('#map-credit').textContent=base==='original'?'Mapa original de la ficha':base==='terrain'?'NOAA / NCEI · relieve y batimetría':'Natural Earth · NOAA / NCEI al ampliar';$('#map').setAttribute('aria-label',`Mapa físico ${scope==='world'?'del mundo':'de la Península Ibérica'}. ${descriptions[mode][1]}`);resetView();renderMarks();}
let pendingPoint=null,confirmLocation=matchMedia('(any-pointer: coarse)').matches;
function applyView(){ $('#map').setAttribute('viewBox',view.join(' ')); renderMapDetail();renderMarks();renderPendingPoint(); }
// Keep the overview underneath while visible high-resolution tiles load.
function renderMapDetail(){
 const layer=$('#map-detail');let html='';
 // Natural Earth is an overview: past 3x it hands over to the detailed relief tiles.
 if((base==='terrain'&&dims[0]/view[2]>1.5)||(base==='natural'&&dims[0]/view[2]>3)){
  // Tiles overlap by one screen pixel so anti-aliasing never leaves a light seam.
  const cols=scope==='world'?8:4,rows=scope==='world'?6:4,w=dims[0]/cols,h=dims[1]/rows,seam=1/mapScale();
  // The stage can be taller or wider than the viewBox (aspect 'meet'): cull by what is on screen.
  const r=$('#map').getBoundingClientRect(),m=$('#map').getScreenCTM()?.inverse();let vis=view;
  if(m&&r.width){const a=new DOMPoint(r.left,r.top).matrixTransform(m),b=new DOMPoint(r.right,r.bottom).matrixTransform(m);vis=[a.x,a.y,b.x-a.x,b.y-a.y];}
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=col*w,y=row*h;
   if(x+w<vis[0]||x>vis[0]+vis[2]||y+h<vis[1]||y>vis[1]+vis[3])continue;
   html+=`<image href="assets/terrain/${scope}/${col}-${row}.webp" x="${x}" y="${y}" width="${w+seam}" height="${h+seam}" preserveAspectRatio="none"/>`;
  }
 }
 if(layer.innerHTML!==html)layer.innerHTML=html;
}
function resetView(){clearPendingPoint();view=[0,0,...dims];applyView();}
function maxZoom(){return base==='original'?6:scope==='world'?12:8;}
function zoom(factor,center){const cx=center?.[0]??view[0]+view[2]/2,cy=center?.[1]??view[1]+view[3]/2;const w=Math.max(dims[0]/maxZoom(),Math.min(dims[0],view[2]*factor)),h=w*dims[1]/dims[0];view=[cx-(cx-view[0])*w/view[2],cy-(cy-view[1])*h/view[3],w,h];clampView();}
function clampView(){view[0]=Math.max(0,Math.min(dims[0]-view[2],view[0]));view[1]=Math.max(0,Math.min(dims[1]-view[3],view[1]));applyView();}
function current(){return session?.items[session.index];}
function mapScale(){return $('#map').getScreenCTM()?.a||1;}
function pointMark(item,label=false,color='#b45332'){
 const [x,y]=mapPosition(item,base), k=1/mapScale();
 return `<g class="point-mark"><circle class="pulse" cx="${x}" cy="${y}" r="${16*k}" fill="none" stroke="${color}" stroke-width="${2*k}"/><circle cx="${x}" cy="${y}" r="${13*k}" fill="${color}" fill-opacity=".16"/><circle cx="${x}" cy="${y}" r="${6.5*k}" fill="${color}" stroke="#fffdf7" stroke-width="${2*k}"/>${label?`<text x="${x+11*k}" y="${y-10*k}" font-size="${12*k}" style="stroke-width:${3*k}px" stroke-linejoin="round">${esc(item.name)}</text>`:''}</g>`;
}
// After a miss in Localiza: where the click was, and a line to the nearest accepted point.
function missMark(){const m=session.miss;if(!m)return '';const k=1/mapScale(),[x,y]=m.p,[qx,qy]=m.q;
 return `<g class="miss"><line x1="${x}" y1="${y}" x2="${qx}" y2="${qy}" stroke="#fffdf8" stroke-width="${3.5*k}"/><line x1="${x}" y1="${y}" x2="${qx}" y2="${qy}" stroke="#a3402a" stroke-width="${1.5*k}" stroke-dasharray="${5*k} ${4*k}"/><circle cx="${qx}" cy="${qy}" r="${3*k}" fill="#a3402a" stroke="#fffdf8" stroke-width="${k}"/><path d="M${x-6*k} ${y-6*k}l${12*k} ${12*k}M${x+6*k} ${y-6*k}l${-12*k} ${12*k}" stroke="#fffdf8" stroke-width="${4*k}" stroke-linecap="round"/><path d="M${x-6*k} ${y-6*k}l${12*k} ${12*k}M${x+6*k} ${y-6*k}l${-12*k} ${12*k}" stroke="#a3402a" stroke-width="${2*k}" stroke-linecap="round"/></g>`;}
function anchorSvg(a,k,index){
 const done=session.placed.has(a.item.id),hint=session.revealed&&selected?.id===a.item.id;
 const [x,y]=a.pos,[cx,cy]=a.center;
 return `<g data-anchor="${a.item.id}" class="map-anchor ${done?'placed':''} ${hint?'hinted':''}">${Math.hypot(x-cx,y-cy)>k?`<line class="anchor-leader" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#fffdf8" stroke-width="${3.5*k}"/><line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#375344" stroke-width="${1.25*k}"/><circle class="anchor-origin" cx="${cx}" cy="${cy}" r="${3*k}" fill="#375344" stroke="#fffdf8" stroke-width="${k}"/>`:""}${hint?`<circle class="pulse" cx="${x}" cy="${y}" r="${15*k}" fill="none" stroke="#bd603b" stroke-width="${2.5*k}"/>`:""}<circle class="anchor-ring" cx="${x}" cy="${y}" r="${11*k}" stroke-width="${1.5*k}"/><text class="anchor-number" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${10*k}">${index}</text><title>${done?esc(a.item.name):`Ancla ${index} · ${featureType(a.item)}`}</title></g>`;
}
// Magnifier for crowded areas while dragging a label: fixed where it opens, with its own
// anchor layout at 3x so nearby places separate. Dropping inside it uses the lens anchors.
let lens=null,lensTimer=null;const LENS_R=120,LENS_Z=3;
function stagePoint(e){const r=$('#map-stage').getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function crowded(p){const s=mapScale();return anchors.filter(a=>!session.placed.has(a.item.id)&&Math.hypot(a.pos[0]-p[0],a.pos[1]-p[1])*s<=40).length>=3;}
function openLens(p,e){
 const st=$('#map-stage').getBoundingClientRect(),s=mapScale(),[ex,ey]=stagePoint(e);
 const sx=Math.max(LENS_R+6,Math.min(st.width-LENS_R-6,ex)),sy=Math.max(LENS_R+6,Math.min(st.height-LENS_R-6,ey));
 const c=[p[0]+(sx-ex)/s,p[1]+(sy-ey)/s],half=LENS_R/(s*LENS_Z),vb=[c[0]-half,c[1]-half,2*half,2*half];
 const index=new Map(anchors.map(a=>[a.item.id,a.index]));
 const items=session.anchorItems.filter(i=>{if(session.placed.has(i.id))return false;const [x,y]=mapPosition(i,base);return Math.hypot(x-c[0],y-c[1])<half*.92;});
 const la=layoutAnchors(items,base,dims,s*LENS_Z).filter(a=>Math.hypot(a.pos[0]-c[0],a.pos[1]-c[1])<half*.92),k=1/(s*LENS_Z);
 const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('class','lens');el.setAttribute('viewBox',vb.join(' '));el.setAttribute('aria-hidden','true');
 el.style.left=`${sx-LENS_R}px`;el.style.top=`${sy-LENS_R}px`;el.style.width=el.style.height=`${2*LENS_R}px`;
 el.innerHTML=`<image href="${$('#map-image').getAttribute('href')}" width="${dims[0]}" height="${dims[1]}"/>${$('#map-detail').innerHTML}`+la.map(a=>anchorSvg(a,k,index.get(a.item.id))).join('');
 $('#map-stage').append(el);lens={el,sx,sy,vb,anchors:la};
}
function closeLens(){clearTimeout(lensTimer);lens?.el.remove();lens=null;}
function inLens(e,margin=0){if(!lens)return false;const [x,y]=stagePoint(e);return Math.hypot(x-lens.sx,y-lens.sy)<=LENS_R+margin;}
function lensMapPoint(e){const [x,y]=stagePoint(e);return [lens.vb[0]+(x-lens.sx+LENS_R)/(2*LENS_R)*lens.vb[2],lens.vb[1]+(y-lens.sy+LENS_R)/(2*LENS_R)*lens.vb[3]];}
function lensAnchor(e){return closestAnchor(lens.anchors,lensMapPoint(e),mapScale()*LENS_Z);}
// Feedback at the drop point: the wrong anchor shakes and a bubble explains it.
function dropBubble(p,html,soft=false,anchorId=null){
 $$('.drop-bubble').forEach(b=>b.remove());
 const svg=$('#map'),pt=new DOMPoint(p[0],p[1]).matrixTransform(svg.getScreenCTM()),st=$('#map-stage').getBoundingClientRect();
 const b=document.createElement('div');b.className='drop-bubble'+(soft?' soft':'');b.innerHTML=html;b.style.left=`${pt.x-st.left}px`;b.style.top=`${pt.y-st.top}px`;$('#map-stage').append(b);setTimeout(()=>b.remove(),2300);
 if(anchorId){const g=$(`#marks [data-anchor="${anchorId}"]`);if(g){g.classList.add('wrong');setTimeout(()=>g.classList.remove('wrong'),1400);}}
}
function nearestAnchor(p){return closestAnchor(anchors.filter(a=>!session.placed.has(a.item.id)),p,mapScale());}
function highlightAnchor(p){const target=session&&mode==='drag'?nearestAnchor(p):null;const tip=$('#anchor-tip');if(tip){tip.hidden=!target;tip.textContent=target?`Ancla ${target.index} · ${featureType(target.item)}`:'';}$$('#marks [data-anchor]').forEach(g=>g.classList.toggle('hovered',g.dataset.anchor===target?.item.id));}
function renderMarks(){
 $('#anchor-choice')?.remove();$('#anchor-tip')?.remove();let html='';anchors=[];
 if(session){
  if(mode==='drag'){
   anchors=layoutAnchors(session.anchorItems,base,dims,mapScale());const k=1/mapScale();
   html=anchors.map(a=>anchorSvg(a,k,a.index)).join('');
  }else if(mode==='study'&&selected)html=pointMark(selected,true,'#315b46');
  else if(current()&&['write','challenge'].includes(qmode()))html=pointMark(current(),session.answered&&mode!=='challenge');
  else if(qmode()==='point'&&session.answered)html=missMark()+pointMark(current(),true);
 }
 $('#marks').innerHTML=html;if(session&&mode==='drag'){const tip=document.createElement('div');tip.id='anchor-tip';tip.hidden=true;tip.setAttribute('aria-live','polite');$('#map-stage').append(tip);}
}
// Game layout (map takes the screen height) is used while playing and on the results.
function gameLayout(on){document.body.classList.toggle('running',on);const sel=$('.map-selector');if(on)$('.map-heading').append(sel);else $('.scope-row').append(sel);}
function lock(on){$$('[data-scope],[data-mode]').forEach(b=>b.disabled=on);gameLayout(on);}
function start(){let items=filtered();if(!items.length)return;items=mode==='study'?items:shuffle(items);if(!['drag','study'].includes(mode)&&$('#count').value!=='all')items=items.slice(0,Number($('#count').value));session={items,anchorItems:shuffle(items),index:0,answers:[],answered:false,started:Date.now(),placed:new Set(),failed:new Set(),revealed:false};selected=mode==='study'?items[0]:null;$('#setup').hidden=true;$('#results').hidden=true;$('#game').hidden=false;lock(true);resetView();renderGame();renderMarks();}
function progressHtml(){
 const done=mode==='drag'?session.placed.size:session.index;
 const label={write:'Escribe',point:'Localiza',drag:'Mapa mudo',challenge:'Reto',review:'Repasa fallos',study:'Explora'}[mode];
 return `<div class="question-number"><span>${label}</span><span>${mode==='study'?`${session.items.length} lugares`:`<b>${done}</b> / ${session.items.length}`}</span></div>${mode==='study'?'':`<div class="session-progress"><div style="width:${done/session.items.length*100}%"></div></div>`}`;
}
function renderGame(){
 if(!session)return;
 $('#game').classList.toggle('has-chips',['drag','study'].includes(mode));
 const oldScroll=$('.chips')?.scrollTop||0;let html=progressHtml();
 if(['drag','study'].includes(mode)){
  html+=`<div class="task-heading"><h2>${mode==='drag'?'Cada nombre, en su lugar.':'Conoce el terreno.'}</h2><p class="muted">${mode==='drag'?'Arrastra al número o selecciona una etiqueta y pulsa su ancla.':'Elige un lugar para verlo en el mapa.'}</p></div><div class="chips" aria-label="Lista de lugares">${session.items.map(i=>`<button class="chip ${selected?.id===i.id?'selected':''} ${session.placed.has(i.id)?'solved':''}" data-item="${i.id}" draggable="false" ${session.placed.has(i.id)?'disabled':''}><span>${esc(i.name)}</span><span class="chip-mark" aria-hidden="true">${session.placed.has(i.id)?'✓ '+(session.anchorItems.findIndex(a=>a.id===i.id)+1):mode==='drag'?'⠿':''}</span></button>`).join('')}</div>`;
  if(mode==='study')html+=`<div class="study-detail"><strong>${esc(selected?.name||'')}</strong><small>${esc(selected?.group||'')} · ${esc(selected?featureType(selected):'')}</small></div>`;
  html+='<div class="session-controls"><div id="feedback" role="status" aria-live="polite"></div>';
  html+=mode==='study'?`<button class="secondary" id="focus-place">Acercar al lugar ${ICON.zoom}</button>`:`<button class="secondary" id="reveal">Ver ancla de la etiqueta ${ICON.eye}</button>`;
 }else{
  const i=current(),qm=qmode(i);html+=`<div class="question-block"><div class="question-context"><span>${esc(i.group)}</span><span>${esc(featureType(i))}</span></div><h2 class="question-title">${qm==='point'?esc(i.name):`¿Qué ${featureType(i)} es?`}</h2>`;
  if(qm==='point')html+='<div class="map-instruction"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg><div><strong>Señala su ubicación</strong><span>Señala en el mapa. Con el dedo, ajusta el punto y confirma.</span></div></div>';
  else html+='<p class="muted">Pon nombre al punto naranja.</p><form id="answer-form"><label for="answer">Tu respuesta</label><input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe el nombre…" required maxlength="120"><button class="primary" type="submit">'+(mode==='challenge'?'Guardar y continuar':'Comprobar')+' <span>↵</span></button></form>';
  html+='</div><div class="session-controls"><div id="feedback" role="status" aria-live="polite"></div><button class="primary" id="next" hidden>Siguiente lugar <span>→</span></button><div class="action-row">'+(mode!=='challenge'?'<button class="secondary" id="reveal">Ver solución</button>':'')+'<button class="secondary" id="skip">Saltar <span>→</span></button></div>';
  if(qm!=='point')html+=`<button class="secondary focus-button" id="focus-place">Acercar al punto ${ICON.zoom}</button>`;
  else html+=`<label class="confirm-option"><input type="checkbox" id="confirm-location" ${confirmLocation?'checked':''}> Confirmar antes de responder</label>`+'<details class="keyboard-help"><summary>Usar el teclado</summary><p>Enfoca el mapa con <kbd>Tab</kbd>, mueve el cursor con las flechas y confirma con <kbd>Intro</kbd>.</p></details>';
 }
 html+=`<button class="secondary finish-button" id="finish">Terminar sesión ${ICON.exit}</button></div>`;
 $('#game').innerHTML=html;if($('.chips'))$('.chips').scrollTop=oldScroll;
 $('#confirm-location')?.addEventListener('change',e=>{confirmLocation=e.target.checked;clearPendingPoint();});
 $('#answer-form')?.addEventListener('submit',e=>{e.preventDefault();submitText();});$('#next')?.addEventListener('click',next);$('#skip')?.addEventListener('click',()=>answer({ok:false,kind:'skip'},'Sin respuesta'));$('#reveal')?.addEventListener('click',reveal);$('#finish').onclick=finish;$('#focus-place')?.addEventListener('click',focusPlace);
 $$('.chip').forEach(b=>{
  let moved=false;
  b.onclick=()=>{if(!moved)selectItem(b.dataset.item);};
  b.onpointerdown=e=>{
   if(mode!=='drag'||e.button!==0||b.disabled)return;
   moved=false;const start=[e.clientX,e.clientY];
   b.setPointerCapture(e.pointerId);
   b.onpointermove=event=>{
    if(!moved&&Math.hypot(event.clientX-start[0],event.clientY-start[1])<5)return;
    if(!moved){
     moved=true;selected=session.items.find(i=>i.id===b.dataset.item);session.revealed=false;
     dragPreview=compactDragImage(selected.name);dragPreview.className='drag-preview';
     document.body.append(dragPreview);$$('.chip.selected').forEach(c=>c.classList.toggle('selected',c===b));b.classList.add('selected','drag-source');renderMarks();
    }
    dragPreview.style.left=`${event.clientX-7}px`;dragPreview.style.top=`${event.clientY-16}px`;
    if(lens&&!inLens(event,24))closeLens();
    if(lens){const a=lensAnchor(event);lens.el.querySelectorAll('[data-anchor]').forEach(g=>g.classList.toggle('hovered',g.dataset.anchor===a?.item.id));const tip=$('#anchor-tip');if(tip){tip.hidden=!a;tip.textContent=a?`Ancla ${anchors.find(x=>x.item.id===a.item.id)?.index} · ${featureType(a.item)}`:'';}return;}
    // Open only when the pointer rests over a crowded spot, not while crossing the map.
    const m=mapPoint(event);clearTimeout(lensTimer);if(crowded(m)){const ev={clientX:event.clientX,clientY:event.clientY};lensTimer=setTimeout(()=>{if(dragPreview&&!lens)openLens(m,ev);},280);}
    highlightAnchor(m);
   };
   const end=(event,cancel=false)=>{
    b.onpointermove=null;b.onpointerup=null;b.onpointercancel=null;
    if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);
    dragPreview?.remove();dragPreview=null;b.classList.remove('drag-source');
    $$('#marks .hovered').forEach(g=>g.classList.remove('hovered'));
    if(lens&&inLens(event)){const a=lensAnchor(event),p=lensMapPoint(event);closeLens();if(moved&&!cancel){if(a)place(p,a.item.id);else feedback(`Suelta la etiqueta sobre un ancla. Busca <strong>${esc(selected.name)}</strong>.`,'warning');}return;}
    closeLens();
    if(moved&&!cancel&&document.elementFromPoint(event.clientX,event.clientY)?.closest('#map'))place(mapPoint(event));
   };
   b.onpointerup=event=>end(event);b.onpointercancel=event=>end(event,true);
  };
 });
 if(qmode()!=='point'&&!['drag','study'].includes(mode))$('#answer')?.focus({preventScroll:true});
}
// A small name pill follows a precise hotspot instead of the full sidebar button.
let dragPreview=null;
function compactDragImage(name){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 ctx.font='12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
 let text=name;
 while(ctx.measureText(text).width>215)text=text.slice(0,-2)+'…';
 const width=Math.ceil(ctx.measureText(text).width)+22;
 canvas.width=width+22;canvas.height=32;
 ctx.fillStyle='#284f41';ctx.beginPath();ctx.roundRect(19,2,width,28,6);ctx.fill();
 ctx.fillStyle='#fffefa';ctx.font='12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';ctx.textBaseline='middle';ctx.fillText(text,30,16);
 ctx.fillStyle='#bf603d';ctx.beginPath();ctx.arc(7,16,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fffefa';ctx.lineWidth=1.5;ctx.stroke();
 return canvas;
}
function selectItem(id){selected=session.items.find(i=>i.id===id);session.revealed=false;renderGame();renderMarks();}
function focusPlace(){const i=mode==='study'?selected:current();if(!i)return;const center=mapPosition(i,base),w=dims[0]/Math.min(maxZoom(),scope==='world'?4:2.5);view=[center[0]-w/2,center[1]-w*dims[1]/dims[0]/2,w,w*dims[1]/dims[0]];clampView();}
function feedback(html,type=''){const el=$('#feedback');if(el){el.className='feedback '+type;el.innerHTML=html;}}
function submitText(){if(!session||session.answered)return;const value=$('#answer').value.trim();if(!value)return;const result=checkAnswer(value,current(),pool());if(['generic','ambiguous'].includes(result.kind)){feedback(result.kind==='generic'?'Eso indica el tipo de relieve. Añade el nombre que identifica el lugar.':'Ese nombre es ambiguo. Añade una palabra más para identificar el lugar.','warning');return;}answer(result,value);}
function answer(result,value){if(!session||session.answered)return;clearPendingPoint();const item=current();session.answers.push({id:item.id,name:item.name,...result,value});session.answered=true;persist(item,result.ok);if(mode==='challenge'){next();return;}
 let message=result.ok?(['exact','location'].includes(result.kind)?'Correcto.':result.kind==='typo'?'Correcto, con una pequeña errata.':'Correcto. Has usado un nombre abreviado o alternativo.'):(result.kind==='ambiguous'?'Ese nombre puede referirse a más de un lugar.':result.kind==='skip'?'Lo dejamos para repasar.':result.kind==='reveal'?'Solución consultada. Se guardará para repasar.':result.kind==='location'&&session.miss?`Esta vez no: te quedaste ${session.miss.txt}.`:'Esta vez no. Lo guardamos para repasar.');
 feedback(`${message}<br><strong>${esc(item.name)}</strong>`,result.ok?(['exact','location'].includes(result.kind)?'':'warning'):'error');
 $('#answer-form')?.querySelectorAll('input,button').forEach(e=>e.disabled=true);$('#reveal')?.setAttribute('disabled','');$('#skip')?.setAttribute('disabled','');$('#next').hidden=false;$('#next').textContent=session.index===session.items.length-1?'Ver resultados →':'Siguiente lugar →';renderMarks();$('#next').focus({preventScroll:true});}
function reveal(){if(mode==='drag'){if(!selected){feedback('Selecciona primero una etiqueta.','warning');return;}session.failed.add(selected.id);session.revealed=true;feedback(`El ancla resaltada corresponde a <strong>${esc(selected.name)}</strong>. Colócala para continuar; quedará en tu repaso.`,'warning');renderMarks();
  // Bring the hinted anchor into view if the current zoom leaves it out.
  const a=anchors.find(x=>x.item.id===selected.id);if(a){const [x,y]=a.pos,m=view[2]*.08;if(x<view[0]+m||x>view[0]+view[2]-m||y<view[1]+m||y>view[1]+view[3]-m){view=[x-view[2]/2,y-view[3]/2,view[2],view[3]];clampView();}}}else answer({ok:false,kind:'reveal'},'Solución consultada');}
function next(){session.index++;session.answered=false;session.miss=null;cursor=null;$('#cursor').innerHTML='';if(session.index>=session.items.length){finish();return;}resetView();renderGame();renderMarks();}
function place(p,confirmedId=null,touch=false){if(!session||mode==='study')return;
 if(qmode()==='point'&&!session.answered){const item=current(),ok=hit(item,base,p,(touch?18:6)/mapScale());
  let value='Ubicación correcta';session.miss=null;
  if(!ok){const d=missKm(item,base,p),txt=d<10?'a menos de 10 km':`a ${new Intl.NumberFormat('es-ES').format(Math.round(d/(d<100?5:10))*(d<100?5:10))} km`;session.miss={p,q:closestZonePoint(item,base,p),txt};value=`Te quedaste ${txt}`;}
  answer({ok,kind:'location'},value);return;}
 if(mode!=='drag')return;if(!selected){feedback('Selecciona primero una etiqueta.','warning');return;}if(session.placed.has(selected.id))return;
 const choices=anchorChoices(anchors.filter(a=>!session.placed.has(a.item.id)),p,mapScale());
 if(!confirmedId&&choices.length>1){
  $('#anchor-choice')?.remove();const box=document.createElement('div');box.id='anchor-choice';box.setAttribute('role','group');box.setAttribute('aria-label','Precisar ancla');box.onkeydown=e=>{if(e.key==='Escape'){box.remove();$('#map').focus({preventScroll:true});}};
  box.innerHTML='<strong>Hay varias anclas cerca.</strong><p>Elige una. Todavía no cuenta como intento.</p>'+choices.map(a=>`<button data-choice="${a.item.id}">Ancla ${a.index} · ${esc(featureType(a.item))}</button>`).join('')+'<button data-zoom>Ampliar zona</button><button data-cancel>Cancelar</button>';
  $('#map-stage').append(box);box.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{box.remove();place(p,b.dataset.choice);});
  box.querySelector('[data-zoom]').onclick=()=>zoom(.5,choices[0].center);box.querySelector('[data-cancel]').onclick=()=>box.remove();box.querySelector('button').focus({preventScroll:true});return;
 }
 $('#anchor-choice')?.remove();
 const anchor=confirmedId?anchors.find(a=>a.item.id===confirmedId&&!session.placed.has(a.item.id)):nearestAnchor(p);if(anchor?.item.id===selected.id){const ok=!session.failed.has(selected.id);session.placed.add(selected.id);session.answers.push({id:selected.id,name:selected.name,ok,kind:'location',value:ok?'Ubicación correcta':'Colocado tras un error o una pista'});persist(selected,ok,'drag');selected=null;session.revealed=false;renderGame();renderMarks();feedback(ok?'Bien colocado. Continúa con otra etiqueta.':'Colocado. Lo volveremos a practicar.');if(session.placed.size===session.items.length)finish();}
 else{if(anchor)session.failed.add(selected.id);dropBubble(anchor?anchor.pos:p,anchor?`No es esta. Buscas <strong>${esc(selected.name)}</strong>`:'Suelta sobre un ancla',!anchor,anchor?.item.id);feedback(`${anchor?'Esa ancla no corresponde.':'Elige un ancla del mapa.'} Busca <strong>${esc(selected.name)}</strong>.`,'error');}
}
function finish(){if(!session)return;if(mode==='study'){back();return;}
 // Preserve mistakes from unfinished drag attempts, without counting untouched labels.
 if(mode==='drag')for(const id of session.failed)if(!session.placed.has(id)){const i=session.items.find(x=>x.id===id);session.answers.push({id,name:i.name,ok:false,kind:'location',value:'Sin completar tras un error o una pista'});persist(i,false,'drag');}
 const answers=session.answers;const n=answers.filter(a=>a.ok).length;const secs=Math.round((Date.now()-session.started)/1000);$('#game').hidden=true;$('#results').hidden=false;
 $('#results').innerHTML=`<p class="eyebrow">SESIÓN TERMINADA</p><h2>${n===answers.length&&n>0?'Bien aprendido.':'Cada vuelta cuenta.'}</h2><div class="result-score">${n}<small> / ${answers.length}</small></div><p class="muted">Aciertos · ${Math.floor(secs/60)} min ${secs%60} s<br>${session.items.length-answers.length?`${session.items.length-answers.length} lugares sin intentar.`:'Has completado toda la sesión.'}</p><ul class="result-list">${answers.map(a=>`<li class="${a.ok?'':'wrong'}">${a.ok?'✓':'↺'} ${esc(a.name)}<small>${esc(a.value)}${a.ok&&['short','typo'].includes(a.kind)?(a.kind==='short'?' · Nombre abreviado o alternativo':' · Pequeña errata aceptada'):''}</small></li>`).join('')}</ul><button class="primary" id="again">Otra ronda <span>→</span></button>${answers.some(a=>!a.ok)?'<button class="secondary" id="review-now">Repasar mis fallos</button>':''}<button class="secondary home-button" id="configure">Volver al inicio ${ICON.home}</button>`;
 $('#again').onclick=()=>{back();start();};$('#configure').onclick=back;if($('#review-now'))$('#review-now').onclick=()=>{back();setMode('review');};lock(false);gameLayout(true);session=null;selected=null;$('#marks').innerHTML='';$('#cursor').innerHTML='';resetView();}
function back(){session=null;selected=null;$('#setup').hidden=false;$('#game').hidden=true;$('#results').hidden=true;lock(false);updateSetup();renderMarks();$('#cursor').innerHTML='';resetView();}
function setMode(m){mode=m;$$('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===m);b.setAttribute('aria-pressed',b.dataset.mode===m);});back();setMap();}
function mapPoint(e){const p=$('#map').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform($('#map').getScreenCTM().inverse());return [q.x,q.y];}
$$('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;if(!baseChosen){base=scope==='world'?'natural':'terrain';$('#base').value=base;}$$('[data-scope]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});updateFilters();back();setMap();});$$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));// Switching base keeps the place and zoom being looked at, not just the whole map.
$('#base').onchange=()=>{const z=dims[0]/view[2],c=toLonLat([view[0]+view[2]/2,view[1]+view[3]/2],scope,base);base=$('#base').value;baseChosen=true;setMap();
 if(z>1.05){const p=toMap(c[0],c[1],scope,base),w=dims[0]/Math.min(z,maxZoom()),h=w*dims[1]/dims[0];view=[p[0]-w/2,p[1]-h/2,w,h];clampView();}};$('#group').onchange=updateSetup;$('#category').onchange=updateSetup;$('#start').onclick=start;
$('#zoom-in').onclick=()=>zoom(.7);$('#zoom-out').onclick=()=>zoom(1/.7);$('#zoom-reset').onclick=resetView;
const svg=$('#map');svg.addEventListener('pointerleave',()=>{if($('#anchor-tip'))$('#anchor-tip').hidden=true;});svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:1/1.15,mapPoint(e));},{passive:false});
let suppressClick=false,tap=null;
svg.addEventListener('pointerdown',e=>{
 tap={x:e.clientX,y:e.clientY,touch:e.pointerType==='touch',moved:false};
 if(e.shiftKey||e.button===1){e.preventDefault();draggingPan={x:e.clientX,y:e.clientY,view:[...view]};suppressClick=true;svg.setPointerCapture(e.pointerId);}
});
svg.addEventListener('pointermove',e=>{
 if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>10)tap.moved=true;
 if(!draggingPan){highlightAnchor(mapPoint(e));return;}
 const s=svg.getScreenCTM();view=[draggingPan.view[0]-(e.clientX-draggingPan.x)/s.a,draggingPan.view[1]-(e.clientY-draggingPan.y)/s.d,view[2],view[3]];clampView();
});
svg.addEventListener('pointerup',()=>{draggingPan=null;setTimeout(()=>suppressClick=false,0);});
svg.addEventListener('pointercancel',()=>{tap=null;draggingPan=null;});
svg.addEventListener('click',e=>{
 if(suppressClick||e.shiftKey||tap?.moved)return;
 const touch=e.pointerType==='touch'||tap?.touch,p=mapPoint(e);tap=null;
 if(session&&qmode()==='point'&&!session.answered&&(touch||confirmLocation)){
  pendingPoint=p;renderPendingPoint();return;
 }
 place(p,null,touch);
});
function clearPendingPoint(){pendingPoint=null;$('#location-confirm')?.remove();$('#cursor').innerHTML='';}
function renderPendingPoint(){
 if(!pendingPoint)return;
 const [x,y]=pendingPoint,k=1/mapScale();
 $('#cursor').innerHTML=`<circle cx="${x}" cy="${y}" r="${9*k}" fill="#fffdf8" fill-opacity=".7" stroke="#173f67" stroke-width="${2*k}"/><path d="M${x-14*k} ${y}h${28*k}M${x} ${y-14*k}v${28*k}" stroke="#173f67" stroke-width="${k}"/>`;
 if($('#location-confirm'))return;
 const box=document.createElement('div');box.id='location-confirm';box.setAttribute('role','group');box.setAttribute('aria-label','Confirmar ubicación');
 box.innerHTML='<span>Puedes tocar otra vez para ajustar.</span><button class="primary">Confirmar ubicación</button><button class="secondary">Cancelar</button>';
 const buttons=box.querySelectorAll('button');buttons[0].onclick=()=>{const p=pendingPoint;if(!p)return;const nearby=pool().filter(i=>i.category===current()?.category&&!i.path&&!i.polygons&&Math.hypot(...mapPosition(i,base).map((v,n)=>v-p[n]))*mapScale()<=18);if(nearby.length>1&&dims[0]/view[2]<maxZoom()){zoom(.5,p);box.querySelector('span').textContent='Había lugares muy próximos. Ajusta el punto en esta vista ampliada.';return;}clearPendingPoint();place(p,null,true);};buttons[1].onclick=clearPendingPoint;$('#map-stage').append(box);
}
svg.addEventListener('keydown',e=>{if(!session||!(mode==='drag'||qmode()==='point'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();cursor??=[view[0]+view[2]/2,view[1]+view[3]/2];const step=view[2]/(e.shiftKey?200:60);if(e.key==='ArrowLeft')cursor[0]-=step;if(e.key==='ArrowRight')cursor[0]+=step;if(e.key==='ArrowUp')cursor[1]-=step;if(e.key==='ArrowDown')cursor[1]+=step;cursor=[Math.max(0,Math.min(dims[0],cursor[0])),Math.max(0,Math.min(dims[1],cursor[1]))];$('#cursor').innerHTML=`<circle cx="${cursor[0]}" cy="${cursor[1]}" r="${view[2]/100}" fill="none" stroke="#173f67" stroke-width="2"/>`; }else if(e.key==='Enter'&&cursor){e.preventDefault();place(cursor);}});
$('#sources').onclick=()=>$('#about').showModal();$('#about .close').onclick=()=>$('#about').close();$('#about').addEventListener('click',e=>{if(e.target===$('#about')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#reset-progress').onclick=()=>{if(confirm('¿Borrar todos los aciertos y fallos guardados en este navegador?')){saved={};try{localStorage.removeItem('relieve-progress-v1');}catch{}updateStats();if(!session)updateSetup();}};
new ResizeObserver(()=>{renderMapDetail();renderMarks();}).observe($('#map-stage'));
$('#base').value=base;updateFilters();updateSetup();updateStats();setMap();$$('[data-mode],[data-scope]').forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('active')));
