(() => {
  const onReady = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
  const $$  = (el, show=true) => el && el.classList.toggle('hidden-vis', !show);
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));

  // ========== THEME ==========
  const THEME_KEY='nt-theme';
  const iconSun = () => `
    <circle cx="12" cy="12" r="4" stroke-width="1.6"></circle>
    <g stroke-width="1.6" stroke-linecap="round">
      <path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/>
      <path d="M4.2 4.2l1.4 1.4"/><path d="M18.4 18.4l1.4 1.4"/>
      <path d="M19.8 4.2l-1.4 1.4"/><path d="M5.6 18.4l-1.4 1.4"/>
    </g>`;
  const iconMoon = () => `
    <path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" stroke-width="1.6" fill="none"></path>`;
  function setThemeIcon(theme){
    const svg = qs('#themeIcon');
    if (!svg) return;
    svg.innerHTML = theme==='dark' ? iconMoon() : iconSun();
  }
  function applyTheme(t){ document.documentElement.classList.toggle('dark', t==='dark'); localStorage.setItem(THEME_KEY,t); setThemeIcon(t); }
  function initTheme(){ const saved=localStorage.getItem(THEME_KEY)|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); applyTheme(saved); }
  onReady(()=>{ qs('#themeToggle')?.addEventListener('click',()=>{ const cur=document.documentElement.classList.contains('dark')?'dark':'light'; applyTheme(cur==='dark'?'light':'dark'); }); });

  // ========== TOAST ==========
  function toast(msg, type='info'){ const host=qs('#toastHost'); const el=document.createElement('div'); el.className=`gs-card px-4 py-2 text-sm border-l-4 ${type==='error'?'border-red-400':type==='success'?'border-emerald-400':'border-[#C7A740]'}`; el.textContent=msg; host.appendChild(el); setTimeout(()=>el.remove(),3200); }

  // ========== ROUTER ==========
  function getViews(){
    return {
      resumen: qs('#view-resumen'),
      acuerdos: qs('#view-acuerdos'),
      metas: qs('#view-metas'),
      luces: qs('#view-luces'),
      juegos: qs('#view-juegos'),
      ajustes: qs('#view-ajustes'),
    };
  }
  function highlightActiveNav(){ const key=(location.hash||'#/resumen').replace('#/',''); qsa('#mainNav .nav-link').forEach(a=>{ const href=a.getAttribute('href').replace('#/',''); a.classList.toggle('active', href===key); }); }
  function showView(name){
    const views = getViews();
    Object.entries(views).forEach(([k,el])=> $$(el, k===name));
    if(name==='ajustes'){ renderContacts(); renderAgreCats(); renderPractices(); }
    if(name==='resumen'){ renderResumen(); }
    if(name==='acuerdos'){ renderAgreements(); }
    if(name==='juegos'){ renderGames(); }
    if(name==='luces'){ renderLightsInit(); }
    highlightActiveNav();
  }
  function parseRoute(){
    if(!location.hash) location.hash='#/resumen';
    const key=(location.hash||'#/resumen').replace('#/','');
    const views = getViews();
    if(!views[key]) return showView('resumen');
    showView(key);
  }
  onReady(()=> window.addEventListener('hashchange', parseRoute));

  // ===== AUTH (reemplazo) =====
