const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function money(cents){
  return (Number(cents||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
function formatDate(value){
  if(!value) return 'Data a confirmar';
  return new Date(value).toLocaleDateString('pt-BR');
}
function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

const fallbackEvents = [
  {id:'demo-f1',name:'Fórmula 1 2026',city:'São Paulo, SP',event_date:'2026-11-06',image_url:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1000&q=85',category:'Esportes'},
  {id:'demo-iron',name:'Iron Maiden — Run For Your Lives',city:'Curitiba, PR',event_date:'2026-12-01',image_url:'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1000&q=85',category:'Rock'},
  {id:'demo-bts',name:'BTS — World Tour',city:'São Paulo, SP',event_date:'2026-10-20',image_url:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=85',category:'Shows'},
  {id:'demo-rock',name:'Rock the Mountain 2026',city:'Teresópolis, RJ',event_date:'2026-11-14',image_url:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85',category:'Rock'},
  {id:'demo-luan',name:'Luan Santana — Registro Histórico',city:'Belo Horizonte, MG',event_date:'2026-12-12',image_url:'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=85',category:'Shows'}
];

let EVENTS=[];

async function loadEvents(){
  const {data,error}=await db.from('events').select('*').eq('published',true).order('event_date',{ascending:true});
  if(error){ console.warn('Supabase events:',error.message); EVENTS=fallbackEvents; return EVENTS; }
  EVENTS=data||[];
  if(!EVENTS.length) EVENTS=fallbackEvents;
  return EVENTS;
}

function eventCard(e){
  return `<article class="card" onclick="location.href='evento.html?id=${encodeURIComponent(e.id)}'">
    <img src="${escapeHtml(e.image_url||'')}" alt="">
    <div><small>${formatDate(e.event_date)}</small><h3>${escapeHtml(e.name)}</h3><p>${escapeHtml([e.city,e.venue].filter(Boolean).join(' • '))}</p><div class="price">Ingressos disponíveis</div></div>
  </article>`;
}
function renderEvents(list=EVENTS){
  const el=document.getElementById('eventGrid');
  if(!el)return;
  el.innerHTML=list.length?list.map(eventCard).join(''):'<p>Nenhum evento encontrado.</p>';
}

async function initHomeOrEvents(){
  if(!document.getElementById('eventGrid')) return;
  await loadEvents(); renderEvents();
  const search=document.getElementById('search');
  if(search) search.addEventListener('input',()=>{
    const q=search.value.trim().toLowerCase();
    renderEvents(EVENTS.filter(e=>(`${e.name} ${e.city||''} ${e.category||''}`).toLowerCase().includes(q)));
  });
}

async function initEventPage(){
  const page=document.getElementById('eventPage'); if(!page)return;
  await loadEvents();
  const id=new URLSearchParams(location.search).get('id');
  let e=EVENTS.find(x=>String(x.id)===String(id));
  if(!e){page.innerHTML='<div class="form-page"><h1>Evento não encontrado</h1><a class="btn" href="eventos.html">Voltar aos eventos</a></div>';return;}
  const {data:listings,error}=await db.from('listings').select('*').eq('event_id',e.id).eq('status','available').order('price_cents',{ascending:true});
  const offers=error?[]:(listings||[]);
  page.innerHTML=`<img style="width:100%;max-height:430px;object-fit:cover;border-radius:18px" src="${escapeHtml(e.image_url||'')}" alt="">
    <h1>${escapeHtml(e.name)}</h1><p>${escapeHtml([e.city,e.venue].filter(Boolean).join(' • '))} ${e.event_date?'• '+formatDate(e.event_date):''}</p>
    ${e.description?`<p>${escapeHtml(e.description)}</p>`:''}<hr><h2>Ingressos disponíveis</h2>
    <div class="offers">${offers.length?offers.map(o=>`<div class="card"><div><h3>${escapeHtml(o.sector||'Setor não informado')}</h3><p>${o.quantity} ingresso(s) disponível(is)</p><div class="price">${money(o.price_cents)} por ingresso</div><br><button class="btn" onclick="alert('Compra será liberada na próxima etapa.')">Comprar ingresso</button></div></div>`).join(''):'<div class="card"><div><h3>Ainda não há anúncios</h3><p>Se você possui ingresso para este evento, pode anunciá-lo no TicketHub.</p><a class="btn" href="anunciar.html">Anunciar ingresso</a></div></div>'}</div>`;
}

async function initSell(){
  const form=document.getElementById('sellForm'); if(!form)return;
  await loadEvents();
  const select=document.getElementById('sellEvent');
  if(select) select.innerHTML=EVENTS.map(e=>`<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`).join('');
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    const {data:{user}}=await db.auth.getUser();
    if(!user){alert('Entre na sua conta antes de anunciar um ingresso.'); location.href='login.html'; return;}
    const fd=new FormData(form);
    const price=Math.round(Number(fd.get('price'))*100);
    const payload={event_id:fd.get('event_id'),seller_id:user.id,sector:fd.get('sector'),quantity:Number(fd.get('quantity')),price_cents:price,status:'available'};
    const {error}=await db.from('listings').insert(payload);
    if(error){alert('Não foi possível publicar: '+error.message);return;}
    alert('Ingresso publicado com sucesso!'); form.reset();
  });
}

async function initLogin(){
  const form=document.getElementById('loginForm'); if(!form)return;
  const mode=document.getElementById('loginMode');
  const submit=()=>form.requestSubmit();
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    const email=document.getElementById('email').value.trim();
    const password=document.getElementById('password').value;
    const signUp=mode?.value==='signup';
    const result=signUp?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
    if(result.error){alert(result.error.message);return;}
    alert(signUp?'Conta criada. Verifique seu e-mail se o Supabase solicitar.':'Login realizado!');
    location.href='index.html';
  });
}

async function init(){
  if(!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('COLE_AQUI')){
    console.warn('TicketHub: coloque a chave sb_public em config.js');
  }
  await initHomeOrEvents();
  await initEventPage();
  await initSell();
  await initLogin();
}
init();
