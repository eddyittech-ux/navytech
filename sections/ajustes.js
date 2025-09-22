// sections/ajustes.js
(() => {
  const { qs, qsa, $$, toast } = NT.ui;

  // Contactos
  async function renderContacts(){
    const list = qs('#contactsList'); if (!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      const status = qs('#filterStatus').value || undefined;
      const items = await NT.contacts.list({status});
      if (!items.length){ list.innerHTML = `<div class="text-sm opacity-70">Sin contactos.</div>`; return; }
      list.innerHTML = items.map(c => `
        <div class="gs-card p-4 flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl" style="${c.owner==='Dani'?'background:linear-gradient(135deg,#163054,#334155)':'background:linear-gradient(135deg,#3F3D8F,#334155)'}"></div>
            <div>
              <div class="font-medium">${c.alias?`${c.name} · ${c.alias}`:(c.name||'—')}</div>
              <div class="text-xs opacity-70">${c.owner||''} · ${c.category||''}</div>
              ${c.treatment?`<div class="mt-1 text-xs"><span class="gs-chip">${c.treatment}</span></div>`:''}
              ${c.notes?`<div class="mt-2 text-xs opacity-80">${c.notes}</div>`:''}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="gs-btn" data-edit="${c.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6"/></svg></button>
            <button class="gs-btn" data-del="${c.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b => b.addEventListener('click', () => {
        const it = items.find(x=>x.id===b.getAttribute('data-edit')); openContactModal(it);
      }));
      qsa('[data-del]').forEach(b => b.addEventListener('click', async () => {
        const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar contacto?')) return;
        try{ await NT.contacts.delete(id); toast('Eliminado','success'); renderContacts(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
      }));
    }catch(e){ console.error(e); list.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`; }
  }
  function openContactModal(item=null){
    const dlg = qs('#contactModal'); if (!dlg) return;
    $$(qs('#deleteBtn'), !!item);
    qs('#modalTitle').textContent = item?'Editar contacto':'Nuevo contacto';
    qs('#contactId').value = item?.id || '';
    qs('#ownerInput').value = item?.owner || 'Eddy';
    qs('#nameInput').value = item?.name || '';
    qs('#aliasInput').value = item?.alias || '';
    qs('#categoryInput').value = item?.category || 'Verde';
    qs('#statusInput').value = item?.status || '';
    qs('#treatmentInput').value = item?.treatment || '';
    qs('#notesInput').value = item?.notes || '';
    dlg.showModal();
  }
  qs('#addContactFab')?.addEventListener('click', ()=> openContactModal());
  qs('#closeModal')?.addEventListener('click', ()=> qs('#contactModal')?.close());
  qs('#deleteBtn')?.addEventListener('click', async ()=> {
    const id = qs('#contactId').value; if(!id) return; if(!confirm('¿Eliminar contacto?')) return;
    try{ await NT.contacts.delete(id); qs('#contactModal').close(); toast('Eliminado','success'); renderContacts(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
  });
  qs('#contactForm')?.addEventListener('submit', async (e)=> {
    e.preventDefault();
    const payload = {
      id: qs('#contactId').value || undefined,
      owner: qs('#ownerInput').value,
      name: qs('#nameInput').value.trim(),
      alias: qs('#aliasInput').value || null,
      category: qs('#categoryInput').value || null,
      status: qs('#statusInput').value || null,
      treatment: qs('#treatmentInput').value || null,
      notes: qs('#notesInput').value || null
    };
    if (!payload.name) return toast('Nombre es obligatorio','error');
    try{ await NT.contacts.upsert(payload); qs('#contactModal').close(); toast('Guardado','success'); renderContacts(); }catch(e){ console.error(e); toast('Error al guardar','error'); }
  });
  qs('#filterStatus')?.addEventListener('change', renderContacts);

  // Prácticas
  async function renderPractices(){
    const list = qs('#practicesList'); if (!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      const items = await NT.practices.list();
      if (!items.length){ list.innerHTML = `<div class="text-sm opacity-70">Sin prácticas.</div>`; return; }
      list.innerHTML = items.map(p=>`
        <div class="gs-card p-4 flex items-center justify-between">
          <div>
            <div class="font-medium">${p.label}</div>
            <div class="text-xs opacity-70">key: ${p.key}</div>
          </div>
          <div class="flex gap-2">
            <button class="gs-btn" data-edit="${p.key}"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6"/></svg></button>
            <button class="gs-btn" data-del="${p.key}"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b => b.addEventListener('click', async ()=>{
        const key = b.getAttribute('data-edit');
        const it = items.find(x=>x.key===key);
        const label = prompt('Nombre visible:', it?.label || '');
        if (!label) return;
        await NT.practices.upsert({ key, label });
        toast('Guardado','success'); renderPractices();
      }));
      qsa('[data-del]').forEach(b => b.addEventListener('click', async ()=>{
        const key = b.getAttribute('data-del'); if(!confirm('¿Eliminar práctica?')) return;
        await NT.practices.delete(key); toast('Eliminada','success'); renderPractices();
      }));
    }catch(e){ console.error(e); list.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`; }
  }
  qs('#addPracticeBtn')?.addEventListener('click', async ()=>{
    const key = prompt('Clave (ej: oral_e2d):'); if(!key) return;
    const label = prompt('Nombre visible:'); if(!label) return;
    try{ await NT.practices.upsert({ key, label }); toast('Guardado','success'); renderPractices(); }catch(e){ console.error(e); toast('Error','error'); }
  });

  window.NT.sections.ajustes = { renderContacts, renderPractices };
})();
