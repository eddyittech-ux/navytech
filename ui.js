// UI state, router, theming, auth gating, Contactos + Acuerdos + Catálogos
(() => {
  const onReady = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
  const $$  = (el, show=true) => el.classList.toggle('hidden-vis', !show);
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));

  const views = {
    resumen: qs('#view-resumen'),
    acuerdos: qs('#view-acuerdos'),
    metas: qs('#view-metas'),
    luces: qs('#view-luces'),
    juegos: qs('#view-juegos'),
    ajustes: qs('#view-ajustes'),
  };

  const mainNav     = qs('#mainNav');
  const authActions = qs('#authActions');

  // ===== Theme =====
  const THEME_KEY = 'nt-theme';
  function setThemeIcon(theme){
    const icon = qs('#themeIcon'); if (!icon) return;
    icon.innerHTML = theme==='dark'
      ? '<svg class="gs-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
      : '<svg class="gs-icon" viewBox="0 0 24 24" fill="none"><path d="M20 12.5A8 8 0 1 1 11.5 4a6.5 6.5 0 1 0 8.5 8.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function applyTheme(t){ document.documentElement.classList.toggle('dark', t==='dark'); localStorage.setItem(THEME_KEY, t); setThemeIcon(t); }
  function initTheme(){ const saved = localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); applyTheme(saved); }
  onReady(() => { qs('#themeToggle')?.addEventListener('click', () => { const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light'; applyTheme(cur==='dark' ? 'light' : 'dark'); }); });

  // ===== Toasts =====
  function toast(msg, type='info') {
    const host = qs('#toastHost'); const el = document.createElement('div');
    el.className = `gs-card px-4 py-2 text-sm border-l-4 ${type==='error' ? 'border-red-400' : type==='success' ? 'border-emerald-400' : 'border-[#C7A740]'}`;
    el.textContent = msg; host.appendChild(el); setTimeout(()=> el.remove(), 3000);
  }

  // ===== Router =====
  function highlightActiveNav(){ const key = (location.hash || '#/resumen').replace('#/',''); qsa('#mainNav .nav-link').forEach(a=>{ const href=a.getAttribute('href').replace('#/',''); a.classList.toggle('active', href===key); }); }
  function showView(name){ Object.entries(views).forEach(([k,el])=> $$(el, k===name)); if(name==='ajustes'){ renderContacts(); renderAgreCats(); } if(name==='resumen'){ renderResumen(); } if(name==='acuerdos'){ renderAgreements(); } highlightActiveNav(); }
  function parseRoute(){ if(!location.hash) location.hash = '#/resumen'; const key=(location.hash||'#/resumen').replace('#/',''); if(!views[key]) return showView('resumen'); showView(key); }
  window.addEventListener('hashchange', parseRoute);

  // ===== Auth gating =====
  const authCard = qs('#authCard'); const appViews = qs('#appViews');
  async function refreshAuthUI(user){
    const isIn = !!user; $$(authCard, !isIn); $$(appViews, isIn); $$(mainNav, isIn); $$(authActions, isIn);
    const tip = qs('#userTooltip'); if (tip) tip.textContent = isIn ? (user.email || '') : '';
    if (isIn){ if(!location.hash) location.hash='#/resumen'; parseRoute(); }
  }

  // ===== Login/Logout =====
  onReady(() => {
    const loginForm=qs('#loginForm'); const loginBtn=qs('#loginBtn');
    loginForm?.addEventListener('submit', async (e)=>{ e.preventDefault();
      const email=qs('#emailInput').value.trim(); const password=qs('#passwordInput').value;
      if(!window.NT?.auth?.signIn){ toast('Config inválida (NT no inicializado). Revisa ANON KEY/URL.', 'error'); return; }
      if(loginBtn){ loginBtn.disabled=true; loginBtn.style.opacity=.6; loginBtn.textContent='Entrando…'; }
      try{
        const signedUser = await window.NT.auth.signIn(email,password);
        toast('Sesión iniciada','success'); await refreshAuthUI(signedUser);
      }catch(err){ console.error(err); toast(`Login failed: ${err.message||'credenciales inválidas'}`,'error'); }
      finally{ if(loginBtn){ loginBtn.disabled=false; loginBtn.style.opacity=1; loginBtn.textContent='Entrar'; } }
    });
    qs('#logoutBtn')?.addEventListener('click', async ()=>{ await window.NT.auth.signOut(); toast('Sesión cerrada','success'); });
    if (window.NT?.auth?.onAuth) { window.NT.auth.onAuth((user)=>{ refreshAuthUI(user); }); }
  });
  onReady(async ()=>{ initTheme(); if(window.NT?.auth?.getUser){ const u=await window.NT.auth.getUser(); refreshAuthUI(u); } else { refreshAuthUI(null); } });

  // ===== Resumen =====
  async function renderResumen(){
    const wrap=qs('#resumeStats'); if(!window.NT?.contacts?.listContacts){ wrap.innerHTML=`<div class="text-sm text-red-300">Config inválida: NT no listo</div>`; return; }
    wrap.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      const all = await window.NT.contacts.listContacts();
      const total=all.length, bloqueados=all.filter(x=>x.status==='Bloqueado').length, conservados=all.filter(x=>x.status==='Conservado').length;
      wrap.innerHTML = `
        <div class="gs-card p-4"><div class="text-xs opacity-70">Contactos</div><div class="text-3xl font-bold" style="color:#C7A740">${total}</div><div class="text-xs opacity-70 mt-1">Totales</div></div>
        <div class="gs-card p-4"><div class="text-xs opacity-70">Bloqueados</div><div class="text-3xl font-bold">${bloqueados}</div><div class="text-xs opacity-70 mt-1">Estado</div></div>
        <div class="gs-card p-4"><div class="text-xs opacity-70">Conservados</div><div class="text-3xl font-bold">${conservados}</div><div class="text-xs opacity-70 mt-1">Estado</div></div>
      `;
    }catch(e){ console.error(e); wrap.innerHTML=`<div class="text-sm text-red-300">No se pudieron cargar estadísticas</div>`; }
  }

  // ===== Contactos (CRUD) =====
  const filterStatus=qs('#filterStatus'), addFab=qs('#addContactFab'), contactsList=qs('#contactsList');
  const contactModal=qs('#contactModal'), modalTitle=qs('#modalTitle'), deleteBtn=qs('#deleteBtn'), contactForm=qs('#contactForm');
  const idInput=qs('#contactId'), ownerInput=qs('#ownerInput'), nameInput=qs('#nameInput'), aliasInput=qs('#aliasInput'), categoryInput=qs('#categoryInput'), statusInput=qs('#statusInput'), treatmentInput=qs('#treatmentInput'), notesInput=qs('#notesInput');

  filterStatus?.addEventListener('change', renderContacts);
  addFab?.addEventListener('click',()=> openContactModal());

  async function renderContacts(){
    contactsList.innerHTML=`<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      const status=filterStatus.value||undefined; const items=await window.NT.contacts.listContacts({status});
      if(!items.length){ contactsList.innerHTML=`<div class="text-sm opacity-70">Sin contactos.</div>`; return; }
      contactsList.innerHTML = items.map(c=>`
        <div class="gs-card p-4 flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl" style="${c.owner==='Dani'?'background:linear-gradient(135deg,#163054,#334155)':'background:linear-gradient(135deg,#3F3D8F,#334155)'}"></div>
            <div>
              <div class="font-medium">${esc(c.alias?`${c.name} · ${c.alias}`:(c.name||'—'))}</div>
              <div class="text-xs opacity-70">${esc(c.owner||'')} · ${esc(c.category||'')}</div>
              ${c.treatment?`<div class="mt-1 text-xs"><span class="gs-chip">${esc(c.treatment)}</span></div>`:''}
              ${c.notes?`<div class="mt-2 text-xs opacity-80">${esc(c.notes)}</div>`:''}
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${c.status?`<span class="gs-chip">${esc(c.status)}</span>`:''}
            <button class="gs-btn text-xs" data-edit="${c.id}">Editar</button>
            <button class="gs-btn text-xs" data-del="${c.id}">Borrar</button>
          </div>
        </div>`).join('');
      qsa('[data-edit]').forEach(b=> b.addEventListener('click',()=>{ const id=b.getAttribute('data-edit'); const it=items.find(x=>x.id===id); openContactModal(it); }));
      qsa('[data-del]').forEach(b=> b.addEventListener('click',async()=>{ const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar contacto?')) return; try{ await window.NT.contacts.deleteContact(id); toast('Eliminado','success'); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }}));
    }catch(e){ console.error(e); contactsList.innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  function openContactModal(item=null){
    modalTitle.textContent=item?'Editar contacto':'Nuevo contacto'; $$(deleteBtn,!!item);
    idInput.value=item?.id||''; ownerInput.value=item?.owner||'Eddy'; nameInput.value=item?.name||''; aliasInput.value=item?.alias||''; categoryInput.value=item?.category||'Verde'; statusInput.value=item?.status||''; treatmentInput.value=item?.treatment||''; notesInput.value=item?.notes||'';
    contactModal.showModal();
  }
  qs('#closeModal')?.addEventListener('click',()=> contactModal.close());
  deleteBtn?.addEventListener('click', async ()=>{ const id=idInput.value; if(!id) return; if(!confirm('¿Eliminar contacto?')) return; try{ await window.NT.contacts.deleteContact(id); contactModal.close(); toast('Eliminado','success'); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }});
  contactForm?.addEventListener('submit', async (e)=>{ e.preventDefault(); if(!nameInput.value.trim()){ toast('Nombre es obligatorio','error'); return; }
    try{ const payload={ id:idInput.value||undefined, owner:ownerInput.value, name:nameInput.value.trim(), alias:aliasInput.value||null, category:categoryInput.value||null, status:statusInput.value||null, treatment:treatmentInput.value||null, notes:notesInput.value||null };
      await window.NT.contacts.upsertContact(payload); contactModal.close(); toast('Guardado','success'); renderContacts(); renderResumen(); }
    catch(e){ console.error(e); toast(`Error al guardar: ${e.message||'RLS o datos inválidos'}`,'error'); }
  });

  // ===== Acuerdos =====
  const agreFilterStatus = qs('#agreFilterStatus'), addAgreementBtn = qs('#addAgreementBtn'), agreementsList = qs('#agreementsList');
  const agreementModal = qs('#agreementModal'), agreementForm = qs('#agreementForm'), deleteAgreementBtn = qs('#deleteAgreementBtn');
  const agreementModalTitle = qs('#agreementModalTitle');
  const agreementId = qs('#agreementId'), agreementCategory = qs('#agreementCategory'), agreementDate = qs('#agreementDate'), agreementPromoter = qs('#agreementPromoter'), agreementStatusRO = qs('#agreementStatusRO'), agreementTitle = qs('#agreementTitle'), agreementNotes = qs('#agreementNotes'), eddyDecision = qs('#eddyDecision'), daniDecision = qs('#daniDecision');

  agreFilterStatus?.addEventListener('change', renderAgreements);
  addAgreementBtn?.addEventListener('click', async ()=>{ await loadAgreementCategories(true); openAgreementModal(); });

  async function loadAgreementCategories(onlyActive=false){
    const cats = await window.NT.agreCats.listAgreementCategories({onlyActive});
    agreementCategory.innerHTML = cats.map(c=>`<option value="${esc(c.key)}">${esc(c.label)}</option>`).join('');
  }

  function computeStatus(edd='none', dan='none'){
    if(edd==='approve' && dan==='approve') return 'Aprobado';
    if(edd==='reject'  && dan==='reject')  return 'Rechazado';
    if(edd==='reject'  || dan==='reject')  return 'Pendiente';
    return 'Pendiente';
  }

  async function renderAgreements(){
    agreementsList.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      const status = agreFilterStatus.value || undefined;
      const items = await window.NT.agreements.listAgreements({ status });
      if(!items.length){ agreementsList.innerHTML = `<div class="text-sm opacity-70">Sin acuerdos.</div>`; return; }
      agreementsList.innerHTML = items.map(a=>`
        <div class="gs-card p-4 flex items-start justify-between">
          <div>
            <div class="font-medium">${esc(a.title)}</div>
            <div class="text-xs opacity-70">${esc(a.category_key)} · ${esc(a.promoter)} · ${esc(a.created_on)}</div>
            ${a.notes?`<div class="mt-1 text-xs opacity-80">${esc(a.notes)}</div>`:''}
            <div class="mt-2 flex gap-2 text-xs">
              <span class="gs-chip">Eddy: ${esc(a.eddy_decision)}</span>
              <span class="gs-chip">Dani: ${esc(a.dani_decision)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="gs-chip">${esc(a.status)}</span>
            <button class="gs-btn text-xs" data-edit-agre="${a.id}">Editar</button>
            <button class="gs-btn text-xs" data-del-agre="${a.id}">Borrar</button>
          </div>
        </div>`).join('');
      qsa('[data-edit-agre]').forEach(b=> b.addEventListener('click', async ()=>{
        const id=b.getAttribute('data-edit-agre'); const it = items.find(x=>x.id===id); await loadAgreementCategories(false); openAgreementModal(it);
      }));
      qsa('[data-del-agre]').forEach(b=> b.addEventListener('click', async ()=>{
        const id=b.getAttribute('data-del-agre'); if(!confirm('¿Eliminar acuerdo?')) return;
        try{ await window.NT.agreements.deleteAgreement(id); toast('Eliminado','success'); renderAgreements(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
      }));
    }catch(e){ console.error(e); agreementsList.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  function openAgreementModal(item=null){
    agreementModalTitle.textContent = item ? 'Editar acuerdo' : 'Nuevo acuerdo';
    $$(deleteAgreementBtn, !!item);
    agreementId.value = item?.id || '';
    agreementCategory.value = item?.category_key || agreementCategory.value;
    agreementDate.value = item?.created_on || new Date().toISOString().slice(0,10);
    agreementPromoter.value = item?.promoter || 'Ambos';
    agreementTitle.value = item?.title || '';
    agreementNotes.value = item?.notes || '';
    eddyDecision.value = item?.eddy_decision || 'none';
    daniDecision.value = item?.dani_decision || 'none';
    agreementStatusRO.value = computeStatus(eddyDecision.value, daniDecision.value);
    agreementModal.showModal();
  }
  qs('#closeAgreementModal')?.addEventListener('click',()=> agreementModal.close());
  eddyDecision?.addEventListener('change', ()=> agreementStatusRO.value = computeStatus(eddyDecision.value, daniDecision.value));
  daniDecision?.addEventListener('change', ()=> agreementStatusRO.value = computeStatus(eddyDecision.value, daniDecision.value));

  deleteAgreementBtn?.addEventListener('click', async ()=>{
    const id=agreementId.value; if(!id) return; if(!confirm('¿Eliminar acuerdo?')) return;
    try{ await window.NT.agreements.deleteAgreement(id); agreementModal.close(); toast('Eliminado','success'); renderAgreements(); }
    catch(e){ console.error(e); toast('Error al eliminar','error'); }
  });

  agreementForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!agreementTitle.value.trim()){ toast('El acuerdo necesita un título','error'); return; }
    try{
      const payload = {
        id: agreementId.value || undefined,
        category_key: agreementCategory.value,
        title: agreementTitle.value.trim(),
        notes: agreementNotes.value || null,
        created_on: agreementDate.value,
        promoter: agreementPromoter.value,
        eddy_decision: eddyDecision.value,
        dani_decision: daniDecision.value
      };
      await window.NT.agreements.upsertAgreement(payload);
      agreementModal.close(); toast('Guardado','success'); renderAgreements();
    }catch(e){ console.error(e); toast(`Error al guardar: ${e.message||'RLS o datos inválidos'}`,'error'); }
  });

  // ===== Categorías de Acuerdos (CRUD) =====
  const agreCatsList = qs('#agreCatsList'), addAgreCatBtn = qs('#addAgreCatBtn');
  const agreCatModal = qs('#agreCatModal'), agreCatForm = qs('#agreCatForm'), deleteAgreCatBtn = qs('#deleteAgreCatBtn');
  const agreCatTitle = qs('#agreCatTitle'), agreCatKey = qs('#agreCatKey'), agreCatKeyInput = qs('#agreCatKeyInput'), agreCatLabelInput = qs('#agreCatLabelInput'), agreCatActiveInput = qs('#agreCatActiveInput');

  addAgreCatBtn?.addEventListener('click', ()=> openAgreCatModal());

  async function renderAgreCats(){
    agreCatsList.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try{
      const cats = await window.NT.agreCats.listAgreementCategories();
      if(!cats.length){ agreCatsList.innerHTML = `<div class="text-sm opacity-70">Sin categorías.</div>`; return; }
      agreCatsList.innerHTML = cats.map(c=>`
        <div class="gs-card p-4 flex items-center justify-between">
          <div><div class="font-medium">${esc(c.label)}</div><div class="text-xs opacity-70">key: ${esc(c.key)} · ${c.active?'Activa':'Inactiva'}</div></div>
          <div class="flex gap-2">
            <button class="gs-btn text-xs" data-edit-cat="${c.key}">Editar</button>
            <button class="gs-btn text-xs" data-del-cat="${c.key}">Borrar</button>
          </div>
        </div>`).join('');
      qsa('[data-edit-cat]').forEach(b=> b.addEventListener('click', ()=>{
        const key=b.getAttribute('data-edit-cat'); const it=cats.find(x=>x.key===key); openAgreCatModal(it);
      }));
      qsa('[data-del-cat]').forEach(b=> b.addEventListener('click', async ()=>{
        const key=b.getAttribute('data-del-cat'); if(!confirm('¿Eliminar categoría?')) return;
        try{ await window.NT.agreCats.deleteAgreementCategory(key); toast('Eliminada','success'); renderAgreCats(); }
        catch(e){ console.error(e); toast('Error al eliminar','error'); }
      }));
    }catch(e){ console.error(e); agreCatsList.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  function openAgreCatModal(item=null){
    agreCatTitle.textContent = item ? 'Editar categoría' : 'Nueva categoría';
    $$(deleteAgreCatBtn, !!item);
    agreCatKey.value = item?.key || '';
    agreCatKeyInput.value = item?.key || '';
    agreCatKeyInput.disabled = !!item; // clave no editable en update
    agreCatLabelInput.value = item?.label || '';
    agreCatActiveInput.value = String(item?.active ?? true);
    agreCatModal.showModal();
  }
  qs('#closeAgreCatModal')?.addEventListener('click',()=> agreCatModal.close());
  deleteAgreCatBtn?.addEventListener('click', async ()=>{
    const key=agreCatKey.value; if(!key) return; if(!confirm('¿Eliminar categoría?')) return;
    try{ await window.NT.agreCats.deleteAgreementCategory(key); agreCatModal.close(); toast('Eliminada','success'); renderAgreCats(); }
    catch(e){ console.error(e); toast('Error al eliminar','error'); }
  });
  agreCatForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const key = (agreCatKeyInput.value||'').trim(); const label=(agreCatLabelInput.value||'').trim(); const active=(agreCatActiveInput.value==='true');
    if(!key || !label){ toast('Clave y Nombre son obligatorios','error'); return; }
    try{ await window.NT.agreCats.upsertAgreementCategory({key,label,active}); agreCatModal.close(); toast('Guardado','success'); renderAgreCats(); }
    catch(e){ console.error(e); toast(`Error al guardar: ${e.message||'RLS o datos inválidos'}`,'error'); }
  });
})();
