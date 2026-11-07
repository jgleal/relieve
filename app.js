import {ITEMS} from './data.js';
import {checkAnswer,shuffle,mapPosition,hit,layoutAnchors,closestAnchor,featureType,anchorChoices} from './core.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved={};try{saved=JSON.parse(localStorage.getItem('relieve-progress-v1')||'{}');if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};}catch{}
let scope='world',mode='write',base='terrain',session=null,selected=null,view=[0,0,1200,500],dims=[1200,500],cursor=null,draggingPan=null,anchors=[];
const descriptions={write:['¿Cuántos recuerdas?','Identifica el punto señalado. La pregunta indica qué tipo de relieve buscamos.'],point:['Encuentra su lugar.','Lee el nombre y señala su ubicación. Amplía el mapa cuando necesites precisión.'],drag:['Todo por colocar.','Cada ancla señala un lugar. Arrastra las etiquetas al ancla correspondiente, o selecciona una y haz clic.'],challenge:['Un reto para recordar.','Escribe el nombre de cada punto señalado. Verás la corrección al finalizar. Si una respuesta es genérica o ambigua, te pediremos precisarla.'],review:['Una segunda vuelta.','Practica escribiendo los lugares que fallaste. Desaparecerán de este repaso cuando los aciertes sin ayuda.'],study:['Mira con calma.','Selecciona un nombre para ver su punto de referencia. Explora el mapa sin tiempo ni puntuación.']};
function pool(){return ITEMS.filter(i=>i.scope===scope);}
function filtered(){return pool().filter(i=>($('#group').value==='all'||i.group===$('#group').value)&&($('#category').value==='all'||i.category===$('#category').value)&&(mode!=='review'||saved[i.id]?.last===false));}
function updateStats(){const n=ITEMS.filter(i=>saved[i.id]?.last===true).length;$('#mastered').innerHTML=`${n} <small>/ 74</small>`;$('#overall-bar').style.width=`${n/74*100}%`;}
function persist(item,ok){const old=saved[item.id]||{};saved[item.id]={attempts:(Number(old.attempts)||0)+1,correct:(Number(old.correct)||0)+(ok?1:0),last:ok};try{localStorage.setItem('relieve-progress-v1',JSON.stringify(saved));}catch{$('.local-badge').textContent='Progreso solo durante esta visita';}updateStats();}
function updateFilters(){
 $('#group').innerHTML=scope==='world'?'<option value="all">Todo el mundo</option>'+['Asia','América','África','Europa','Oceanía'].map(v=>`<option>${v}</option>`).join(''):'<option value="all">Toda la Península</option>';
 $('#category').innerHTML='<option value="all">Todos los tipos</option>'+[...new Set(pool().map(i=>i.category))].map(v=>`<option>${v}</option>`).join('');
}
function updateSetup(){const n=filtered().length;$('#available').textContent=`${n} ${n===1?'lugar disponible':'lugares disponibles'}${mode==='review'&&n===0?' · No tienes lugares pendientes de repaso en esta selección.':''}`;$('#start').disabled=n===0;$('#count').disabled=['drag','study'].includes(mode);$('#session-title').textContent=descriptions[mode][0];$('#mode-description').textContent=descriptions[mode][1];$('#start').innerHTML=(mode==='study'?'Explorar mapa':'Empezar práctica')+' <span>↗</span>';$('#setup-note').textContent=mode==='drag'?'Se incluyen todos los lugares de la selección. Pasa por un ancla para ver su tipo de relieve.':mode==='challenge'?'Cada respuesta se guarda al avanzar. El tiempo es informativo.':mode==='study'?'Consulta los puntos de referencia y aprende antes de practicar.':'Sin prisas. Las tildes y las pequeñas erratas no te frenan.';}
function setMap(){dims=scope==='world'?(base==='original'?[1200,855]:[1200,500]):(base==='original'?[1000,712.4]:[1000,885]);$('#map-image').setAttribute('href',`assets/${base}-${scope}.webp`);$('#map-image').setAttribute('width',dims[0]);$('#map-image').setAttribute('height',dims[1]);$('#map-title').textContent=scope==='world'?'Relieve mundial':'Península Ibérica';$('#map-kicker').textContent=scope==='world'?'PLANISFERIO FÍSICO':'RELIEVE PENINSULAR';$('#map-tag').textContent=base==='original'?'MAPA ORIGINAL':base==='terrain'?'RELIEVE DETALLADO':'NATURAL EARTH';$('#map-credit').textContent=base==='original'?'Mapa original de la ficha':base==='terrain'?'NOAA / NCEI · relieve y batimetría':'Natural Earth · dominio público';$('#map').setAttribute('aria-label',`Mapa físico ${scope==='world'?'del mundo':'de la Península Ibérica'}. ${descriptions[mode][1]}`);resetView();renderMarks();}
function applyView(){ $('#map').setAttribute('viewBox',view.join(' ')); renderMapDetail();renderMarks(); }
// Keep the overview underneath while visible high-resolution tiles load.
function renderMapDetail(){
 const layer=$('#map-detail');let html='';
 if(base==='terrain'&&dims[0]/view[2]>1.5){
  const cols=scope==='world'?8:4,rows=4,w=dims[0]/cols,h=dims[1]/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=col*w,y=row*h;
   if(x+w<view[0]||x>view[0]+view[2]||y+h<view[1]||y>view[1]+view[3])continue;
   html+=`<image href="assets/terrain/${scope}/${col}-${row}.webp" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
  }
 }
 if(layer.innerHTML!==html)layer.innerHTML=html;
}
function resetView(){view=[0,0,...dims];applyView();}
function maxZoom(){return base==='natural'?3:base==='original'?6:scope==='world'?12:8;}
function zoom(factor,center){const cx=center?.[0]??view[0]+view[2]/2,cy=center?.[1]??view[1]+view[3]/2;const w=Math.max(dims[0]/maxZoom(),Math.min(dims[0],view[2]*factor)),h=w*dims[1]/dims[0];view=[cx-(cx-view[0])*w/view[2],cy-(cy-view[1])*h/view[3],w,h];clampView();}
function clampView(){view[0]=Math.max(0,Math.min(dims[0]-view[2],view[0]));view[1]=Math.max(0,Math.min(dims[1]-view[3],view[1]));applyView();}
function current(){return session?.items[session.index];}
function mapScale(){return $('#map').getScreenCTM()?.a||1;}
function pointMark(item,label=false,color='#b45332'){
 const [x,y]=mapPosition(item,base), k=1/mapScale();
 return `<g><circle cx="${x}" cy="${y}" r="${12*k}" fill="${color}" fill-opacity=".13"/><circle cx="${x}" cy="${y}" r="${4.5*k}" fill="${color}" stroke="#fffdf7" stroke-width="${1.5*k}"/>${label?`<text x="${x+11*k}" y="${y-10*k}" font-size="${12*k}" style="stroke-width:${3*k}px" stroke-linejoin="round">${esc(item.name)}</text>`:''}</g>`;
}
function nearestAnchor(p){return closestAnchor(anchors.filter(a=>!session.placed.has(a.item.id)),p,mapScale());}
function highlightAnchor(p){const target=session&&mode==='drag'?nearestAnchor(p):null;const tip=$('#anchor-tip');if(tip){tip.hidden=!target;tip.textContent=target?`Ancla ${target.index} · ${featureType(target.item)}`:'';}$$('#marks [data-anchor]').forEach(g=>g.classList.toggle('hovered',g.dataset.anchor===target?.item.id));}
function renderMarks(){
 $('#anchor-choice')?.remove();$('#anchor-tip')?.remove();let html='';anchors=[];
 if(session){
  if(mode==='drag'){
   anchors=layoutAnchors(session.anchorItems,base,dims,mapScale());const k=1/mapScale();
   html=anchors.map(a=>{
    const done=session.placed.has(a.item.id),hint=session.revealed&&selected?.id===a.item.id;
    const [x,y]=a.pos,[cx,cy]=a.center;
    return `<g data-anchor="${a.item.id}" class="map-anchor ${done?'placed':''} ${hint?'hinted':''}">${Math.hypot(x-cx,y-cy)>k?`<line class="anchor-leader" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#fffdf8" stroke-width="${3.5*k}"/><line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#375344" stroke-width="${1.25*k}"/><circle class="anchor-origin" cx="${cx}" cy="${cy}" r="${3*k}" fill="#375344" stroke="#fffdf8" stroke-width="${k}"/>`:""}<circle class="anchor-ring" cx="${x}" cy="${y}" r="${11*k}" stroke-width="${1.5*k}"/><text class="anchor-number" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${10*k}">${a.index}</text><title>${done?esc(a.item.name):`Ancla ${a.index} · ${featureType(a.item)}`}</title></g>`;
   }).join('');
  }else if(mode==='study'&&selected)html=pointMark(selected,true,'#315b46');
  else if(current()&&['write','challenge','review'].includes(mode))html=pointMark(current(),session.answered&&mode!=='challenge');
  else if(mode==='point'&&session.answered)html=pointMark(current(),true);
 }
 $('#marks').innerHTML=html;if(session&&mode==='drag'){const tip=document.createElement('div');tip.id='anchor-tip';tip.hidden=true;tip.setAttribute('aria-live','polite');$('#map-stage').append(tip);}
}
function lock(on){$$('[data-scope],[data-mode]').forEach(b=>b.disabled=on);document.body.classList.toggle('running',on);}
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
  html+=`<div class="task-heading"><h2>${mode==='drag'?'Cada nombre, en su lugar.':'Conoce el terreno.'}</h2><p class="muted">${mode==='drag'?'Arrastra al número o selecciona una etiqueta y pulsa su ancla.':'Elige un lugar para verlo en el mapa.'}</p></div><div class="chips" aria-label="Lista de lugares">${session.items.map(i=>`<button class="chip ${selected?.id===i.id?'selected':''} ${session.placed.has(i.id)?'solved':''}" data-item="${i.id}" draggable="false" ${session.placed.has(i.id)?'disabled':''}><span>${esc(i.name)}</span><span class="chip-mark" aria-hidden="true">${session.placed.has(i.id)?'✓ '+(session.anchorItems.findIndex(a=>a.id===i.id)+1):mode==='drag'?'⠿':'↗'}</span></button>`).join('')}</div>`;
  if(mode==='study')html+=`<div class="study-detail"><strong>${esc(selected?.name||'')}</strong><small>${esc(selected?.group||'')} · ${esc(selected?featureType(selected):'')}</small></div>`;
  html+='<div class="session-controls"><div id="feedback" role="status" aria-live="polite"></div>';
  html+=mode==='study'?'<button class="secondary" id="focus-place">Acercar al lugar <span>↗</span></button>':'<button class="secondary" id="reveal">Ver ancla de la etiqueta <span>↗</span></button>';
 }else{
  const i=current();html+=`<div class="question-block"><div class="question-context"><span>${esc(i.group)}</span><span>${esc(featureType(i))}</span></div><h2 class="question-title">${mode==='point'?esc(i.name):`¿Qué ${featureType(i)} es?`}</h2>`;
  if(mode==='point')html+='<div class="map-instruction"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg><div><strong>Señala su ubicación</strong><span>Haz clic en el mapa. Puedes ampliarlo.</span></div></div>';
  else html+='<p class="muted">Pon nombre al punto naranja.</p><form id="answer-form"><label for="answer">Tu respuesta</label><input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe el nombre…" required maxlength="120"><button class="primary" type="submit">'+(mode==='challenge'?'Guardar y continuar':'Comprobar')+' <span>↵</span></button></form>';
  html+='</div><div class="session-controls"><div id="feedback" role="status" aria-live="polite"></div><button class="primary" id="next" hidden>Siguiente lugar <span>→</span></button><div class="action-row">'+(mode!=='challenge'?'<button class="secondary" id="reveal">Ver solución</button>':'')+'<button class="secondary" id="skip">Saltar <span>→</span></button></div>';
  if(mode!=='point')html+='<button class="text-button focus-button" id="focus-place">Acercar al punto ↗</button>';
  else html+='<details class="keyboard-help"><summary>Usar el teclado</summary><p>Enfoca el mapa con <kbd>Tab</kbd>, mueve el cursor con las flechas y confirma con <kbd>Intro</kbd>.</p></details>';
 }
 html+='<button class="text-button" id="finish">Terminar sesión</button></div>';
 $('#game').innerHTML=html;if($('.chips'))$('.chips').scrollTop=oldScroll;
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
     document.body.append(dragPreview);b.classList.add('selected','drag-source');renderMarks();
    }
    dragPreview.style.left=`${event.clientX-7}px`;dragPreview.style.top=`${event.clientY-16}px`;
    highlightAnchor(mapPoint(event));
   };
   const end=(event,cancel=false)=>{
    b.onpointermove=null;b.onpointerup=null;b.onpointercancel=null;
    if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);
    dragPreview?.remove();dragPreview=null;b.classList.remove('drag-source');
    $$('#marks .hovered').forEach(g=>g.classList.remove('hovered'));
    if(moved&&!cancel&&document.elementFromPoint(event.clientX,event.clientY)?.closest('#map'))place(mapPoint(event));
   };
   b.onpointerup=event=>end(event);b.onpointercancel=event=>end(event,true);
  };
 });
 if(mode!=='point'&&!['drag','study'].includes(mode))$('#answer')?.focus({preventScroll:true});
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
function answer(result,value){if(!session||session.answered)return;const item=current();session.answers.push({id:item.id,name:item.name,...result,value});session.answered=true;persist(item,result.ok);if(mode==='challenge'){next();return;}
 let message=result.ok?(['exact','location'].includes(result.kind)?'Correcto.':result.kind==='typo'?'Correcto, con una pequeña errata.':'Correcto. Has usado un nombre abreviado o alternativo.'):(result.kind==='ambiguous'?'Ese nombre puede referirse a más de un lugar.':result.kind==='skip'?'Lo dejamos para repasar.':result.kind==='reveal'?'Solución consultada. Se guardará para repasar.':'Esta vez no. Lo guardamos para repasar.');
 feedback(`${message}<br><strong>${esc(item.name)}</strong>`,result.ok?(['exact','location'].includes(result.kind)?'':'warning'):'error');
 $('#answer-form')?.querySelectorAll('input,button').forEach(e=>e.disabled=true);$('#reveal')?.setAttribute('disabled','');$('#skip')?.setAttribute('disabled','');$('#next').hidden=false;$('#next').textContent=session.index===session.items.length-1?'Ver resultados →':'Siguiente lugar →';renderMarks();$('#next').focus({preventScroll:true});}
