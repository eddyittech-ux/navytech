// sections/luces.js
(() => {
  const { qs, qsa, $$, toast } = NT.ui;

  const colorDot = (c) => {
    const map={Rojo:'#ef4444','Ámbar':'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'};
    const k = map[c] || '#9ca3af';
    return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${k}"></span>`;
  };

  // mapa iconos (simple pero claro)
  const emoIcon = (key) => {
    const base='currentColor';
    const faces = {
      feliz:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      meh:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      triste:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      furioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 9l2-2M16 9l-2-2" stroke="${base}" stroke-width="1.6"/><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="${base}" stroke-width="1.6"/>`,
      cansado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10h2M14 10h2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      estresado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M7 16h10" stroke="${base}" stroke-width="1.6" stroke-dasharray="2 2"/>`,
      ansioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1" fill="${base}"/><circle cx="15" cy="12" r="1" fill="${base}"/><path d="M8 16h8" stroke="${base}" stroke-width="1.6" stroke-dasharray="1 2"/>`,
      muy_feliz:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M7.5 14c2.5 3 6.5 3 9 0" stroke="${base}" stroke-width="1.6"/>`,
    };
    const svg = faces[key] || faces.meh;
    return `<svg class="icon-sm" viewBox="0 0 24 24" fill="none">${svg}</svg>`;
  };

  const rangeFrom = (type, anchor) => {
    const d = new Date(anchor);
    if (type === 'week') { const wd=((d.getDay()+6)%7); d.setDate(d.getDate()-wd); }
    else { d.setDate(1); }
    return d.toISOString().slice(0,10);
  };

  let fpStart, fpLight;

  async function renderLights(){
    const list = qs('#lightsList'); if (!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      const type = qs('#lightsRangeType').value || 'week';
      const start = qs('#lightsRangeStart').value || rangeFrom(type, new Date());
      const who = qs('#lightsFilterWho').value || '';
      const dStart = new Date(start), dEnd = new Date(start);
      if (type==='week'){ dEnd.setDate(dStart.getDate()+6); } else { dEnd.setMonth(dStart.getMonth()+1); dEnd.setDate(0); }

      const items = await NT.lights.list({ from: start, to: dEnd.toISOString().slice(0,10), who: who || undefined });

      // totales
      const counts={Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i => counts[i.color]=(counts[i.color]||0)+1);
      qs('#lightsStats').innerHTML = Object.entries(counts).map(([k,v]) => `
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot(k)} <span>${k}</span></div>
          <div class="text-2xl font-semibold">${v}</div>
        </div>`).join('');

      if(!items.length){ list.innerHTML = `<div class="text-sm opacity-70">Sin entradas.</div>`; return; }

      list.innerHTML = items.map(l=>`
        <div class="gs-card p-4">
          <div class="flex items-center justify-between mb-1 text-sm opacity-80">
            <div class="flex items-center gap-2">${colorDot(l.color)} <strong>${l.who}</strong></div>
            <div>${l.light_on}</div>
          </div>
          <div class="font-medium">${l.action||'—'}</div>
          <div class="mt-1 text-xs opacity-80 flex items-center gap-2">
            <span>${l.who==='Eddy'?'Dani':'Eddy'}</span> ·
            <span class="inline-flex items-center gap-1">${emoIcon(l.emotion)} <span>${l.emotion}</span></span>
          </div>
          ${l.notes?`<div class="mt-2 text-xs opacity-80">${l.notes}</div>`:''}
          <div class="mt-3 flex items-center gap-2 justify-end">
            <button class="gs-btn" data-edit="${l.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6"/></svg></button>
            <button class="gs-btn" data-del="${l.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b => b.addEventListener('click', () => {
        const id = b.getAttribute('data-edit'); const it = items.find(x=>x.id===id); openLightModal(it);
      }));
      qsa('[data-del]').forEach(b => b.addEventListener('click', async () => {
        const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar entrada?')) return;
        try{ await NT.lights.delete(id); toast('Eliminada','success'); renderLights(); } catch(e){ console.error(e); toast('Error al eliminar','error'); }
      }));
    }catch(e){ console.error(e); qs('#lightsList').innerHTML=`<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  function openLightModal(item=null){
    const dlg = qs('#lightModal'); if(!dlg) return;
    $$ (qs('#deleteLightBtn'), !!item);
    qs('#lightModalTitle').textContent = item?'Editar entrada':'Nueva entrada';
    qs('#lightId').value = item?.id || '';
    qs('#lightColor').value = item?.color || 'Verde';
    qs('#lightWho').value = item?.who || 'Eddy';
    qs('#lightAction').value = item?.action || '';
    qs('#lightNotes').value = item?.notes || '';
    dlg.showModal();

    if (fpLight) fpLight.destroy();
    fpLight = flatpickr('#lightDate',{ altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d", defaultDate: item?.light_on || new Date(), allowInput:true });

    // emociones
    NT.lightEmotions.list().then(list=>{
      const sel = qs('#lightEmotion'); sel.innerHTML = list.map(e=>`<option value="${e.key}">${e.key}</option>`).join('');
      sel.value = item?.emotion || list?.[0]?.key || 'meh';
    });
  }

  function rangeInit(){
    if (fpStart) fpStart.destroy();
    const typ = qs('#lightsRangeType').value || 'week';
    fpStart = flatpickr('#lightsRangeStart',{ altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d", defaultDate: rangeFrom(typ, new Date()), allowInput:true, onChange: renderLights });
  }

  // eventos UI
  function bind(){
    qs('#addLightBtn')?.addEventListener('click', ()=> openLightModal());
    qs('#closeLightModal')?.addEventListener('click', ()=> qs('#lightModal')?.close());
    qs('#deleteLightBtn')?.addEventListener('click', async ()=> {
      const id = qs('#lightId').value; if(!id) return; if(!confirm('¿Eliminar entrada?')) return;
      try{ await NT.lights.delete(id); qs('#lightModal').close(); toast('Eliminada','success'); renderLights(); }catch(e){ console.error(e); toast('Error al eliminar','error'); }
    });
    qs('#lightForm')?.addEventListener('submit', async (e)=> {
      e.preventDefault();
      const payload = {
        id: qs('#lightId').value || undefined,
        light_on: qs('#lightDate').value,
        color: qs('#lightColor').value,
        who: qs('#lightWho').value,
        action: qs('#lightAction').value.trim(),
        emotion: qs('#lightEmotion').value,
        notes: qs('#lightNotes').value || null
      };
      if (!payload.action) return toast('Acción es obligatoria','error');
      try{ await NT.lights.upsert(payload); qs('#lightModal').close(); toast('Guardado','success'); renderLights(); }catch(e){ console.error(e); toast('Error al guardar','error'); }
    });
    qs('#lightsRangeType')?.addEventListener('change', ()=> { rangeInit(); renderLights(); });
    qs('#lightsFilterWho')?.addEventListener('change', renderLights);
  }

  async function init(){
    rangeInit();
    bind();
    await renderLights();
  }

  window.NT.sections.luces = { init };
})();
