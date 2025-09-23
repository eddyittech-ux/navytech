// sections/luces.js  — v0.6
// Módulo autónomo para "Luces" (no toca otras secciones)

(() => {
  // Evita cargar dos veces este módulo
  if (window.__NT_LUCES_ONCE) return;
  window.__NT_LUCES_ONCE = true;

  // ---------- helpers ----------
  const qs  = (s,el=document)=>el.querySelector(s);
  const qsa = (s,el=document)=>[...el.querySelectorAll(s)];
  const $$  = (el, show=true)=> el && el.classList.toggle('hidden-vis', !show);
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));

  const colorDot = (color)=>{
    const map={Rojo:'#ef4444','Ámbar':'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'};
    const c = map[color] || '#9ca3af';
    return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${c}"></span>`;
  };
  const opposite = (w)=> w==='Eddy' ? 'Dani' : 'Eddy';

  // Rango por semana/mes
  function rangeFrom(type, anchorIso){
    const d = anchorIso? new Date(anchorIso) : new Date();
    if (type==='week'){ const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); }
    else { d.setDate(1); }
    return d.toISOString().slice(0,10);
  }

  // ---------- plantilla modal (dialog) ----------
  function ensureModal(){
    let modal = qs('#nt-light-modal');
    if (modal) return modal;

    // Un <dialog> con z-index alto; inputs grandes; textarea amplia; toolbar limpia
    const tpl = document.createElement('dialog');
    tpl.id = 'nt-light-modal';
    tpl.className = 'rounded-2xl p-0 bg-[#121821] text-white shadow-2xl';
    tpl.style.width = 'min(720px, 92vw)';
    tpl.style.border = '1px solid rgba(255,255,255,0.08)';
    tpl.innerHTML = `
      <form method="dialog" class="w-full">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 class="text-base font-semibold">Nueva entrada</h3>
          <button type="button" id="nt-light-close" class="gs-btn">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M6 18L18 6"/>
            </svg>
          </button>
        </div>

        <div class="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs opacity-70 mb-1">Fecha</label>
            <input id="lightDate" class="nt-input w-full" placeholder="yyyy-mm-dd" />
          </div>

          <div>
            <label class="block text-xs opacity-70 mb-1">Color</label>
            <select id="lightColor" class="nt-select w-full">
              <option>Verde</option>
              <option>Ámbar</option>
              <option>Rojo</option>
              <option>Azul</option>
            </select>
          </div>

          <div>
            <label class="block text-xs opacity-70 mb-1">Quién</label>
            <select id="lightWho" class="nt-select w-full">
              <option>Eddy</option>
              <option>Dani</option>
            </select>
          </div>

          <div>
            <label class="block text-xs opacity-70 mb-1">Sensación</label>
            <select id="lightEmotion" class="nt-select w-full"></select>
            <!-- Se llena con labels de light_emotions -->
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs opacity-70 mb-1">Acción</label>
            <textarea id="lightAction" rows="4" class="nt-textarea w-full" placeholder="¿Qué pasó?"></textarea>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs opacity-70 mb-1">Notas</label>
            <textarea id="lightNotes" rows="3" class="nt-textarea w-full" placeholder="(Opcional)"></textarea>
          </div>
        </div>

        <div class="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button id="nt-light-del" type="button" class="gs-btn hidden-vis" title="Eliminar">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12"/>
            </svg>
          </button>
          <button id="nt-light-save" type="button" class="gs-btn">Guardar</button>
        </div>
      </form>
    `;
    document.body.appendChild(tpl);

    // Estilos mínimos reutilizables (inputs grandes y suaves)
    if (!qs('#nt-input-styles')) {
      const style = document.createElement('style');
      style.id = 'nt-input-styles';
      style.textContent = `
        .nt-input,.nt-select,.nt-textarea{
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: .6rem .8rem; outline: none;
        }
        .nt-input:focus,.nt-select:focus,.nt-textarea:focus{
          border-color: #C7A740; box-shadow: 0 0 0 3px rgba(199,167,64,.15);
        }
        dialog::backdrop{ background: rgba(0,0,0,.55); }
      `;
      document.head.appendChild(style);
    }

    return tpl;
  }

  // ---------- estado ----------
  let emotions = [];   // [{key,label,active}, ...]
  let fpLight = null;
  let saving = false;
  let currentEditId = null;

  // ---------- UI ----------
  function hooks(){
    const sec = qs('#view-luces');
    if (!sec) return;

    // barra de filtros (añadimos filtro "quién")
    const filtersBar = qs('#nt-lights-bar');
    if (!filtersBar) {
      // crea cabecera y contadores si no existen
      const wrap = sec.querySelector('.gs-card') || sec;
      // En tu HTML ya hay contadores y selects; sólo añadimos filtro "quién" si falta:
      const whoSelId = 'lightsWhoFilter';
      if (!qs('#'+whoSelId, wrap)){
        const bar = qs('.nt-lights-filters', wrap) || document.createElement('div');
        bar.className = 'nt-lights-filters mt-3 flex gap-3 items-center';
        bar.id = 'nt-lights-bar';

        const whoSel = document.createElement('select');
        whoSel.id = whoSelId;
        whoSel.className = 'nt-select';
        whoSel.innerHTML = `<option value="">Todos</option><option value="Eddy">Eddy</option><option value="Dani">Dani</option>`;
        bar.appendChild(whoSel);

        // Botón +
        const addBtn = qs('#addLightBtn') || (() => {
          const b = document.createElement('button');
          b.id='addLightBtn';
          b.className='gs-btn';
          b.title='Agregar';
          b.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>';
          return b;
        })();
        bar.appendChild(addBtn);

        wrap.prepend(bar);
      }
    }

    // Eventos
    qs('#lightsRangeType')?.addEventListener('change', render);
    qs('#lightsRangeStart')?.addEventListener('change', render);
    qs('#lightsWhoFilter')?.addEventListener('change', render);
    qs('#addLightBtn')?.addEventListener('click', () => openModal());

    // Init Flatpickr del filtro de rango si no existe
    if (!qs('#lightsRangeStart')?._fp){
      const start = qs('#lightsRangeStart');
      if (start) {
        const typeSel = qs('#lightsRangeType');
        const anchor = rangeFrom(typeSel?.value==='Mes'?'month':'week');
        start.value = anchor;
      }
    }

    // Primera carga
    render();
  }

  async function loadEmotions(){
    try{
      emotions = await window.NT?.lights?.listEmotions?.()   // si tienes servicio
              || await fetchEmotionsFallback();
    }catch{ emotions = []; }
  }

  async function fetchEmotionsFallback(){
    // Si no tienes servicio expuesto, usa supabase directo si está en window.NT._supa
    if (!window.NT?._supa) return [];
    const { data, error } = await window.NT._supa
      .from('light_emotions')
      .select('key,label,active')
      .eq('active', true)
      .order('label', { ascending:true });
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async function render(){
    const list = qs('#lightsList'); if(!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;

    // filtros
    const tSel = qs('#lightsRangeType');
    const t = (tSel?.value?.toLowerCase()==='mes' ? 'month' : 'week');
    const start = qs('#lightsRangeStart')?.value || rangeFrom(t);
    const dStart = new Date(start);
    const dEnd = new Date(start);
    if (t==='week'){ dEnd.setDate(dStart.getDate()+6);}
    else { dEnd.setMonth(dStart.getMonth()+1); dEnd.setDate(dEnd.getDate()-1); }
    const from = start, to = dEnd.toISOString().slice(0,10);

    const whoFilter = qs('#lightsWhoFilter')?.value || '';

    try{
      let items = await window.NT.lights.listLights({ from, to });
      if (whoFilter) items = items.filter(i=> i.who===whoFilter);

      // contadores
      const counts = {Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i => counts[i.color] = (counts[i.color]||0)+1);
      const statsWrap = qs('#lightsStats');
      if (statsWrap) {
        statsWrap.innerHTML = Object.entries(counts).map(([k,v])=>`
          <div class="gs-card p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">${colorDot(k)}<span>${k}</span></div>
            <div class="text-2xl font-semibold">${v}</div>
          </div>
        `).join('');
      }

      if (!items.length){
        list.innerHTML = `<div class="text-sm opacity-70">Sin entradas.</div>`;
        return;
      }

      list.innerHTML = items.map(l=>`
        <div class="gs-card p-4">
          <div class="flex items-center justify-between mb-1 text-sm opacity-80">
            <div class="flex items-center gap-2">${colorDot(l.color)} <strong>${esc(l.who)}</strong></div>
            <div>${esc(l.light_on)}</div>
          </div>
          <div class="font-medium">${esc(l.action)}</div>
          <div class="mt-1 text-xs opacity-80 flex items-center gap-2">
            <span>${opposite(l.who)}</span> ·
            <span>${labelForEmotion(l.emotion)}</span>
          </div>
          ${l.notes?`<div class="mt-2 text-xs opacity-80">${esc(l.notes)}</div>`:''}
          <div class="mt-3 flex items-center gap-2 justify-end">
            <button class="gs-btn" data-edit-light="${l.id}" title="Editar">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 20h4l10-10-4-4L4 16v4Z"/>
              </svg>
            </button>
            <button class="gs-btn" data-del-light="${l.id}" title="Borrar">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      qsa('[data-edit-light]').forEach(b=>{
        b.addEventListener('click', ()=>{
          const id = b.getAttribute('data-edit-light');
          const it = items.find(x=>x.id===id);
          openModal(it);
        });
      });
      qsa('[data-del-light]').forEach(b=>{
        b.addEventListener('click', async()=>{
          const id = b.getAttribute('data-del-light');
          if (!confirm('¿Eliminar entrada?')) return;
          try{
            await window.NT.lights.deleteLight(id);
            toast('Eliminada','success');
            render();
          }catch(e){ console.error(e); toast('Error al eliminar','error'); }
        });
      });

    }catch(e){
      console.error(e);
      list.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`;
    }
  }

  function labelForEmotion(key){
    if (!key) return '';
    const row = emotions.find(e=>e.key===key);
    return row ? row.label : key;
  }

  function toast(msg, type='info'){
    const host = qs('#toastHost') || document.body;
    const el = document.createElement('div');
    el.className=`gs-card px-4 py-2 text-sm border-l-4 ${type==='error'?'border-red-400':type==='success'?'border-emerald-400':'border-[#C7A740]'}`;
    el.textContent=msg;
    host.appendChild(el);
    setTimeout(()=>el.remove(), 2800);
  }

  // ---------- modal ----------
  async function openModal(item=null){
    await loadEmotions();
    const modal = ensureModal();

    // Relleno
    currentEditId = item?.id || null;
    qs('#nt-light-del', modal).classList.toggle('hidden-vis', !currentEditId);

    // emociones con label visible
    const emoSel = qs('#lightEmotion', modal);
    emoSel.innerHTML = emotions.map(e=>`<option value="${esc(e.key)}">${esc(e.label)}</option>`).join('');
    // set default
    emoSel.value = item?.emotion || (emotions[0]?.key || 'feliz');

    qs('#lightColor', modal).value = item?.color || 'Verde';
    qs('#lightWho', modal).value   = item?.who   || 'Eddy';
    qs('#lightAction', modal).value= item?.action || '';
    qs('#lightNotes', modal).value = item?.notes  || '';

    // Fecha + Flatpickr encima del dialog
    const dateInput = qs('#lightDate', modal);
    dateInput.value = item?.light_on || new Date().toISOString().slice(0,10);
    if (fpLight) { try{ fpLight.destroy(); }catch{} fpLight=null; }
    fpLight = flatpickr(dateInput, {
      altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d",
      defaultDate: dateInput.value,
      allowInput:true,
      appendTo: document.body,   // asegura z-index por encima del dialog
      static: false,
      zIndex: 99999
    });

    // Eventos (limpia previos)
    qs('#nt-light-close', modal).onclick = ()=> modal.close();
    qs('#nt-light-del', modal).onclick   = onDeleteLight;
    qs('#nt-light-save', modal).onclick  = onSaveLight;

    if (!modal.open) modal.showModal();
  }

  async function onDeleteLight(){
    if (!currentEditId) return;
    if (!confirm('¿Eliminar entrada?')) return;
    try{
      await window.NT.lights.deleteLight(currentEditId);
      toast('Eliminada','success');
      qs('#nt-light-modal').close();
      render();
    }catch(e){ console.error(e); toast('Error al eliminar','error'); }
  }

  async function onSaveLight(){
    if (saving) return;
    saving = true;

    // anti-doble-submit: desactiva botón
    const btn = qs('#nt-light-save');
    const modal = qs('#nt-light-modal');
    btn.disabled = true; btn.textContent = 'Guardando…';

    const payload = {
      id: currentEditId || undefined,
      light_on: qs('#lightDate', modal).value,
      color:    qs('#lightColor', modal).value,
      who:      qs('#lightWho', modal).value,
      action:   qs('#lightAction', modal).value.trim(),
      emotion:  qs('#lightEmotion', modal).value,
      notes:    qs('#lightNotes', modal).value || null
    };

    if (!payload.action){
      toast('Acción es obligatoria', 'error');
      saving=false; btn.disabled=false; btn.textContent='Guardar';
      return;
    }

    try{
      await window.NT.lights.upsertLight(payload);
      toast('Guardado','success');
      modal.close();
      render();
    }catch(e){
      console.error(e);
      toast('Error al guardar','error');
    }finally{
      saving=false; btn.disabled=false; btn.textContent='Guardar';
    }
  }

  // ---------- arranque sólo cuando exista la vista ----------
  const boot = () => {
    const v = qs('#view-luces');
    if (!v) return;
    hooks();
  };

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
