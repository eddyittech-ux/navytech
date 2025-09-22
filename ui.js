/* ui.js v0.5.2 — NavyTech UI
   - Tema (sol/luna) estable
   - Router por hash
   - Login robusto
   - Resumen real
   - Luces con filtros (rango + quién) y modal
   - Ajustes Contactos/Prácticas básicos
*/
(() => {
  // ---------- helpers ----------
  const onReady = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  const qs  = (s,el=document)=>el.querySelector(s);
  const qsa = (s,el=document)=>[...el.querySelectorAll(s)];
  const $$  = (el,show=true)=> el && (el.classList.toggle('hidden-vis', !show), el);
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));
  const toast = (msg,type='info')=>{
    const host = qs('#toastHost'); const d = document.createElement('div');
    d.className = `gs-card px-4 py-2 text-sm border-l-4 ${type==='error'?'border-red-400':type==='success'?'border-emerald-400':'border-[#C7A740]'}`;
    d.textContent = msg; host.appendChild(d); setTimeout(()=>d.remove(),3200);
  };

  // ---------- tema ----------
  const THEME_KEY='nt-theme';
  const iconSun = () => `
    <circle cx="12" cy="12" r="4" stroke-width="1.6"></circle>
    <g stroke-width="1.6" stroke-linecap="round">
      <path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/>
      <path d="M4.2 4.2l1.4 1.4"/><path d="M18.4 18.4l1.4 1.4"/>
      <path d="M19.8 4.2l-1.4 1.4"/><path d="M5.6 18.4l-1.4 1.4"/>
    </g>`;
  const iconMoon = () => `<path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" stroke-width="1.6" fill="none"></path>`;
  function setThemeIcon(t){ const s=qs('#themeIcon'); if(s) s.innerHTML = (t==='dark'?iconMoon():iconSun()); }
  function applyTheme(t){ document.documentElement.classList.toggle('dark', t==='dark'); localStorage.setItem(THEME_KEY,t); setThemeIcon(t); }
  function initTheme(){ const saved=localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); applyTheme(saved); }
  onReady(()=> qs('#themeToggle')?.addEventListener('click',()=>{
    const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    applyTheme(cur==='dark'?'light':'dark');
  }));

  // ---------- router ----------
  function views(){ return {
    resumen: qs('#view-resumen'),
    luces: qs('#view-luces'),
    juegos: qs('#view-juegos'),
    acuerdos: qs('#view-acuerdos'),
    metas: qs('#view-metas'),
    ajustes: qs('#view-ajustes'),
  }; }
  function highlightNav(){
    const key=(location.hash||'#/resumen').replace('#/','');
    qsa('#mainNav .nav-link').forEach(a=>{
      const h = a.getAttribute('href').replace('#/','');
      a.classList.toggle('bg-white/10', h===key);
    });
  }
  function showView(name){
    const v=views();
    Object.entries(v).forEach(([k,el])=> $$(el, k===name));
    highlightNav();
    if(name==='resumen') renderResumen();
    if(name==='luces')   renderLightsInit();
    if(name==='ajustes'){ renderContacts(); renderPractices(); }
    if(name==='juegos')  renderGames();
    if(name==='acuerdos') renderAgreements();
    if(name==='metas') renderGoals();
  }
  function parseRoute(){
    if(!location.hash) location.hash='#/resumen';
    const k=(location.hash||'#/resumen').replace('#/','');
    const v=views(); if(!v[k]) return showView('resumen'); showView(k);
  }
  onReady(()=> window.addEventListener('hashchange', parseRoute));

  // ---------- auth ----------
  async function refreshAuthUI(user){
    const logged = !!user;
    $$(qs('#authCard'), !logged);
    $$(qs('#appViews'), logged);
    $$(qs('#mainNav'), logged);
    $$(qs('#authActions'), logged);
    const tip = qs('#userTooltip'); if(tip) tip.title = logged ? (user.email||'') : '';
    if(logged){ if(!location.hash) location.hash='#/resumen'; parseRoute(); }
  }
  function attachLoginHandlers(){
    const form=qs('#loginForm'), btn=qs('#loginBtn');
    if(!form||!btn) return;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email=qs('#emailInput').value.trim(), password=qs('#passwordInput').value;
      if(!email||!password) return toast('Completa email y password','error');
      try{
        btn.disabled=true; btn.textContent='Entrando…';
        const u = await window.NT.auth.signIn(email,password);
        toast('Sesión iniciada','success'); await refreshAuthUI(u);
      }catch(err){ console.error(err); toast(err.message||'No se pudo iniciar','error'); }
      finally{ btn.disabled=false; btn.textContent='Entrar'; }
    });
  }
  onReady(async ()=>{
    initTheme(); attachLoginHandlers();
    window.NT?.auth?.onAuth?.((u)=>refreshAuthUI(u));
    const u = await window.NT?.auth?.getUser()?.catch(()=>null);
    refreshAuthUI(u);
  });
  qs('#logoutBtn')?.addEventListener('click', async ()=>{
    try{ await window.NT.auth.signOut(); location.hash='#/resumen'; location.reload(); }catch{}
  });

  // ---------- flatpickr ----------
  function makeFP(el){ return el && flatpickr(el,{ altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d", defaultDate:new Date(), allowInput:true }); }

  // ---------- RESUMEN ----------
  async function renderResumen(){
    const wrap=qs('#resumeStats'); if(!wrap) return;
    wrap.innerHTML='<div class="text-sm opacity-70">Cargando…</div>';
    try{
      const [agreements, games] = await Promise.all([
        window.NT.agreements.listAgreements({}),
        window.NT.games.listGames()
      ]);

      // días desde reinicio
      const RESTART='2025-09-14';
      const diffDays = Math.floor((Date.now() - new Date(RESTART).getTime())/86400000);

      // juegos / roles
      const eddyActive = games.filter(g=>g.role==='Eddy→Dani').length;
      const daniActive = games.filter(g=>g.role==='Dani→Eddy').length;

      // satisfacción
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth()-1);
      const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
      const avg = (arr)=> arr.length ? arr.reduce((a,b)=>a+(Number(b.satisfaction)||0),0)/arr.length : 0;
      const avgTotal = avg(games);
      const avgMonth = avg(games.filter(g=> new Date(g.played_on)>=monthAgo));
      const avgWeek  = avg(games.filter(g=> new Date(g.played_on)>=weekAgo));

      // acuerdos
      const aprob = agreements.filter(a=>a.status==='Aprobado').length;
      const pend  = agreements.filter(a=>a.status==='Pendiente').length;

      const gauge = (value=7, size=70)=>{
        const pct=Math.max(1,Math.min(10,Number(value)))/10; const r=size/2-8, cx=size/2, cy=size/2, C=2*Math.PI*r, dash=(C*pct).toFixed(1);
        const color=`hsl(${Math.round(120*pct)},70%,45%)`;
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#e5e7eb" stroke-width="9" fill="none"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="9" fill="none" stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
          <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="${size/3.2}" font-weight="700">${(value||0).toFixed(1)}</text>
        </svg>`;
      };

      wrap.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="gs-card p-4 col-span-1 lg:col-span-2 flex items-center justify-between">
            <div>
              <div class="text-xs opacity-70">Días desde reinicio</div>
              <div class="text-4xl font-extrabold text-yellow-400">${diffDays}</div>
              <div class="text-xs opacity-70">Iniciado el 14/09/2025</div>
            </div>
            <div class="text-xs opacity-50">v0.5</div>
          </div>

          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Juegos</div>
            <div class="text-3xl font-bold">${games.length}</div>
            <div class="flex gap-2 mt-2 items-center text-xs">
              <span class="gs-chip text-blue-600 dark:text-blue-300">Eddy activo: ${eddyActive}</span>
              <span class="gs-chip text-indigo-600 dark:text-indigo-300">Dani activo: ${daniActive}</span>
            </div>
          </div>

          <div class="gs-card p-4 flex items-center justify-between">
            <div>
              <div class="text-xs opacity-70">Satisfacción</div>
              <div class="text-xs opacity-70 mt-1">Total · Mes · Semana</div>
            </div>
            <div class="flex gap-2 items-center">
              ${gauge(avgTotal)} ${gauge(avgMonth)} ${gauge(avgWeek)}
            </div>
          </div>

          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Acuerdos</div>
            <div class="flex items-end gap-2 mt-1">
              <div class="text-3xl font-extrabold text-emerald-500">${aprob}</div>
              <div class="text-sm text-red-500">Pend: ${pend}</div>
            </div>
          </div>
        </div>`;
    }catch(e){
      console.error(e); wrap.innerHTML='<div class="text-sm text-red-300">No se pudo cargar</div>';
    }
  }

  // ---------- LUCES ----------
  let fpLight, fpLightsStart;
  const EMOTIONS = [
    'feliz','muy_feliz','emocionado','agradecido','confiado','aliviado',
    'meh','cansado','nervioso',
    'triste','muy_triste','frustrado','estresado','ansioso','furioso'
  ];

  function rangeFrom(type, anchor){
    const d=new Date(anchor);
    if(type==='week'){ const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); }
    else { d.setDate(1); }
    return d.toISOString().slice(0,10);
  }
  const colorDot = (c)=> `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${({Rojo:'#ef4444','Ámbar':'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'})[c]||'#9ca3af'}"></span>`;

  function fillEmotionSelect(sel){
    sel.innerHTML = EMOTIONS.map(e=>`<option value="${e}">${e.replace('_',' ')}</option>`).join('');
  }

  async function renderLightsInit(){
    const typeSel = qs('#lightsRangeType');
    const startInp = qs('#lightsRangeStart');
    const whoSel   = qs('#lightsWho');

    if(fpLightsStart) fpLightsStart.destroy();
    fpLightsStart = flatpickr(startInp, {
      altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d",
      defaultDate: rangeFrom(typeSel.value, new Date()),
      onChange: ()=> renderLights()
    });

    typeSel.onchange = renderLights;
    whoSel.onchange  = renderLights;

    qs('#addLightBtn')?.addEventListener('click',()=> openLightModal());

    await renderLights();
  }

  async function renderLights(){
    const list=qs('#lightsList'); if(!list) return;
    const stats=qs('#lightsStats');
    list.innerHTML='<div class="text-sm opacity-70">Cargando…</div>';
    try{
      const type = qs('#lightsRangeType').value || 'week';
      const start= qs('#lightsRangeStart').value || rangeFrom(type,new Date());
      const dStart=new Date(start), dEnd=new Date(start);
      if(type==='week'){ dEnd.setDate(dStart.getDate()+6); } else { dEnd.setMonth(dStart.getMonth()+1); dEnd.setDate(dEnd.getDate()-1); }
      const who = qs('#lightsWho').value || undefined;

      const items = await window.NT.lights.listLights({
        from: start, to: dEnd.toISOString().slice(0,10), who
      });

      const counts = {Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i=> counts[i.color]=(counts[i.color]||0)+1);
      stats.innerHTML = Object.entries(counts).map(([k,v])=>`
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot(k)} <span>${k}</span></div>
          <div class="text-2xl font-semibold">${v}</div>
        </div>`).join('');

      if(!items.length){ list.innerHTML='<div class="text-sm opacity-70">Sin entradas.</div>'; return; }
      list.innerHTML = items.map(l=>`
        <div class="gs-card p-4">
          <div class="flex items-center justify-between mb-1 text-sm opacity-80">
            <div class="flex items-center gap-2">${colorDot(l.color)} <strong>${esc(l.who)}</strong></div>
            <div>${esc(l.light_on)}</div>
          </div>
          <div class="font-medium">${esc(l.action)}</div>
          <div class="mt-1 text-xs opacity-80">${esc(l.notes||'')}</div>
          <div class="mt-3 flex items-center gap-2 justify-end">
            <button class="gs-btn" data-edit="${l.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 20h4l10-10-4-4L4 16v4Z"/></svg></button>
            <button class="gs-btn" data-del="${l.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b=> b.onclick=()=>{
        const id=b.getAttribute('data-edit'); const it=items.find(x=>x.id===id); openLightModal(it);
      });
      qsa('[data-del]').forEach(b=> b.onclick=async ()=>{
        const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar entrada?')) return;
        try{ await window.NT.lights.deleteLight(id); toast('Eliminada','success'); renderLights(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
      });

    }catch(e){ console.error(e); list.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }

  function openLightModal(item=null){
    const dlg=qs('#lightModal'); if(!dlg) return;
    $$(qs('#deleteLightBtn'), !!item);
    qs('#lightModalTitle').textContent=item?'Editar entrada':'Nueva entrada';
    qs('#lightId').value   = item?.id||'';
    qs('#lightColor').value= item?.color||'Verde';
    qs('#lightWho').value  = item?.who||'Eddy';
    fillEmotionSelect(qs('#lightEmotion'));
    qs('#lightEmotion').value = item?.emotion||'meh';
    qs('#lightAction').value  = item?.action||'';
    qs('#lightNotes').value   = item?.notes||'';
    if(fpLight) fpLight.destroy();
    fpLight = makeFP(qs('#lightDate'));
    if(item?.light_on) fpLight.setDate(item.light_on,true);
    dlg.showModal();
  }
  qs('#closeLightModal')?.addEventListener('click',()=> qs('#lightModal').close());
  qs('#deleteLightBtn')?.addEventListener('click', async ()=>{
    const id=qs('#lightId').value; if(!id) return; if(!confirm('¿Eliminar entrada?')) return;
    try{ await window.NT.lights.deleteLight(id); qs('#lightModal').close(); toast('Eliminada','success'); renderLights(); }
    catch(e){ console.error(e); toast('Error al eliminar','error'); }
  });
  qs('#lightForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const action=qs('#lightAction').value.trim(); if(!action) return toast('Acción es obligatoria','error');
    try{
      const payload = {
        id: qs('#lightId').value || undefined,
        light_on: qs('#lightDate').value,
        color: qs('#lightColor').value,
        who: qs('#lightWho').value,
        action,
        emotion: qs('#lightEmotion').value,
        notes: qs('#lightNotes').value||null
      };
      await window.NT.lights.upsertLight(payload);
      qs('#lightModal').close(); toast('Guardado','success'); renderLights();
    }catch(e){ console.error(e); toast(`Error al guardar: ${e.message}`,'error'); }
  });

  // ---------- AJUSTES: Contactos ----------
  async function renderContacts(){
    const list=qs('#contactsList'); if(!list) return;
    list.innerHTML='<div class="text-sm opacity-70">Cargando…</div>';
    try{
      const status=qs('#filterStatus').value||undefined;
      const items=await window.NT.contacts.listContacts({status});
      if(!items.length){ list.innerHTML='<div class="text-sm opacity-70">Sin contactos.</div>'; return; }
      list.innerHTML = items.map(c=>`
        <div class="gs-card p-4 flex items-start justify-between">
          <div>
            <div class="font-medium">${esc(c.alias?`${c.name} · ${c.alias}`:(c.name||'—'))}</div>
            <div class="text-xs opacity-70">${esc(c.owner||'')} · ${esc(c.category||'')}</div>
            ${c.treatment?`<div class="mt-1 text-xs"><span class="gs-chip">${esc(c.treatment)}</span></div>`:''}
            ${c.notes?`<div class="mt-2 text-xs opacity-80">${esc(c.notes)}</div>`:''}
          </div>
          <div class="flex items-center gap-2">
            <button class="gs-btn" data-del="${c.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12"/></svg></button>
          </div>
        </div>`).join('');
      qsa('#filterStatus')[0]?.addEventListener('change',renderContacts);
      qsa('[data-del]').forEach(b=> b.onclick=async ()=>{
        const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar contacto?')) return;
        try{ await window.NT.contacts.deleteContact(id); toast('Eliminado','success'); renderContacts(); }
        catch(e){ console.error(e); toast('Error al eliminar','error'); }
      });
    }catch(e){ console.error(e); list.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }

  // ---------- AJUSTES: Prácticas ----------
  async function renderPractices(){
    const list=qs('#practicesList'); if(!list) return;
    list.innerHTML='<div class="text-sm opacity-70">Cargando…</div>';
    try{
      const items=await window.NT.practices.listPractices();
      if(!items.length){ list.innerHTML='<div class="text-sm opacity-70">Sin prácticas.</div>'; return; }
      list.innerHTML = items.map(p=>`
        <div class="gs-card p-3 flex items-center justify-between">
          <div><div class="font-medium">${esc(p.label)}</div><div class="text-xs opacity-70">key: ${esc(p.key)} · ${p.active?'Activa':'Inactiva'}</div></div>
          <button class="gs-btn" data-del="${p.key}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12"/></svg></button>
        </div>`).join('');
      qsa('[data-del]').forEach(b=> b.onclick=async ()=>{
        const key=b.getAttribute('data-del'); if(!confirm('¿Eliminar práctica?')) return;
        try{ await window.NT.practices.deletePractice(key); toast('Eliminada','success'); renderPractices(); }
        catch(e){ console.error(e); toast('Error al eliminar','error'); }
      });
    }catch(e){ console.error(e); list.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }
  qs('#addPracticeBtn')?.addEventListener('click', async ()=>{
    const key = prompt('Clave (ej: oral_e2d):'); if(!key) return;
    const label = prompt('Nombre visible:'); if(!label) return;
    try{ await window.NT.practices.upsertPractice({key,label,active:true}); toast('Guardado','success'); renderPractices(); }
    catch(e){ console.error(e); toast('Error al guardar','error'); }
  });

  // ---------- Juegos / Acuerdos / Metas (listas sencillas para no romper) ----------
  async function renderGames(){
    const el=qs('#gamesList'); if(!el) return;
    try{
      const items=await window.NT.games.listGames();
      el.innerHTML = items.length ? items.map(g=>`
        <div class="gs-card p-4 flex items-start justify-between">
          <div><div class="font-medium">${esc(g.kind==='juego'?'Juego':'Mini-juego')} · ${esc(g.promoter)} · ${esc(g.played_on)}</div>
          <div class="text-xs opacity-70">${esc(g.role)} · Condón: ${g.condom?'Sí':'No'} · Satisfacción: ${g.satisfaction||'-'}</div></div>
        </div>`).join('') : '<div class="text-sm opacity-70">Sin juegos.</div>';
    }catch(e){ console.error(e); el.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }
  async function renderAgreements(){
    const el=qs('#agreementsList'); if(!el) return;
    try{
      const items=await window.NT.agreements.listAgreements({});
      el.innerHTML = items.length ? items.map(a=>`
        <div class="gs-card p-4 flex items-start justify-between">
          <div><div class="font-medium">${esc(a.title)}</div>
          <div class="text-xs opacity-70">${esc(a.category_key)} · ${esc(a.promoter)} · ${esc(a.created_on)} · ${esc(a.status)}</div></div>
        </div>`).join('') : '<div class="text-sm opacity-70">Sin acuerdos.</div>';
    }catch(e){ console.error(e); el.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }
  async function renderGoals(){
    const el=qs('#goalsList'); if(!el) return;
    try{
      // Si aún no usas goals desde el front, muestro placeholder
      el.innerHTML = '<div class="text-sm opacity-70">Aún sin metas en UI. (BD OK)</div>';
    }catch(e){ console.error(e); el.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }

  // ---------- arranque ----------
  onReady(()=>{ if(!location.hash) location.hash='#/resumen'; parseRoute(); });
})();
