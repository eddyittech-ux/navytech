// sections/luces.js — v0.7 (sin modal duplicado)
(() => {
  if (window.__NT_LUCES_ONCE) return;
  window.__NT_LUCES_ONCE = true;

  const qs  = (s,el=document)=>el.querySelector(s);
  const qsa = (s,el=document)=>[...el.querySelectorAll(s)];
  const esc = (s='')=>String(s).replace(/[&<>"'`=\/]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));
  const toast = (m,t='info')=>{
    const el=document.createElement('div');
    el.className=`fixed right-4 bottom-4 gs-card px-4 py-2 text-sm border-l-4 ${t==='error'?'border-red-400':t==='success'?'border-emerald-400':'border-[#C7A740]'}`;
    el.textContent=m; document.body.appendChild(el); setTimeout(()=>el.remove(),2800);
  };

  let emotions=[], fp=null, currentId=null, saving=false;

  const colorDot = (c)=>{
    const map={Rojo:'#ef4444','Ámbar':'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'};
    return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${map[c]||'#9ca3af'}"></span>`;
  };
  const labelForEmotion = k => emotions.find(e=>e.key===k)?.label || k;

  async function loadEmotions(){
    try{ emotions = await NT.lightEmotions.list(); }
    catch{ emotions = []; }
  }

  function calcRange(){
    const tSel = qs('#lightsRangeType');
    const mode = (tSel?.value?.toLowerCase()==='mes') ? 'month' : 'week';
    const anchor = qs('#lightsRangeStart')?.value || new Date().toISOString().slice(0,10);
    const d0 = new Date(anchor), d1 = new Date(anchor);
    if (mode==='week'){ const w=(d0.getDay()+6)%7; d0.setDate(d0.getDate()-w); d1.setDate(d0.getDate()+6); }
    else { d0.setDate(1); d1.setMonth(d0.getMonth()+1); d1.setDate(0); }
    return { from: d0.toISOString().slice(0,10), to: d1.toISOString().slice(0,10) };
  }

  async function render(){
    const list = qs('#lightsList'); if(!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    const { from, to } = calcRange();
    const whoFilter = (qs('#lightsWho')?.value || 'Todos');
    try{
      let items = await NT.lights.listLights({ from, to });
      if (whoFilter !== 'Todos') items = items.filter(i=>i.who===whoFilter);

      // Stats
      const stats = {Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i => stats[i.color] = (stats[i.color]||0)+1);
      const statsWrap = qs('#lightsStats');
      if (statsWrap){
        statsWrap.innerHTML = Object.entries(stats).map(([k,v])=>`
          <div class="gs-card p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">${colorDot(k)}<span>${k}</span></div>
            <div class="text-2xl font-semibold">${v}</div>
          </div>`).join('');
      }

      if(!items.length){ list.innerHTML = `<div class="text-sm opacity-70">Sin entradas.</div>`; return; }

      list.innerHTML = items.map(l=>`
        <div class="gs-card p-4">
          <div class="flex items-center justify-between mb-1 text-sm opacity-80">
            <div class="flex items-center gap-2">${colorDot(l.color)} <strong>${esc(l.who)}</strong></div>
            <div>${esc(l.light_on)}</div>
          </div>
          <div class="font-medium">${esc(l.action||'—')}</div>
          <div class="mt-1 text-xs opacity-80">${labelForEmotion(l.emotion)} ${l.notes?`· ${esc(l.notes)}`:''}</div>
          <div class="mt-3 flex items-center gap-2 justify-end">
            <button class="gs-btn" data-edit="${l.id}" title="Editar">Editar</button>
            <button class="gs-btn danger" data-del="${l.id}" title="Borrar">Borrar</button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b=>b.addEventListener('click',()=>{
        const it = items.find(x=>x.id===b.getAttribute('data-edit')); openModal(it);
      }));
      qsa('[data-del]').forEach(b=>b.addEventListener('click', async()=>{
        if(!confirm('¿Eliminar entrada?')) return;
        await NT.lights.deleteLight(b.getAttribute('data-del')); toast('Eliminada','success'); render();
      }));
    }catch(e){ console.error(e); list.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`; }
  }

  async function openModal(item=null){
    await loadEmotions();
    currentId = item?.id || null;

    const dlg = qs('#lightModal'); if(!dlg) return;
    qs('#lightModalTitle').textContent = currentId ? 'Editar entrada' : 'Nueva entrada';
    qs('#deleteLightBtn')?.classList.toggle('hidden-vis', !currentId);

    const emoSel = qs('#lightEmotion');
    emoSel.innerHTML = emotions.map(e=>`<option value="${e.key}">${e.label}</option>`).join('');

    qs('#lightColor').value  = item?.color || 'Verde';
    qs('#lightWho').value    = item?.who || 'Eddy';
    qs('#lightEmotion').value= item?.emotion || emotions[0]?.key || '';
    qs('#lightAction').value = item?.action || '';
    qs('#lightNotes').value  = item?.notes || '';

    const inp = qs('#lightDate');
    inp.value = item?.light_on || new Date().toISOString().slice(0,10);
    if (fp) { try{ fp.destroy(); }catch{} }
    fp = flatpickr(inp, { altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d", defaultDate:inp.value, appendTo:document.body });

    dlg.showModal();
  }

  async function save(e){
    e?.preventDefault?.();
    if (saving) return;
    saving = true;

    const payload = {
      id: currentId || undefined,
      light_on: qs('#lightDate').value,
      color:    qs('#lightColor').value,
      who:      qs('#lightWho').value,
      emotion:  qs('#lightEmotion').value,
      action:   qs('#lightAction').value.trim(),
      notes:    qs('#lightNotes').value || null
    };
    if (!payload.action){ toast('Acción es obligatoria','error'); saving=false; return; }

    try{
      await NT.lights.upsertLight(payload);
      qs('#lightModal').close();
      toast('Guardado','success');
      render();
    }catch(err){ console.error(err); toast('Error al guardar','error'); }
    finally{ saving=false; }
  }

  function bind(){
    qs('#addLightBtn')?.addEventListener('click', ()=> openModal());
    qs('#closeLightModal')?.addEventListener('click', ()=> qs('#lightModal')?.close());
    qs('#deleteLightBtn')?.addEventListener('click', async ()=>{
      if(!currentId || !confirm('¿Eliminar entrada?')) return;
      await NT.lights.deleteLight(currentId); qs('#lightModal').close(); toast('Eliminada','success'); render();
    });
    qs('#lightForm')?.addEventListener('submit', save);
    qs('#lightsRangeType')?.addEventListener('change', render);
    qs('#lightsRangeStart')?.addEventListener('change', render);
    qs('#lightsWho')?.addEventListener('change', render);
  }

  function init(){
    if (!qs('#view-luces')) return;
    bind(); render();
  }

  window.addEventListener('hashchange', ()=>{
    if ((location.hash||'#/resumen').includes('#/luces')) init();
  });
  document.addEventListener('DOMContentLoaded', init);
})();