function reveal(){if(mode==='drag'){if(!selected){feedback('Selecciona primero una etiqueta.','warning');return;}session.failed.add(selected.id);session.revealed=true;feedback(`El ancla resaltada corresponde a <strong>${esc(selected.name)}</strong>. Colócala para continuar; quedará en tu repaso.`,'warning');renderMarks();}else answer({ok:false,kind:'reveal'},'Solución consultada');}
function next(){session.index++;session.answered=false;cursor=null;$('#cursor').innerHTML='';if(session.index>=session.items.length){finish();return;}resetView();renderGame();renderMarks();}
function place(p,confirmedId=null){if(!session||mode==='study')return;
 if(mode==='point'&&!session.answered){answer({ok:hit(current(),base,p),kind:'location'},'Ubicación en el mapa');return;}
 if(mode!=='drag')return;if(!selected){feedback('Selecciona primero una etiqueta.','warning');return;}if(session.placed.has(selected.id))return;
 const choices=anchorChoices(anchors.filter(a=>!session.placed.has(a.item.id)),p,mapScale());
 if(!confirmedId&&choices.length>1){
  $('#anchor-choice')?.remove();const box=document.createElement('div');box.id='anchor-choice';box.setAttribute('role','group');box.setAttribute('aria-label','Precisar ancla');box.onkeydown=e=>{if(e.key==='Escape'){box.remove();$('#map').focus({preventScroll:true});}};
  box.innerHTML='<strong>Hay varias anclas cerca.</strong><p>Elige una. Todavía no cuenta como intento.</p>'+choices.map(a=>`<button data-choice="${a.item.id}">Ancla ${a.index} · ${esc(featureType(a.item))}</button>`).join('')+'<button data-zoom>Ampliar zona</button><button data-cancel>Cancelar</button>';
  $('#map-stage').append(box);box.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{box.remove();place(p,b.dataset.choice);});
  box.querySelector('[data-zoom]').onclick=()=>zoom(.5,choices[0].center);box.querySelector('[data-cancel]').onclick=()=>box.remove();box.querySelector('button').focus({preventScroll:true});return;
 }
 $('#anchor-choice')?.remove();
 const anchor=confirmedId?anchors.find(a=>a.item.id===confirmedId&&!session.placed.has(a.item.id)):nearestAnchor(p);if(anchor?.item.id===selected.id){const ok=!session.failed.has(selected.id);session.placed.add(selected.id);session.answers.push({id:selected.id,name:selected.name,ok,kind:'location',value:ok?'Ubicación correcta':'Colocado tras un error o una pista'});persist(selected,ok);selected=null;session.revealed=false;renderGame();renderMarks();feedback(ok?'Bien colocado. Continúa con otra etiqueta.':'Colocado. Lo volveremos a practicar.');if(session.placed.size===session.items.length)finish();}
 else{if(anchor)session.failed.add(selected.id);feedback(`${anchor?'Esa ancla no corresponde.':'Elige un ancla del mapa.'} Busca <strong>${esc(selected.name)}</strong>.`,'error');}
}
function finish(){if(!session)return;if(mode==='study'){back();return;}
 // Preserve mistakes from unfinished drag attempts, without counting untouched labels.
 if(mode==='drag')for(const id of session.failed)if(!session.placed.has(id)){const i=session.items.find(x=>x.id===id);session.answers.push({id,name:i.name,ok:false,kind:'location',value:'Sin completar tras un error o una pista'});persist(i,false);}
 const answers=session.answers;const n=answers.filter(a=>a.ok).length;const secs=Math.round((Date.now()-session.started)/1000);$('#game').hidden=true;$('#results').hidden=false;
 $('#results').innerHTML=`<p class="eyebrow">SESIÓN TERMINADA</p><h2>${n===answers.length&&n>0?'Bien aprendido.':'Cada vuelta cuenta.'}</h2><div class="result-score">${n}<small> / ${answers.length}</small></div><p class="muted">Aciertos · ${Math.floor(secs/60)} min ${secs%60} s<br>${session.items.length-answers.length?`${session.items.length-answers.length} lugares sin intentar.`:'Has completado toda la sesión.'}</p><ul class="result-list">${answers.map(a=>`<li class="${a.ok?'':'wrong'}">${a.ok?'✓':'↺'} ${esc(a.name)}<small>${esc(a.value)}${a.ok&&['short','typo'].includes(a.kind)?(a.kind==='short'?' · Nombre abreviado o alternativo':' · Pequeña errata aceptada'):''}</small></li>`).join('')}</ul><button class="primary" id="again">Otra ronda <span>↗</span></button><button class="secondary" id="review-now">Repasar mis fallos</button><button class="text-button" id="configure">Cambiar configuración</button>`;
 $('#again').onclick=()=>{back();start();};$('#configure').onclick=back;$('#review-now').onclick=()=>{back();setMode('review');};lock(false);session=null;selected=null;$('#marks').innerHTML='';$('#cursor').innerHTML='';resetView();}
