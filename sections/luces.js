<!-- luces.js -->
<script type="module">
/* luces.js — módulo autónomo de la sección Luces
   Requisitos:
   - window.NT.lights.{listLights, upsertLight, deleteLight}
   - (opcional) window.NT.emotions.list() -> [{key,label,active}]
   - Tailwind para estilos (ya lo tienes)
   - Si hay flatpickr en la página, lo uso; si no, fallback a <input type="date">
*/

(() => {
  // ---------- Utils ----------
  const qs  = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => [...el.querySelectorAll(sel)];
  const $$  = (el, show=true) => el && el.classList.toggle('hidden-vis', !show);
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));

  const colorHex = {Rojo:'#ef4444','Ámbar':'#f59e0b',Verde:'#22c55e',Azul:'#60a5fa'};

  function toast(msg, type='info'){
    const host = qs('#toastHost') || document.body;
    const el = document.createElement('div');
    el.className = `gs-card px-4 py-2 text-sm border-l-4 ${type==='error'?'border-red-400':type==='success'?'border-emerald-400':'border-[#C7A740]'}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=> el.remove(), 3000);
  }

  function colorDot(c){
    const col = colorHex[c] || '#9ca3af';
    return `<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${col}"></span>`;
  }

  // Caritas (SVG inline) — claves deben coincidir con tabla `light_emotions.key`
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
      neutral:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><path d="M8 15h8" stroke="${base}" stroke-width="1.6" stroke-linecap="round"/><path d="M9 10h1M14 10h1" stroke="${base}" stroke-width="1.6"/>`,
      orgulloso:`<circle cx="12" cy="12" r="10" stroke="${base}" fill="none"/><circle cx="9" cy="10" r="1.2" fill="${base}"/><circle cx="15" cy="10" r="1.2" fill="${base}"/><path d="M8 14c2 0 6 0 8 0" stroke="${base}" stroke-width="1.6" /><path d="M10 7l2 2 2-2" stroke="${base}" stroke-width="1.6" fill="none" />`
    };
    const svg = faces[key] || faces.meh;
    return `<svg class="icon-sm" viewBox="0 0 24 24" fill="none">${svg}</svg>`;
  };

  function opposite(who){ return who==='Eddy' ? 'Dani' : 'Eddy'; }
  function toISO(d){ return new Date(d).toISOString().slice(0,10); }

  // ---------- Date helpers ----------
  function startOf(type, anchor){
    const d = new Date(anchor);
    if (type === 'week') {
      const wd = (d.getDay() + 6) % 7; // lunes=0
      d.setDate(d.getDate() - wd);
    } else {
      d.setDate(1);
    }
    return toISO(d);
  }
  function endOf(type, startISO){
    const d = new Date(startISO);
    if (type === 'week') {
      d.setDate(d.getDate()+6);
    } else {
      d.setMonth(d.getMonth()+1);
      d.setDate(d.getDate()-1);
    }
    return toISO(d);
  }

  // ---------- Estado local ----------
  const state = {
    rangeType: 'week',
    startISO: startOf('week', new Date()),
    who: 'Todos',
    emotions: [], // [{key,label}]
    fpRange: null,
    fpModal: null
  };

  // ---------- Carga de emociones (desde tabla) ----------
  async function loadEmotions(){
    try{
      if (window.NT?.emotions?.list) {
        const rows = await window.NT.emotions.list();
        state.emotions = rows.filter(r=>r.active!==false).map(r=>({key:r.key,label:r.label}));
      } else {
        // fallback mínimo
        state.emotions = [
          {key:'feliz', label:'Feliz'},
          {key:'muy_feliz', label:'Muy feliz'},
          {key:'meh', label:'Meh'},
          {key:'ansioso', label:'Ansioso'},
          {key:'estresado', label:'Estresado'},
          {key:'frustrado', label:'Frustrado'},
          {key:'triste', label:'Triste'}
        ];
      }
      const sel = qs('#lightEmotion');
      if (sel) {
        sel.innerHTML = state.emotions.map(e=>`<option value="${esc(e.key)}">${esc(e.label)}</option>`).join('');
      }
    }catch(e){ console.error('Emotions load failed', e); }
  }

  // ---------- Render principal ----------
  async function renderLights(){
    const list  = qs('#lightsList');
    const stats = qs('#lightsStats');
    if(!list || !stats) return;

    list.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;

    const from = state.startISO;
    const to   = endOf(state.rangeType, state.startISO);

    try{
      let items = await window.NT.lights.listLights({ from, to });
      if (state.who !== 'Todos') items = items.filter(x=>x.who===state.who);

      // stats
      const counts = {Rojo:0,'Ámbar':0,Verde:0,Azul:0};
      items.forEach(i => counts[i.color] = (counts[i.color]||0) + 1);
      stats.innerHTML = `
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot('Rojo')} <span>Rojo</span></div>
          <div class="text-2xl font-semibold">${counts.Rojo||0}</div>
        </div>
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot('Ámbar')} <span>Ámbar</span></div>
          <div class="text-2xl font-semibold">${counts['Ámbar']||0}</div>
        </div>
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot('Verde')} <span>Verde</span></div>
          <div class="text-2xl font-semibold">${counts.Verde||0}</div>
        </div>
        <div class="gs-card p-3 flex items-center justify-between">
          <div class="flex items-center gap-2">${colorDot('Azul')} <span>Azul</span></div>
          <div class="text-2xl font-semibold">${counts.Azul||0}</div>
        </div>
      `;

      if (!items.length) {
        list.innerHTML = `<div class="text-sm opacity-70">Sin entradas.</div>`;
        return;
      }

      list.innerHTML = items.map(l => `
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

      // bind edit / delete
      qsa('[data-edit]').forEach(b => b.addEventListener('click', () => {
        const id = b.getAttribute('data-edit');
        const it = items.find(x => x.id === id);
        openModal(it);
      }));
      qsa('[data-del]').forEach(b => b.addEventListener('click', async() => {
        const id = b.getAttribute('data-del');
        if (!confirm('¿Eliminar entrada?')) return;
        try{
          await window.NT.lights.deleteLight(id);
          toast('Eliminada','success');
          renderLights();
        }catch(e){ console.error(e); toast('Error al eliminar','error'); }
      }));

    }catch(e){
      console.error(e);
      list.innerHTML = `<div class="text-sm text-red-300">Error al cargar.</div>`;
    }
  }

  // ---------- Modal ----------
  function attachModal(){
    const m = qs('#lightModal');
    if (!m || m.__bound) return;
    m.__bound = true;

    // Close
    qs('#closeLightModal')?.addEventListener('click', ()=> m.close());

    // Delete btn (visible sólo en edición)
    qs('#deleteLightBtn')?.addEventListener('click', async () => {
      const id = qs('#lightId').value;
      if(!id) return;
      if(!confirm('¿Eliminar entrada?')) return;
      try{
        await window.NT.lights.deleteLight(id);
        m.close();
        toast('Eliminada','success');
        renderLights();
      }catch(e){ console.error(e); toast('Error al eliminar','error'); }
    });

    // Submit
    qs('#lightForm')?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const action = qs('#lightAction').value.trim();
      if(!action) return toast('Acción es obligatoria','error');
      const payload = {
        id: qs('#lightId').value || undefined,
        light_on: qs('#lightDate').value,
        color: qs('#lightColor').value,
        who: qs('#lightWho').value,
        action,
        emotion: qs('#lightEmotion').value,
        notes: qs('#lightNotes').value || null
      };
      try{
        await window.NT.lights.upsertLight(payload);
        m.close();
        toast('Guardado','success');
        renderLights();
      }catch(e){ console.error(e); toast(`Error al guardar: ${e.message}`,'error'); }
    });
  }

  function openModal(item=null){
    const m = qs('#lightModal'); if(!m) return;
    $$ (qs('#deleteLightBtn'), !!item);

    qs('#lightModalTitle').textContent = item? 'Editar entrada':'Nueva entrada';
    qs('#lightId').value     = item?.id || '';
    qs('#lightColor').value  = item?.color || 'Verde';
    qs('#lightWho').value    = item?.who || 'Eddy';
    qs('#lightEmotion').value= item?.emotion || (state.emotions[0]?.key || 'feliz');
    qs('#lightAction').value = item?.action || '';
    qs('#lightNotes').value  = item?.notes  || '';

    // fecha
    const dateInput = qs('#lightDate');
    dateInput.value = item?.light_on || toISO(new Date());

    // flatpickr si existe
    if (state.fpModal) { try{ state.fpModal.destroy(); }catch{} state.fpModal = null; }
    if (window.flatpickr) {
      state.fpModal = flatpickr(dateInput, { altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d" });
      if (item?.light_on) state.fpModal.setDate(item.light_on, true);
    }
    m.showModal();
  }

  // ---------- Filtros de la barra ----------
  function attachFilters(){
    // rango
    const selType = qs('#lightsRangeType');
    const inpDate = qs('#lightsRangeStart');
    const selWho  = qs('#lightsWho');

    if (selType && !selType.__b){
      selType.__b = true;
      selType.addEventListener('change', ()=>{
        state.rangeType = selType.value === 'Mes' ? 'month' : 'week';
        // recalcula start desde el valor actual de input
        const anchor = inpDate?.value ? new Date(inpDate.value) : new Date();
        state.startISO = startOf(state.rangeType, anchor);
        if (inpDate) inpDate.value = state.startISO;
        renderLights();
      });
    }

    if (inpDate && !inpDate.__b){
      inpDate.__b = true;
      // inicia valor
      inpDate.value = state.startISO;

      if (state.fpRange) { try{ state.fpRange.destroy(); }catch{} state.fpRange = null; }
      if (window.flatpickr) {
        state.fpRange = flatpickr(inpDate, {
          altInput:true, altFormat:"d/m/Y", dateFormat:"Y-m-d",
          defaultDate: state.startISO,
          onChange: (sel)=> {
            const iso = (sel?.[0]) ? toISO(sel[0]) : inpDate.value;
            state.startISO = startOf(state.rangeType, iso);
            inpDate.value = state.startISO;
            renderLights();
          }
        });
      } else {
        inpDate.addEventListener('change', ()=>{
          state.startISO = startOf(state.rangeType, inpDate.value);
          inpDate.value = state.startISO;
          renderLights();
        });
      }
    }

    if (selWho && !selWho.__b){
      selWho.__b = true;
      selWho.addEventListener('change', ()=>{
        state.who = selWho.value;
        renderLights();
      });
    }

    // botón +
    const btnAdd = qs('#addLightBtn');
    if (btnAdd && !btnAdd.__b){
      btnAdd.__b = true;
      btnAdd.addEventListener('click', ()=> openModal());
    }
  }

  // ---------- Init público ----------
  async function init(){
    // Solo actúa si la vista de luces está presente
    const view = qs('#view-luces'); if (!view) return;

    attachFilters();
    attachModal();
    await loadEmotions();

    // Si entro directo a #/luces, o navego luego, renderizo
    await renderLights();
  }

  // Router-friendly: si ya estás en #/luces, inicializa; si luego cambias el hash, re-intenta
  function autoInit(){
    const go = () => {
      const key = (location.hash||'#/resumen').replace('#/','');
      if (key === 'luces') init();
    };
    window.addEventListener('hashchange', go);
    go();
  }

  // Exponer por si tu router lo llama manualmente
  window.NT = window.NT || {};
  window.NT.lightsUI = { init, refresh: renderLights };

  autoInit();
})();
</script>