(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const $$ = (el, show=true) => el && el.classList.toggle('hidden-vis', !show);
  const toast = (m,t='info') => {
    const host=qs('#toastHost')||document.body;
    const d=document.createElement('div');
    d.className=`gs-card px-4 py-2 text-sm border-l-4 ${t==='error'?'border-red-400':t==='success'?'border-emerald-400':'border-[#C7A740]'}`;
    d.textContent=m; host.appendChild(d); setTimeout(()=>d.remove(),3000);
  };

  const authCard = () => qs('#authCard');
  const appViews = () => qs('#appViews');

  async function refreshAuthUI(user){
    const logged=!!user;
    $$(authCard(),!logged);
    $$(appViews(),logged);
    $$(qs('#mainNav'),logged);
    $$(qs('#authActions'),logged);
    const tip=qs('#userTooltip'); if(tip) tip.textContent=logged?(user.email||''):'';
    if(logged){
      if(!location.hash) location.hash = '#/resumen';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }

  // enlace robusto del submit; reintenta si el form aún no existe
  function attachLoginHandlers(attempt=0){
    const form = qs('#loginForm');
    const btn  = qs('#loginBtn');
    if(!form || !btn){
      if (attempt < 20) return setTimeout(()=>attachLoginHandlers(attempt+1), 100);
      return;
    }
    if(form.__bound) return; // evita doble binding
    form.__bound = true;

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      await doLogin();
    });
  }

  async function doLogin(){
    const email = qs('#emailInput')?.value?.trim();
    const password = qs('#passwordInput')?.value || '';
    const btn = qs('#loginBtn');
    if (!email || !password) { toast('Completa email y password','error'); return; }
    try{
      btn.disabled = true; btn.textContent = 'Entrando…';
      const user = await window.NT.auth.signIn(email, password);
      toast('Sesión iniciada','success');
      await refreshAuthUI(user);
    }catch(err){
      console.error(err);
      toast(err.message || 'No se pudo iniciar sesión','error');
    }finally{
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  }

  // Fallback para el onclick inline del botón
  window.NT = window.NT || {};
  window.NT.ui = window.NT.ui || {};
  window.NT.ui.tryLogin = doLogin;

  // inicio
  document.addEventListener('DOMContentLoaded', async ()=>{
    attachLoginHandlers();
    // escucha cambios de auth (token refresh, etc.)
    window.NT.auth.onAuth((u)=> refreshAuthUI(u));
    const u = await window.NT.auth.getUser().catch(()=>null);
    refreshAuthUI(u);
  });
})();


  // ========== FLATPICKR ==========
  function fp(el){
    if(!el) return null;
    return flatpickr(el, {
      altInput: true, altFormat: "d/m/Y", dateFormat: "Y-m-d",
      defaultDate: new Date(), allowInput: true
    });
  }
  let fpAgreement, fpGame, fpLight, fpLightsStart;

  // ========== RESUMEN AVANZADO ==========
  const RESTART_ISO = '2025-09-14'; // 14/09/2025
  const emoScore = {
    feliz: 2, muy_feliz: 3, emocionado: 3, agradecido: 2, confiado: 2, aliviado: 1,
    meh: 0,
    cansado: -1, nervioso: -1,
    triste: -2, muy_triste: -3,
    frustrado: -2, estresado: -2, ansioso: -2, furioso: -3
  };
  const eddyColor  = '#3F3D8F';    // índigo oscuro
  const daniColor  = '#163054';    // azul oscuro
  const goldColor  = '#C7A740';

  function gaugeSVG(value=7, size=90){
    const pct=Math.max(1,Math.min(10,Number(value)))/10;
    const r=size/2 - 10, cx=size/2, cy=size/2, C=2*Math.PI*r, dash=(C*pct).toFixed(1);
    const color=`hsl(${Math.round(120*pct)},70%,45%)`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#e5e7eb" stroke-width="10" fill="none"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="10" fill="none"
              stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="${size/3.2}" fill="currentColor" font-weight="700">${(value||0).toFixed(1)}</text>
    </svg>`;
  }

  function sparkline(values=[], color='#999', w=300, h=60){
    if(values.length===0) return `<div class="text-xs opacity-70">Sin datos suficientes.</div>`;
    const min = Math.min(...values, -3), max = Math.max(...values, 3);
    const pad=6, step=(w-2*pad)/Math.max(1,values.length-1);
    const pts = values.map((v,i)=>{
      const x=pad + i*step;
      const t=(v-min)/(max-min || 1);
      const y=h - pad - t*(h-2*pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}" />
    </svg>`;
  }

  async function renderResumen(){
    const wrap=qs('#resumeStats'); if(!wrap) return;
    wrap.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      // Datos
      const [agreements, games] = await Promise.all([
        window.NT.agreements.listAgreements({}),
        window.NT.games.listGames()
      ]);

      // Días desde reinicio
      const diffDays = Math.floor((new Date().getTime() - new Date(RESTART_ISO).getTime()) / 86400000);

      // % avance (placeholder hasta metas)
      const percent = 0; // cuando metas/planes estén listos, calculamos de verdad

      // Juegos y roles
      const totalGames = games.length;
      const eddyActive = games.filter(g => g.role === 'Eddy→Dani').length;
      const daniActive = games.filter(g => g.role === 'Dani→Eddy').length;

      // Satisfacción promedios
      const now = new Date();
      const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth()-1);
      const weekAgo  = new Date(now); weekAgo.setDate(now.getDate()-7);
      const avg = (arr) => (arr.length? (arr.reduce((a,b)=>a+(Number(b.satisfaction)||0),0)/arr.length):0);
      const avgTotal  = avg(games);
      const avgMonth  = avg(games.filter(g=> new Date(g.played_on) >= monthAgo));
      const avgWeek   = avg(games.filter(g=> new Date(g.played_on) >= weekAgo));

      // Acuerdos aprobados/pendientes
      const aprob = agreements.filter(a=>a.status==='Aprobado').length;
      const pend  = agreements.filter(a=>a.status==='Pendiente').length;

      // Emociones últimos 60 días (sparklines)
      const sixty = new Date(now); sixty.setDate(now.getDate()-60);
      const lights = await window.NT.lights.listLights({ from: sixty.toISOString().slice(0,10), to: now.toISOString().slice(0,10) });
      const byDayPerson = (person) => {
        // día → promedio de score
        const map = new Map();
        lights.filter(l=>l.who===person).forEach(l=>{
          const d=l.light_on;
          const s=emoScore[l.emotion] ?? 0;
          const v=map.get(d) || {sum:0,n:0};
          v.sum+=s; v.n++;
          map.set(d,v);
        });
        // ordenar por fecha
        const dates = [...map.keys()].sort();
        return dates.map(d => (map.get(d).sum / map.get(d).n));
      };
      const eddySeries = byDayPerson('Eddy');
      const daniSeries = byDayPerson('Dani');

      // Render
      wrap.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div class="gs-card p-4 col-span-1 lg:col-span-2 flex items-center justify-between">
            <div>
              <div class="text-xs opacity-70">Días desde reinicio</div>
              <div class="text-4xl font-extrabold" style="color:${goldColor}">${diffDays}</div>
              <div class="text-xs opacity-70">Iniciado el 14/09/2025</div>
            </div>
            <div class="text-xs opacity-70">v0.4</div>
          </div>

          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Avance de planes/metas</div>
            <div class="text-4xl font-extrabold">${percent}%</div>
            <div class="text-xs opacity-70">Se recalculará cuando metas estén activas</div>
          </div>

          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Juegos</div>
            <div class="text-3xl font-bold">${totalGames}</div>
            <div class="flex gap-2 mt-2 items-center text-xs">
              <span class="gs-chip" style="border-color:${daniColor}; color:${daniColor}">Eddy activo: ${eddyActive}</span>
              <span class="gs-chip" style="border-color:${eddyColor}; color:${eddyColor}">Dani activo: ${daniActive}</span>
            </div>
          </div>

          <div class="gs-card p-4 flex items-center justify-between">
            <div>
              <div class="text-xs opacity-70">Satisfacción</div>
              <div class="text-xs opacity-70 mt-1">Total · Mes · Semana</div>
            </div>
            <div class="flex gap-2 items-center">
              ${gaugeSVG(avgTotal, 70)}
              ${gaugeSVG(avgMonth, 70)}
              ${gaugeSVG(avgWeek, 70)}
            </div>
          </div>

          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Acuerdos</div>
            <div class="flex items-end gap-2 mt-1">
              <div class="text-3xl font-extrabold" style="color:#22c55e">${aprob}</div>
              <div class="text-sm text-red-500">Pend: ${pend}</div>
            </div>
          </div>

          <div class="gs-card p-4 col-span-1 lg:col-span-2">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium" style="color:${eddyColor}">Emociones · Eddy (60d)</div>
            </div>
            <div class="mt-2">${sparkline(eddySeries, eddyColor, 520, 60)}</div>
          </div>

          <div class="gs-card p-4 col-span-1 lg:col-span-2">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium" style="color:${daniColor}">Emociones · Dani (60d)</div>
            </div>
            <div class="mt-2">${sparkline(daniSeries, daniColor, 520, 60)}</div>
          </div>
        </div>
      `;
    }catch(e){ console.error(e); wrap.innerHTML=`<div class="text-sm text-red-300">No se pudo cargar</div>`; }
  }

  // ========== CONTACTOS ==========
  const filterStatus=qs('#filterStatus'), addFab=qs('#addContactFab'), contactsList=qs('#contactsList');
  const contactModal=qs('#contactModal'), modalTitle=qs('#modalTitle'), deleteBtn=qs('#deleteBtn'), contactForm=qs('#contactForm');
  const idInput=qs('#contactId'), ownerInput=qs('#ownerInput'), nameInput=qs('#nameInput'), aliasInput=qs('#aliasInput'), categoryInput=qs('#categoryInput'), statusInput=qs('#statusInput'), treatmentInput=qs('#treatmentInput'), notesInput=qs('#notesInput');
  filterStatus?.addEventListener('change', renderContacts);
  addFab?.addEventListener('click',()=> openContactModal());
  async function renderContacts(){ if(!contactsList) return; contactsList.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`; try{ const status=filterStatus?.value||undefined; const items=await window.NT.contacts.listContacts({status}); if(!items.length){ contactsList.innerHTML=`<div class="text-sm opacity-70">Sin contactos.</div>`; return;} contactsList.innerHTML=items.map(c=>`<div class="gs-card p-4 flex items-start justify-between"><div class="flex items-start gap-3"><div class="w-9 h-9 rounded-xl" style="${c.owner==='Dani'?'background:linear-gradient(135deg,#163054,#334155)':'background:linear-gradient(135deg,#3F3D8F,#334155)'}"></div><div><div class="font-medium">${esc(c.alias?`${c.name} · ${c.alias}`:(c.name||'—'))}</div><div class="text-xs opacity-70">${esc(c.owner||'')} · ${esc(c.category||'')}</div>${c.treatment?`<div class="mt-1 text-xs"><span class="gs-chip">${esc(c.treatment)}</span></div>`:''}${c.notes?`<div class="mt-2 text-xs opacity-80">${esc(c.notes)}</div>`:''}</div></div><div class="flex items-center gap-2"><button class="gs-btn" data-edit="${c.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><button class="gs-btn" data-del="${c.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div></div>`).join(''); qsa('[data-edit]').forEach(b=> b.addEventListener('click',()=>{ const id=b.getAttribute('data-edit'); const it=items.find(x=>x.id===id); openContactModal(it);})); qsa('[data-del]').forEach(b=> b.addEventListener('click',async()=>{ const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar contacto?')) return; try{ await window.NT.contacts.deleteContact(id); toast('Eliminado','success'); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }})); }catch(e){ console.error(e); contactsList.innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; } }
  function openContactModal(item=null){ if(!contactModal) return; modalTitle.textContent=item?'Editar contacto':'Nuevo contacto'; $$(deleteBtn,!!item); idInput.value=item?.id||''; ownerInput.value=item?.owner||'Eddy'; nameInput.value=item?.name||''; aliasInput.value=item?.alias||''; categoryInput.value=item?.category||'Verde'; statusInput.value=item?.status||''; treatmentInput.value=item?.treatment||''; notesInput.value=item?.notes||''; contactModal.showModal(); }
  qs('#closeModal')?.addEventListener('click',()=> contactModal?.close());
  deleteBtn?.addEventListener('click', async()=>{ const id=idInput.value; if(!id) return; if(!confirm('¿Eliminar contacto?')) return; try{ await window.NT.contacts.deleteContact(id); contactModal.close(); toast('Eliminado','success'); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }});
  contactForm?.addEventListener('submit', async(e)=>{ e.preventDefault(); if(!nameInput.value.trim()) return toast('Nombre es obligatorio','error'); try{ const payload={ id:idInput.value||undefined, owner:ownerInput.value, name:nameInput.value.trim(), alias:aliasInput.value||null, category:categoryInput.value||null, status:statusInput.value||null, treatment:treatmentInput.value||null, notes:notesInput.value||null }; await window.NT.contacts.upsertContact(payload); contactModal.close(); toast('Guardado','success'); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast(`Error al guardar: ${e.message}`,'error'); } });

  // ========== ACUERDOS ==========
  const agreFilterStatus=qs('#agreFilterStatus'), addAgreementBtn=qs('#addAgreementBtn'), agreementsList=qs('#agreementsList');
  const agreementModal=qs('#agreementModal'), agreementForm=qs('#agreementForm'), deleteAgreementBtn=qs('#deleteAgreementBtn');
  const agreementModalTitle=qs('#agreementModalTitle'); const agreementId=qs('#agreementId'), agreementCategory=qs('#agreementCategory'), agreementDate=qs('#agreementDate'), agreementPromoter=qs('#agreementPromoter'), agreementStatusRO=qs('#agreementStatusRO'), agreementTitle=qs('#agreementTitle'), agreementNotes=qs('#agreementNotes'), eddyDecision=qs('#eddyDecision'), daniDecision=qs('#daniDecision');
  agreFilterStatus?.addEventListener('change', renderAgreements);
  addAgreementBtn?.addEventListener('click', async()=>{ await loadAgreementCategories(true); openAgreementModal(); });
  async function loadAgreementCategories(onlyActive=false){ if(!agreementCategory) return; const cats=await window.NT.agreCats.listAgreementCategories({onlyActive}); agreementCategory.innerHTML=cats.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join(''); }
  function computeStatus(e='none',d='none'){ if(e==='approve'&&d==='approve') return 'Aprobado'; if(e==='reject'&&d==='reject') return 'Rechazado'; if(e==='reject'||d==='reject') return 'Pendiente'; return 'Pendiente'; }
  async function renderAgreements(){ if(!agreementsList) return; agreementsList.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`; try{ const status=agreFilterStatus?.value||undefined; const items=await window.NT.agreements.listAgreements({status}); if(!items.length){ agreementsList.innerHTML=`<div class="text-sm opacity-70">Sin acuerdos.</div>`; return; } agreementsList.innerHTML=items.map(a=>`<div class="gs-card p-4 flex items-start justify-between"><div><div class="font-medium">${esc(a.title)}</div><div class="text-xs opacity-70">${esc(a.category_key)} · ${esc(a.promoter)} · ${esc(a.created_on)}</div>${a.notes?`<div class="mt-1 text-xs opacity-80">${esc(a.notes)}</div>`:''}<div class="mt-2 flex gap-2 text-xs"><span class="gs-chip">Eddy: ${esc(a.eddy_decision)}</span><span class="gs-chip">Dani: ${esc(a.dani_decision)}</span></div></div><div class="flex items-center gap-2"><span class="gs-chip">${esc(a.status)}</span><button class="gs-btn" data-edit-agre="${a.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><button class="gs-btn" data-del-agre="${a.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div></div>`).join(''); qsa('[data-edit-agre]').forEach(b=> b.addEventListener('click',async()=>{ const id=b.getAttribute('data-edit-agre'); const it=items.find(x=>x.id===id); await loadAgreementCategories(false); openAgreementModal(it);})); qsa('[data-del-agre]').forEach(b=> b.addEventListener('click',async()=>{ const id=b.getAttribute('data-del-agre'); if(!confirm('¿Eliminar acuerdo?')) return; try{ await window.NT.agreements.deleteAgreement(id); toast('Eliminado','success'); renderAgreements(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }})); }catch(e){ console.error(e); agreementsList.innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; } }
  function openAgreementModal(item=null){ if(!agreementModal) return; agreementModalTitle.textContent=item?'Editar acuerdo':'Nuevo acuerdo'; $$(deleteAgreementBtn,!!item); agreementId.value=item?.id||''; agreementCategory.value=item?.category_key||agreementCategory.value; agreementPromoter.value=item?.promoter||'Ambos'; agreementTitle.value=item?.title||''; agreementNotes.value=item?.notes||''; eddyDecision.value=item?.eddy_decision||'none'; daniDecision.value=item?.dani_decision||'none'; agreementStatusRO.value=computeStatus(eddyDecision.value,daniDecision.value); agreementModal.showModal(); if(fpAgreement) fpAgreement.destroy(); fpAgreement = fp(agreementDate); }
  qs('#closeAgreementModal')?.addEventListener('click',()=> agreementModal?.close());
  eddyDecision?.addEventListener('change',()=> agreementStatusRO.value=computeStatus(eddyDecision.value,daniDecision.value));
  daniDecision?.addEventListener('change',()=> agreementStatusRO.value=computeStatus(eddyDecision.value,daniDecision.value));
  deleteAgreementBtn?.addEventListener('click', async()=>{ const id=agreementId.value; if(!id) return; if(!confirm('¿Eliminar acuerdo?')) return; try{ await window.NT.agreements.deleteAgreement(id); agreementModal.close(); toast('Eliminado','success'); renderAgreements(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }});
  agreementForm?.addEventListener('submit', async(e)=>{ e.preventDefault(); if(!agreementTitle.value.trim()) return toast('El acuerdo necesita un título','error'); try{ const payload={ id:agreementId.value||undefined, category_key:agreementCategory.value, title:agreementTitle.value.trim(), notes:agreementNotes.value||null, created_on:agreementDate.value, promoter:agreementPromoter.value, eddy_decision:eddyDecision.value, dani_decision:daniDecision.value }; await window.NT.agreements.upsertAgreement(payload); agreementModal.close(); toast('Guardado','success'); renderAgreements(); }catch(e){ console.error(e); toast(`Error al guardar: ${e.message}`,'error'); }});

  // ========== PRÁCTICAS ==========
  const practicesList=qs('#practicesList'), addPracticeBtn=qs('#addPracticeBtn');
  addPracticeBtn?.addEventListener('click',()=> openPracticeModal());
  function openPracticeModal(item=null){
    const key = item?.key || prompt('Clave (ej: oral_e2d):', item?.key||'');
    if (!key) return;
    const label = item?.label || prompt('Nombre visible:', item?.label||'');
    if (!label) return;
    const active = item?.active ?? true;
    window.NT.practices.upsertPractice({ key, label, active }).then(()=>{ toast('Guardado','success'); renderPractices(); }).catch(e=>{ console.error(e); toast(`Error: ${e.message}`,'error'); });
  }
  async function renderPractices(){
    if(!practicesList) return;
    practicesList.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      const items=await window.NT.practices.listPractices();
      practicesList.innerHTML=items.map(p=>`<div class="gs-card p-4 flex items-center justify-between"><div><div class="font-medium">${esc(p.label)}</div><div class="text-xs opacity-70">key: ${esc(p.key)} · ${p.active?'Activa':'Inactiva'}</div></div><div class="flex gap-2"><button class="gs-btn" data-edit-pr="${p.key}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><button class="gs-btn" data-del-pr="${p.key}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div></div>`).join('');
      qsa('[data-edit-pr]').forEach(b=> b.addEventListener('click',()=>{ const key=b.getAttribute('data-edit-pr'); const it=items.find(x=>x.key===key); openPracticeModal(it); }));
      qsa('[data-del-pr]').forEach(b=> b.addEventListener('click',async()=>{ const key=b.getAttribute('data-del-pr'); if(!confirm('¿Eliminar práctica?')) return; try{ await window.NT.practices.deletePractice(key); toast('Eliminada','success'); renderPractices(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }}));
    }catch(e){ console.error(e); practicesList.innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  // ========== JUEGOS ==========
  const gamesList=qs('#gamesList'), addGameBtn=qs('#addGameBtn');
  const gameModal=qs('#gameModal'), gameForm=qs('#gameForm'), deleteGameBtn=qs('#deleteGameBtn');
  const gameModalTitle=qs('#gameModalTitle');
  const gameId=qs('#gameId'), gameDate=qs('#gameDate'), gameKind=qs('#gameKind'), gamePromoter=qs('#gamePromoter'), gameCondom=qs('#gameCondom'), gameRole=qs('#gameRole'), gameToys=qs('#gameToys'), gameToysWith=qs('#gameToysWith'), gameCream=qs('#gameCream'), gameLocation=qs('#gameLocation'), gameSatisfaction=qs('#gameSatisfaction'), gameNotes=qs('#gameNotes');
  const locList=qs('#locList'), practicesChecklist=qs('#practicesChecklist'), satisfactionGauge=qs('#satisfactionGauge');
  addGameBtn?.addEventListener('click', async()=>{ await loadPracticesChecklist(); await loadLocations(); openGameModal(); });
  function gauge(value=7){ if(!satisfactionGauge) return; const pct=Math.max(1,Math.min(10,Number(value)))/10; const r=28,C=2*Math.PI*r,dash=(C*pct).toFixed(1); const color=`hsl(${Math.round(120*pct)}, 70%, 45%)`; satisfactionGauge.innerHTML=`<svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="${r}" stroke="#e5e7eb" stroke-width="8" fill="none"/><circle cx="40" cy="40" r="${r}" stroke="${color}" stroke-width="8" fill="none" stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle" font-size="18" fill="currentColor">${value}</text></svg>`; }
  gameSatisfaction?.addEventListener('input', ()=> gauge(gameSatisfaction.value));
  gameToys?.addEventListener('change', ()=>{ if(!gameToysWith) return; gameToysWith.disabled = (gameToys.value!=='true') });
  async function loadPracticesChecklist(){ if(!practicesChecklist) return; const practices = await window.NT.practices.listPractices({onlyActive:true}); practicesChecklist.innerHTML = practices.map(p => `<label class="flex items-center gap-2 text-sm"><input type="checkbox" value="${esc(p.key)}"> <span>${esc(p.label)}</span></label>`).join(''); }
  async function loadLocations(){ if(!locList) return; const locs = await window.NT.locations.listLocations(); locList.innerHTML = locs.map(l => `<option value="${esc(l.name)}"></option>`).join(''); }
  async function renderGames(){ if(!gamesList) return; gamesList.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`; try{ const items = await window.NT.games.listGames(); if(!items.length){ gamesList.innerHTML=`<div class="text-sm opacity-70">Sin juegos.</div>`; return; } gamesList.innerHTML = items.map(g=>`<div class="gs-card p-4 flex items-start justify-between"><div><div class="font-medium">${esc(g.kind==='juego'?'Juego':'Mini-juego')} · ${esc(g.promoter)} · ${esc(g.played_on)}</div><div class="text-xs opacity-70">${esc(g.role)} · Condón: ${g.condom?'Sí':'No'} · Juguetes: ${g.toys?'Sí':'No'} ${g.toys?`· Con: ${esc(g.toys_with||'—')}`:''} · Lechita: ${esc(g.cream_inside)}</div><div class="text-xs opacity-70 mt-1">Lugar: ${esc(g.location||'—')}</div>${g.practices?.length?`<div class="mt-1 text-xs">${g.practices.map(p=>`<span class="gs-chip mr-1">${esc(p)}</span>`).join('')}</div>`:''}${g.notes?`<div class="mt-2 text-xs opacity-80">${esc(g.notes)}</div>`:''}</div><div class="flex items-center gap-3"><div>${(()=>{ const v=g.satisfaction||1; const pct=v/10; const r=18, C=2*Math.PI*r, dash=(C*pct).toFixed(1); const color=`hsl(${Math.round(120*pct)},70%,45%)`; return `<svg width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="${r}" stroke="#e5e7eb" stroke-width="6" fill="none"/><circle cx="25" cy="25" r="${r}" stroke="${color}" stroke-width="6" fill="none" stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 25 25)"/><text x="25" y="30" text-anchor="middle" font-size="12" fill="currentColor">${v}</text></svg>`; })()}</div><button class="gs-btn" data-edit-game="${g.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><button class="gs-btn" data-del-game="${g.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div></div>`).join(''); qsa('[data-edit-game]').forEach(b=> b.addEventListener('click', async()=>{ const id=b.getAttribute('data-edit-game'); const it=items.find(x=>x.id===id); await loadPracticesChecklist(); await loadLocations(); openGameModal(it); })); qsa('[data-del-game]').forEach(b=> b.addEventListener('click', async()=>{ const id=b.getAttribute('data-del-game'); if(!confirm('¿Eliminar juego?')) return; try{ await window.NT.games.deleteGame(id); toast('Eliminado','success'); renderGames(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }})); }catch(e){ console.error(e); gamesList.innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; } }
  function openGameModal(item=null){ if(!gameModal) return; gameModalTitle.textContent=item?'Editar juego':'Nuevo juego'; $$(deleteGameBtn,!!item); gameId.value=item?.id||''; gameKind.value=item?.kind||'juego'; gamePromoter.value=item?.promoter||'Ambos'; gameCondom.value=String(item?.condom??false); gameRole.value=item?.role||'Ambos versátiles'; gameToys.value=String(item?.toys??false); gameToysWith.value=item?.toys_with||''; gameToysWith.disabled=(gameToys.value!=='true'); gameCream.value=item?.cream_inside||'Ninguno'; gameLocation.value=item?.location||''; gameSatisfaction.value=item?.satisfaction||7; gauge(gameSatisfaction.value); gameNotes.value=item?.notes||''; qsa('input[type=checkbox]', practicesChecklist||document).forEach(ch => ch.checked = !!(item?.practices||[]).includes(ch.value)); gameModal.showModal(); if(fpGame) fpGame.destroy(); fpGame = fp(gameDate); if(item?.played_on) fpGame.setDate(item.played_on,true); }
  qs('#closeGameModal')?.addEventListener('click',()=> gameModal?.close());
  deleteGameBtn?.addEventListener('click', async()=>{ const id=gameId.value; if(!id) return; if(!confirm('¿Eliminar juego?')) return; try{ await window.NT.games.deleteGame(id); gameModal.close(); toast('Eliminado','success'); renderGames(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }});
  gameForm?.addEventListener('submit', async(e)=>{ e.preventDefault(); const practices = qsa('input[type=checkbox]', practicesChecklist||document).filter(ch=>ch.checked).map(ch=>ch.value); try{ const payload = { id: gameId.value||undefined, played_on: gameDate.value, kind: gameKind.value, promoter: gamePromoter.value, condom: gameCondom.value==='true', role: gameRole.value, toys: gameToys.value==='true', toys_with: gameToys.value==='true' ? (gameToysWith.value||null) : null, cream_inside: gameCream.value, location: gameLocation.value || null, satisfaction: Number(gameSatisfaction.value), notes: gameNotes.value || null, practices }; await window.NT.games.upsertGame(payload); gameModal.close(); toast('Guardado','success'); renderGames(); }catch(e){ console.error(e); toast(`Error al guardar: ${e.message}`,'error'); }});

  // ========== LUCES ==========
  const lightsList=qs('#lightsList'), addLightBtn=qs('#addLightBtn'), lightsStats=qs('#lightsStats'), lightsRangeType=qs('#lightsRangeType'), lightsRangeStart=qs('#lightsRangeStart');
  const lightModal=qs('#lightModal'), lightForm=qs('#lightForm'), deleteLightBtn=qs('#deleteLightBtn');
  const lightModalTitle=qs('#lightModalTitle'); const lightId=qs('#lightId'), lightDate=qs('#lightDate'), lightColor=qs('#lightColor'), lightWho=qs('#lightWho'), lightEmotion=qs('#lightEmotion'), lightAction=qs('#lightAction'), lightNotes=qs('#lightNotes');

  function rangeFrom(type, anchor){ const d=new Date(anchor); if(type==='week'){ const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); } else { d.setDate(1); } return d.toISOString().slice(0,10); }
  function colorDot(color){ const map={Rojo:'#ef4444',Ámbar:'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'}; const c=map[color]||'#9ca3af'; return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${c}"></span>`; }
  const emoIcon = (e) => { const base='currentColor'; const faces={ feliz:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, muy_feliz:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M7.5 14c2.5 3 6.5 3 9 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, meh:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, triste:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, muy_triste:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M7.5 17c2.5-3 6.5-3 9 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, cansado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10h2M14 10h2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, frustrado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10l2-1M16 10l-2-1" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 16l8-1" stroke="${base}" stroke-width="1.6" />`, furioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 9l2-2M16 9l-2-2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, estresado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10l2 1M14 11l2-1" stroke="${base}" stroke-width="1.6"/><path d="M7 16h10" stroke="${base}" stroke-width="1.6" stroke-dasharray="2 2"/>`, ansioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1" fill="${base}"/><circle cx="15" cy="12" r="1" fill="${base}"/><path d="M8 16h8" stroke="${base}" stroke-width="1.6" stroke-dasharray="1 2"/>`, nervioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10l1 1M16 10l-1 1" stroke="${base}" stroke-width="1.6"/><path d="M8 16c2 0 6 0 8 0" stroke="${base}" stroke-width="1.6" stroke-dasharray="3 2"/>`, confiado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6"/><path d="M7 7l2 2" stroke="${base}" stroke-width="1.6"/>`, aliviado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M9 10l-1 1M16 10l-1 1" stroke="${base}" stroke-width="1.6"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6"/>`, emocionado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 14c2 2 4 2 8 0" stroke="${base}" stroke-width="1.6"/><path d="M12 6v2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`, agradecido:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 15c2 1 6 1 8 0" stroke="${base}" stroke-width="1.6"/><path d="M7 7l2 2M17 7l-2 2" stroke="${base}" stroke-width="1.6"/>`, };
    const svg = faces[e] || faces.meh; return `<svg class="icon-sm" viewBox="0 0 24 24" fill="none">${svg}</svg>`; };
  function opposite(who){ return who==='Eddy' ? 'Dani' : 'Eddy'; }

  async function renderLightsInit(){
    // default: semana del día actual
    const today=new Date();
    if(fpLightsStart) fpLightsStart.destroy();
    fpLightsStart = flatpickr('#lightsRangeStart', {
      altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d",
      defaultDate: rangeFrom('week', today), allowInput:true,
      onChange: () => renderLights()
    });
    qs('#lightsRangeType').value='week';
    qs('#lightsRangeType')?.addEventListener('change', renderLights);
    await renderLights();
  }

  const addLightBtn=qs('#addLightBtn');
  addLightBtn?.addEventListener('click', ()=> openLightModal());

  async function renderLights(){
    const list = qs('#lightsList'); if(!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      const type=qs('#lightsRangeType')?.value||'week';
      const start=(qs('#lightsRangeStart')?.value) || rangeFrom(type, new Date());
      const dStart=new Date(start); const dEnd=new Date(start);
      if(type==='week'){ dEnd.setDate(dStart.getDate()+6);} else { dEnd.setMonth(dStart.getMonth()+1); dEnd.setDate(dEnd.getDate()-1); }
      const from=start, to=dEnd.toISOString().slice(0,10);

      const items = await window.NT.lights.listLights({ from, to });

      // stats
      const counts = {Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i=> counts[i.color]=(counts[i.color]||0)+1);
      const stats = qs('#lightsStats');
      if(stats) stats.innerHTML = Object.entries(counts).map(([k,v]) => `
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot(k)} <span>${k}</span></div>
          <div class="text-2xl font-semibold">${v}</div>
        </div>
      `).join('');

      if(!items.length){ list.innerHTML=`<div class="text-sm opacity-70">Sin entradas.</div>`; return; }

      list.innerHTML = items.map(l=>`
        <div class="gs-card p-4">
          <div class="flex items-center justify-between mb-1 text-sm opacity-80">
            <div class="flex items-center gap-2">${colorDot(l.color)} <strong>${esc(l.who)}</strong></div>
            <div>${esc(l.light_on)}</div>
          </div>
          <div class="font-medium">${esc(l.action)}</div>
          <div class="mt-1 text-xs opacity-80 flex items-center gap-2">
            <span>${opposite(l.who)}</span> ·
            <span class="inline-flex items-center gap-1">${emoIcon(l.emotion)} <span>${esc(l.emotion)}</span></span>
          </div>
          ${l.notes?`<div class="mt-2 text-xs opacity-80">${esc(l.notes)}</div>`:''}
          <div class="mt-3 flex items-center gap-2 justify-end">
            <button class="gs-btn" data-edit-light="${l.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
            <button class="gs-btn" data-del-light="${l.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit-light]').forEach(b=> b.addEventListener('click',()=>{ const id=b.getAttribute('data-edit-light'); const it=items.find(x=>x.id===id); openLightModal(it); }));
      qsa('[data-del-light]').forEach(b=> b.addEventListener('click',async()=>{ const id=b.getAttribute('data-del-light'); if(!confirm('¿Eliminar entrada?')) return; try{ await window.NT.lights.deleteLight(id); toast('Eliminada','success'); renderLights(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }}));
    }catch(e){ console.error(e); qs('#lightsList').innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  function openLightModal(item=null){
    const modal=qs('#lightModal'); if(!modal) return;
    $$(qs('#deleteLightBtn'),!!item);
    qs('#lightModalTitle').textContent=item?'Editar entrada':'Nueva entrada';
    qs('#lightId').value=item?.id||'';
    qs('#lightColor').value=item?.color||'Verde';
    qs('#lightWho').value=item?.who||'Eddy';
    qs('#lightEmotion').value=item?.emotion||'meh';
    qs('#lightAction').value=item?.action||'';
    qs('#lightNotes').value=item?.notes||'';
    modal.showModal();
    if(fpLight) fpLight.destroy();
    fpLight = fp(qs('#lightDate'));
    if(item?.light_on) fpLight.setDate(item.light_on, true);
  }
  qs('#closeLightModal')?.addEventListener('click',()=> qs('#lightModal')?.close());
  qs('#deleteLightBtn')?.addEventListener('click', async()=>{ const id=qs('#lightId').value; if(!id) return; if(!confirm('¿Eliminar entrada?')) return; try{ await window.NT.lights.deleteLight(id); qs('#lightModal').close(); toast('Eliminada','success'); renderLights(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }});
  qs('#lightForm')?.addEventListener('submit', async(e)=>{ e.preventDefault(); const action=qs('#lightAction').value.trim(); if(!action) return toast('Acción es obligatoria','error'); try{ const payload={ id:qs('#lightId').value||undefined, light_on:qs('#lightDate').value, color:qs('#lightColor').value, who:qs('#lightWho').value, action, emotion:qs('#lightEmotion').value, notes:qs('#lightNotes').value||null }; await window.NT.lights.upsertLight(payload); qs('#lightModal').close(); toast('Guardado','success'); renderLights(); }catch(e){ console.error(e); toast(`Error al guardar: ${e.message}`,'error'); }});

})();
