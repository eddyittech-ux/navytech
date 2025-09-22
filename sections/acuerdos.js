// sections/acuerdos.js
(() => {
  const { qs, qsa, $$, toast } = NT.ui;
  let fpAg;

  function computeStatus(e='none', d='none'){
    if (e==='approve' && d==='approve') return 'Aprobado';
    if (e==='reject'  && d==='reject')  return 'Rechazado';
    if (e==='reject'  || d==='reject')  return 'Pendiente';
    return 'Pendiente';
  }

  async function loadCats(){
    const sel = qs('#agreementCategory');
    const cats = await NT.agreCats.list();
    sel.innerHTML = cats.map(c=>`<option value="${c.key}">${c.label}</option>`).join('');
  }

  function openModal(item=null){
    const dlg = qs('#agreementModal'); if(!dlg) return;
    $$(qs('#deleteAgreementBtn'), !!item);
    qs('#agreementModalTitle').textContent = item?'Editar acuerdo':'Nuevo acuerdo';
    qs('#agreementId').value = item?.id || '';
    qs('#agreementTitle').value = item?.title || '';
    qs('#agreementNotes').value = item?.notes || '';
    qs('#agreementPromoter').value = item?.promoter || 'Ambos';
    qs('#eddyDecision').value = item?.eddy_decision || 'none';
    qs('#daniDecision').value = item?.dani_decision || 'none';
    qs('#agreementStatusRO').value = computeStatus(qs('#eddyDecision').value, qs('#daniDecision').value);
    dlg.showModal();

    if (fpAg) fpAg.destroy();
    fpAg = flatpickr('#agreementDate',{ altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d", defaultDate: item?.created_on || new Date(), allowInput:true });
  }

  function bindModal(){
    qs('#closeAgreementModal')?.addEventListener('click', ()=> qs('#agreementModal')?.close());
    qs('#eddyDecision')?.addEventListener('change', ()=> qs('#agreementStatusRO').value = computeStatus(qs('#eddyDecision').value, qs('#daniDecision').value));
    qs('#daniDecision')?.addEventListener('change', ()=> qs('#agreementStatusRO').value = computeStatus(qs('#eddyDecision').value, qs('#daniDecision').value));
    qs('#deleteAgreementBtn')?.addEventListener('click', async ()=> {
      const id = qs('#agreementId').value; if(!id) return; if(!confirm('¿Eliminar acuerdo?')) return;
      try{ await NT.agreements.delete(id); qs('#agreementModal').close(); toast('Eliminado','success'); render(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
    });
    qs('#agreementForm')?.addEventListener('submit', async (e)=> {
      e.preventDefault();
      const payload = {
        id: qs('#agreementId').value || undefined,
        category_key: qs('#agreementCategory').value,
        title: qs('#agreementTitle').value.trim(),
        notes: qs('#agreementNotes').value || null,
        created_on: qs('#agreementDate').value,
        promoter: qs('#agreementPromoter').value,
        eddy_decision: qs('#eddyDecision').value,
        dani_decision: qs('#daniDecision').value,
        status: computeStatus(qs('#eddyDecision').value, qs('#daniDecision').value),
      };
      if (!payload.title) return toast('El acuerdo necesita un título','error');
      try{ await NT.agreements.upsert(payload); qs('#agreementModal').close(); toast('Guardado','success'); render(); }catch(e){ console.error(e); toast('Error al guardar','error'); }
    });
  }

  async function render(){
    const wrap = qs('#agreementsList'); if (!wrap) return;
    wrap.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      await loadCats();
      const items = await NT.agreements.list();
      if (!items.length){ wrap.innerHTML = `<div class="text-sm opacity-70">Sin acuerdos.</div>`; return; }
      wrap.innerHTML = items.map(a => `
        <div class="gs-card p-4 flex items-start justify-between">
          <div>
            <div class="font-medium">${a.title}</div>
            <div class="text-xs opacity-70">${a.category_key} · ${a.promoter} · ${a.created_on}</div>
            ${a.notes?`<div class="mt-1 text-xs opacity-80">${a.notes}</div>`:''}
            <div class="mt-2 flex gap-2 text-xs">
              <span class="gs-chip">Eddy: ${a.eddy_decision}</span>
              <span class="gs-chip">Dani: ${a.dani_decision}</span>
              <span class="gs-chip">${a.status}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="gs-btn" data-edit="${a.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6"/></svg></button>
            <button class="gs-btn" data-del="${a.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b => b.addEventListener('click', async () => {
        const id = b.getAttribute('data-edit');
        const it = items.find(x=>x.id===id);
        openModal(it);
      }));
      qsa('[data-del]').forEach(b => b.addEventListener('click', async () => {
        const id = b.getAttribute('data-del'); if(!confirm('¿Eliminar acuerdo?')) return;
        try{ await NT.agreements.delete(id); toast('Eliminado','success'); render(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
      }));
    }catch(e){ console.error(e); wrap.innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  qs('#addAgreementBtn')?.addEventListener('click', async ()=> { await loadCats(); openModal(); });
  bindModal();

  window.NT.sections.acuerdos = { render };
})();
