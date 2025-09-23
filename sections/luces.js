// section/luces.js — v1.2 anti-dobles
(() => {
  if (window.__NT_LUCES_ONCE) return;          // ⬅️ evita ejecutar el módulo dos veces
  window.__NT_LUCES_ONCE = true;

  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));
  const show= (el,v=true)=> el&&el.classList.toggle('hidden-vis',!v);
  const toISO = (d)=> new Date(d).toISOString().slice(0,10);
  const colorHex = {Rojo:'#ef4444','Ámbar':'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'};

  const supa = window.NT?._supa || window.NT?.sb; // fallback

  function colorDot(c){ const col=colorHex[c]||'#9ca3af'; return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${col}"></span>`; }
  const emoIcon = (key) => {
    const base='currentColor';
    const faces = {
      feliz:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      muy_feliz:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M7.5 14c2.5 3 6.5 3 9 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      emocionado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 14c2 2 4 2 8 0" stroke="${base}" stroke-width="1.6"/><path d="M12 6v2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      agradecido:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 15c2 1 6 1 8 0" stroke="${base}" stroke-width="1.6"/><path d="M7 7l2 2M17 7l-2 2" stroke="${base}" stroke-width="1.6"/>`,
      confiado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6"/><path d="M7 7l2 2" stroke="${base}" stroke-width="1.6"/>`,
      aliviado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M9 10l-1 1M16 10l-1 1" stroke="${base}" stroke-width="1.6"/><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="${base}" stroke-width="1.6"/>`,
      meh:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      cansado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10h2M14 10h2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      nervioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10l1 1M16 10l-1 1" stroke="${base}" stroke-width="1.6"/><path d="M8 16c2 0 6 0 8 0" stroke="${base}" stroke-width="1.6" stroke-dasharray="3 2"/>`,
      triste:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      muy_triste:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M7.5 17c2.5-3 6.5-3 9 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
      frustrado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10l2-1M16 10l-2-1" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 16l8-1" stroke="${base}" stroke-width="1.6" />`,
      estresado:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 10l2 1M14 11l2-1" stroke="${base}" stroke-width="1.6"/><path d="M7 16h10" stroke="${base}" stroke-width="1.6" stroke-dasharray="2 2"/>`,
      ansioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1" fill="${base}"/><circle cx="15" cy="12" r="1" fill="${base}"/><path d="M8 16h8" stroke="${base}" stroke-width="1.6" stroke-dasharray="1 2"/>`,
      furioso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 9l2-2M16 9l-2-2" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/>`,
    };
    const svg = faces[key] || faces.meh;
    return `<svg class="icon-sm" viewBox="0 0 24 24" fill="none">${svg}</svg>`;
  };
  const opposite = (w)=> w==='Eddy'?'Dani':'Eddy';

  const state = {
    rangeType: 'week',
    startISO: (()=>{ const d=new Date(); const wd=(d.getDay()+6)%7; d.setDate(d.getDate()-wd); return toISO(d); })(),
    who: 'Todos',
    emotions: [],
    bound:false,
    savingLight:false
  };

  async function loadEmotions(){
    try{
      const rows = (await window.NT?.emotions?.list?.()) || [
        {key:'feliz',label:'Feliz'},{key:'meh',label:'Meh'},{key:'ansioso',label:'Ansioso'},
        {key:'estresado',label:'Estresado'},{key:'triste',label:'Triste'},{key:'muy_feliz',label:'Muy feliz'}
      ];
      state.emotions = rows.filter(r=>r.active!==false).map(r=>({key:r.key,label:r.label}));
      const sel = qs('#lightEmotion');
      if(sel) sel.innerHTML = state.emotions.map(e=>`<option value="${esc(e.key)}">${esc(e.label)}</option>`).join('');
    }catch(e){ console.warn(e); }
  }

  function endOf(type, startISO){
    const d=new Date(startISO);
    if(type==='week'){ d.setDate(d.getDate()+6); }
    else { d.setMonth(d.getMonth()+1); d.setDate(0); }
    return toISO(d);
  }

  async function renderLights(){
    const list=qs('#lightsList'), stats=qs('#lightsStats');
    if(!list||!stats) return;
    list.innerHTML=`<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      const from= state.startISO;
      const to  = endOf(state.rangeType, state.startISO);
      let items = await window.NT.lights.listLights({from,to});
      if(state.who!=='Todos') items = items.filter(i=>i.who===state.who);

      // stats
      const counts = {Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i=> counts[i.color]=(counts[i.color]||0)+1);
      stats.innerHTML = `
        <div class="gs-card p-3 flex items-center justify-between"><div class="flex items-center gap-2">${colorDot('Rojo')}<span>Rojo</span></div><div class="text-2xl font-semibold">${counts.Rojo||0}</div></div>
        <div class="gs-card p-3 flex items-center justify-between"><div class="flex items-center gap-2">${colorDot('Ámbar')}<span>Ámbar</span></div><div class="text-2xl font-semibold">${counts['Ámbar']||0}</div></div>
        <div class="gs-card p-3 flex items-center justify-between"><div class="flex items-center gap-2">${colorDot('Verde')}<span>Verde</span></div><div class="text-2xl font-semibold">${counts.Verde||0}</div></div>
        <div class="gs-card p-3 flex items-center justify-between"><div class="flex items-center gap-2">${colorDot('Azul')}<span>Azul</span></div><div class="text-2xl font-semibold">${counts.Azul||0}</div></div>
      `;

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
            <button class="gs-btn" data-edit="${l.id}" title="Editar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
            <button class="gs-btn" data-del="${l.id}" title="Borrar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      `).join('');

      qsa('[data-edit]').forEach(b=> b.addEventListener('click',()=>{
        const itId=b.getAttribute('data-edit'); const it=items.find(x=>x.id===itId); openModal(it);
      }));
      qsa('[data-del]').forEach(b=> b.addEventListener('click',async()=>{
        const id=b.getAttribute('data-del');
        if(!confirm('¿Eliminar entrada?')) return;
        await window.NT.lights.deleteLight(id).catch(e=>console.error(e));
        renderLights();
      }));

    }catch(e){ console.error(e); list.innerHTML=`<div class="text-sm text-red-300">Error al cargar.</div>`; }
  }

  function attachFilters(){
    const t=qs('#lightsRangeType'), d=qs('#lightsRangeStart'), w=qs('#lightsWho'), add=qs('#addLightBtn');
    if(t && !t.__bound){ t.__bound=true; t.addEventListener('change',()=>{ state.rangeType = (t.value==='Mes')?'month':'week'; renderLights(); }); }
    if(d && !d.__bound){ d.__bound=true; d.value=state.startISO; d.addEventListener('change',()=>{ state.startISO=d.value||state.startISO; renderLights(); }); }
    if(w && !w.__bound){ w.__bound=true; w.addEventListener('change',()=>{ state.who=w.value; renderLights(); }); }
    if(add && !add.__bound){ add.__bound=true; add.addEventListener('click',()=> openModal()); }
  }

  function openModal(item=null){
    const m=qs('#lightModal'); if(!m) return;
    qs('#lightModalTitle').textContent = item ? 'Editar entrada':'Nueva entrada';
    show(qs('#deleteLightBtn'), !!item);
    qs('#lightId').value       = item?.id || '';
    qs('#lightColor').value    = item?.color || 'Verde';
    qs('#lightWho').value      = item?.who || 'Eddy';
    qs('#lightEmotion').value  = item?.emotion || (state.emotions[0]?.key || 'feliz');
    qs('#lightAction').value   = item?.action || '';
    qs('#lightNotes').value    = item?.notes || '';
    const inp = qs('#lightDate'); inp.value = item?.light_on || toISO(new Date());
    m.showModal();
  }

  async function onSubmitLight(e){
    e.preventDefault();
    if (state.savingLight) return;           // ⬅️ anti doble submit
    state.savingLight = true;
    try{
      const payload = {
        id: qs('#lightId').value || undefined,
        light_on: qs('#lightDate').value,
        color: qs('#lightColor').value,
        who: qs('#lightWho').value,
        action: (qs('#lightAction').value||'').trim(),
        emotion: qs('#lightEmotion').value,
        notes: qs('#lightNotes').value || null
      };
      if(!payload.action) { state.savingLight=false; return alert('Acción es obligatoria'); }
      await window.NT.lights.upsertLight(payload);
      qs('#lightModal').close();
      await renderLights();
    }catch(e){ console.error(e); alert('Error al guardar'); }
    finally{ state.savingLight = false; }
  }

  function bindModal(){
    const m=qs('#lightModal'); if(!m || m.__bound) return;
    m.__bound=true;
    qs('#closeLightModal')?.addEventListener('click', ()=> m.close());
    const f=qs('#lightForm'); if(f && !f.__bound){ f.__bound=true; f.addEventListener('submit', onSubmitLight); }
    qs('#deleteLightBtn')?.addEventListener('click', async ()=>{
      const id=qs('#lightId').value; if(!id) return; if(!confirm('¿Eliminar entrada?')) return;
      await window.NT.lights.deleteLight(id).catch(e=>console.error(e));
      m.close(); renderLights();
    });
  }

  async function init(){
    // Solo si la vista existe
    if(!qs('#view-luces')) return;
    attachFilters();
    bindModal();
    await loadEmotions();
    await renderLights();
  }

  function onRoute(){
    const key=(location.hash||'#/resumen').replace('#/','');
    if(key==='luces') init();
  }
  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();