function back(){session=null;selected=null;$('#setup').hidden=false;$('#game').hidden=true;$('#results').hidden=true;lock(false);updateSetup();renderMarks();$('#cursor').innerHTML='';resetView();}
function setMode(m){mode=m;$$('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===m);b.setAttribute('aria-pressed',b.dataset.mode===m);});back();setMap();}
function mapPoint(e){const p=$('#map').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform($('#map').getScreenCTM().inverse());return [q.x,q.y];}
$$('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;$$('[data-scope]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});updateFilters();back();setMap();});$$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$('#base').onchange=()=>{base=$('#base').value;setMap();};$('#group').onchange=updateSetup;$('#category').onchange=updateSetup;$('#start').onclick=start;
$('#zoom-in').onclick=()=>zoom(.7);$('#zoom-out').onclick=()=>zoom(1/.7);$('#zoom-reset').onclick=resetView;
const svg=$('#map');svg.addEventListener('pointerleave',()=>{if($('#anchor-tip'))$('#anchor-tip').hidden=true;});svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:1/1.15,mapPoint(e));},{passive:false});
let suppressClick=false;svg.addEventListener('pointerdown',e=>{if(e.shiftKey||e.button===1){e.preventDefault();draggingPan={x:e.clientX,y:e.clientY,view:[...view]};suppressClick=true;svg.setPointerCapture(e.pointerId);}});svg.addEventListener('pointermove',e=>{if(!draggingPan)return;const s=svg.getScreenCTM();view=[draggingPan.view[0]-(e.clientX-draggingPan.x)/s.a,draggingPan.view[1]-(e.clientY-draggingPan.y)/s.d,view[2],view[3]];clampView();});svg.addEventListener('pointerup',()=>{draggingPan=null;setTimeout(()=>suppressClick=false,0);});svg.addEventListener('click',e=>{if(!suppressClick&&!e.shiftKey)place(mapPoint(e));});svg.addEventListener('pointermove',e=>{if(!draggingPan)highlightAnchor(mapPoint(e));});
svg.addEventListener('keydown',e=>{if(!session||!['point','drag'].includes(mode))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();cursor??=[view[0]+view[2]/2,view[1]+view[3]/2];const step=view[2]/(e.shiftKey?200:60);if(e.key==='ArrowLeft')cursor[0]-=step;if(e.key==='ArrowRight')cursor[0]+=step;if(e.key==='ArrowUp')cursor[1]-=step;if(e.key==='ArrowDown')cursor[1]+=step;cursor=[Math.max(0,Math.min(dims[0],cursor[0])),Math.max(0,Math.min(dims[1],cursor[1]))];$('#cursor').innerHTML=`<circle cx="${cursor[0]}" cy="${cursor[1]}" r="${view[2]/100}" fill="none" stroke="#173f67" stroke-width="2"/>`; }else if(e.key==='Enter'&&cursor){e.preventDefault();place(cursor);}});
$('#sources').onclick=()=>$('#about').showModal();$('#about .close').onclick=()=>$('#about').close();$('#about').addEventListener('click',e=>{if(e.target===$('#about')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#reset-progress').onclick=()=>{if(confirm('¿Borrar todos los aciertos y fallos guardados en este navegador?')){saved={};try{localStorage.removeItem('relieve-progress-v1');}catch{}updateStats();if(!session)updateSetup();}};
new ResizeObserver(()=>renderMarks()).observe($('#map-stage'));
updateFilters();updateSetup();updateStats();setMap();$$('[data-mode],[data-scope]').forEach(b=>b.setAttribute('aria-pressed',b.classList.contains('active')));
