// section/juegos.js — v1.1 (modular, sin pisar otras secciones)
// Requiere: window.NT._supa (cliente supabase) + window.NT.practices + window.NT.locations

(() => {
  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));
  const show= (el,v=true)=> el&&el.classList.toggle('hidden-vis',!v);

  const supa = window.NT?._supa;
  if(!supa){ console.error('Supabase client no disponible en window.NT._supa'); }

  // Estado
  let games = [];          // juegos cargados
  let practices = [];      // {key,label,active}
  let locations = [];      // {name}
  let currentId = null;    // id en edición

  // Helpers
  const todayISO = () => new Date().toISOString().slice(0,10);
  const monthStart = () => { const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10); };
  const monthEnd   = () => { const d=new Date(); d.setMonth(d.getMonth()+1); d.setDate(0); return d.toISOString().slice(0,10); };

  function gaugeSVG(val=7, size=50){
    const v = Math.max(1, Math.min(10, Number(val)));
    const pct=v/10, r=(size/2)-7, C=2*Math.PI*r, dash=(C*pct).toFixed(1);
    const color=`hsl(${Math.round(120*pct)},70%,45%)`;
    const cx=size/2, cy=size/2;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#e5e7eb" stroke-width="6" fill="none"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="6" fill="none"
        stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="${size/4.5}" fill="currentColor">${v}</text>
    </svg>`;
  }

  async function loadPracticesAndLocations(){
    try{
      practices = await window.NT.practices.listPractices({onlyActive:true});
    }catch(e){ console.warn('No pude cargar practices',e); practices=[]; }

    try{
      locations = await window.NT.locations.listLocations();
    }catch(e){ console.warn('No pude cargar locations',e); locations=[]; }

    // Pintar checklist y datalist si existen
    const pc = qs('#practicesChecklist');
    if(pc){
      pc.innerHTML = practices.map(p=>`
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" value="${esc(p.key)}"> <span>${esc(p.label)}</span>
        </label>
      `).join('') || `<div class="text-xs opacity-70">Sin prácticas definidas.</div>`;
    }
    const dl = qs('#locList');
    if(dl){
      dl.innerHTML = locations.map(l=>`<option value="${esc(l.name)}"></option>`).join('');
    }
  }

  // Lee juegos + puente practices
  async function fetchGames(fromISO, toISO){
    // juegos base
    let q = supa.from('intimacy_games')
      .select('id, played_on, kind, promoter, condom, role, toys, toys_with, cream_inside, location, satisfaction, notes')
      .order('played_on',{ascending:false});
    if(fromISO) q = q.gte('played_on', fromISO);
    if(toISO)   q = q.lte('played_on', toISO);

    const { data, error } = await q;
    if(error) throw error;
    const rows = data || [];
    if(!rows.length) return [];

    // prácticas por juego (tabla puente)
    const ids = rows.map(r=>r.id);
    const { data: rel, error: e2 } = await supa
      .from('intimacy_game_practices')
      .select('game_id, practice_key')
      .in('game_id', ids);
    if(e2) throw e2;

    const map = new Map(); // id -> [keys]
    (rel||[]).forEach(r=>{
      const arr = map.get(r.game_id) || [];
      arr.push(r.practice_key);
      map.set(r.game_id, arr);
    });

    return rows.map(r=> ({ ...r, practices: map.get(r.id)||[] }));
  }

  function paintStats(items){
    const stats = { eddyActive:0, daniActive:0, total: items.length };
    items.forEach(g=>{
      if(g.role==='Eddy→Dani'){ stats.eddyActive++; }
      else if(g.role==='Dani→Eddy'){ stats.daniActive++; }
      else if(g.role==='Ambos versátiles'){ stats.eddyActive++; stats.daniActive++; }
    });
    qs('#statEddyActive').textContent = stats.eddyActive;
    qs('#statDaniActive').textContent = stats.daniActive;
    qs('#statTotalGames').textContent = stats.total;
  }

  function paintList(items){
    const box = qs('#gamesList');
    if(!box) return;
    if(!items.length){ box.innerHTML = `<div class="text-sm opacity-70">Sin juegos.</div>`; return; }

    box.innerHTML = items.map(g=>{
      const chips = (g.practices||[]).map(k=>`<span class="gs-chip mr-1">${esc(k)}</span>`).join('');
      return `
        <div class="gs-card p-4 flex items-start justify-between">
          <div>
            <div class="font-medium">${esc(g.kind==='mini-juego'?'Mini-juego':'Juego')} · ${esc(g.promoter)} · ${esc(g.played_on)}</div>
            <div class="text-xs opacity-70">${esc(g.role)} · Condón: ${g.condom?'Sí':'No'} · Juguetes: ${g.toys?'Sí':'No'} ${g.toys?`· Con: ${esc(g.toys_with||'—')}`:''} · Lechita: ${esc(g.cream_inside||'Ninguno')}</div>
            <div class="text-xs opacity-70 mt-1">Lugar: ${esc(g.location||'—')}</div>
            ${chips? `<div class="mt-1 text-xs">${chips}</div>`:''}
            ${g.notes? `<div class="mt-2 text-xs opacity-80">${esc(g.notes)}</div>`:''}
          </div>
          <div class="flex items-center gap-3 ml-4">
            <div>${gaugeSVG(g.satisfaction||7, 50)}</div>
            <button class="gs-btn" data-edit="${g.id}" title="Editar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
            <button class="gs-btn" data-del="${g.id}" title="Borrar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    qsa('[data-edit]').forEach(b=> b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-edit');
      const it=items.find(x=>x.id===id);
      openModal(it);
    }));
    qsa('[data-del]').forEach(b=> b.addEventListener('click', async()=>{
      const id=b.getAttribute('data-del');
      if(!confirm('¿Eliminar juego?')) return;
      await deleteGame(id);
      refresh();
    }));
  }

  async function refresh(){
    try{
      const from = qs('#gamesFrom')?.value || monthStart();
      const to   = qs('#gamesTo')?.value   || monthEnd();
      games = await fetchGames(from, to);
      paintStats(games);
      paintList(games);
    }catch(e){
      console.error(e);
      const box=qs('#gamesList');
      if(box) box.innerHTML = `<div class="text-sm text-red-300">Error al cargar.</div>`;
    }
  }

  // ===== Modal =====
  function openModal(item=null){
    currentId = item?.id || null;
    qs('#gameModalTitle').textContent = item ? 'Editar juego':'Nuevo juego';
    show(qs('#deleteGameBtn'), !!item);

    const today = todayISO();
    qs('#gameId').value           = item?.id || '';
    qs('#gameDate').value         = item?.played_on || today;
    qs('#gameKind').value         = item?.kind || 'juego';
    qs('#gamePromoter').value     = item?.promoter || 'Ambos';
    qs('#gameRole').value         = item?.role || 'Ambos versátiles';
    qs('#gameCondom').value       = String(item?.condom ?? false);
    qs('#gameToys').value         = String(item?.toys ?? false);
    qs('#gameToysWith').value     = item?.toys_with || '';
    qs('#gameToysWith').disabled  = (qs('#gameToys').value!=='true');
    qs('#gameCream').value        = item?.cream_inside || 'Ninguno';
    qs('#gameLocation').value     = item?.location || '';
    qs('#gameSatisfaction').value = Number(item?.satisfaction || 7);
    qs('#gameNotes').value        = item?.notes || '';

    // marcar prácticas
    const selected = new Set(item?.practices || []);
    qsa('#practicesChecklist input[type=checkbox]').forEach(ch => ch.checked = selected.has(ch.value));

    qs('#gameModal').showModal();
  }

  async function deleteGame(id){
    // por si no hay cascada:
    await supa.from('intimacy_game_practices').delete().eq('game_id', id);
    await supa.from('intimacy_games').delete().eq('id', id);
  }

  async function saveGame(e){
    e.preventDefault();
    const payload = {
      played_on: qs('#gameDate').value,
      kind: qs('#gameKind').value,
      promoter: qs('#gamePromoter').value,
      role: qs('#gameRole').value,
      condom: qs('#gameCondom').value === 'true',
      toys: qs('#gameToys').value === 'true',
      toys_with: (qs('#gameToys').value === 'true') ? (qs('#gameToysWith').value || null) : null,
      cream_inside: qs('#gameCream').value,
      location: qs('#gameLocation').value || null,
      satisfaction: Number(qs('#gameSatisfaction').value || 7),
      notes: qs('#gameNotes').value || null
    };
    const selectedPractices = qsa('#practicesChecklist input[type=checkbox]').filter(ch=>ch.checked).map(ch=>ch.value);

    if(currentId){
      // update
      const { error } = await supa.from('intimacy_games').update(payload).eq('id', currentId);
      if(error){ alert('Error al guardar'); console.error(error); return; }
      // reescribir puente
      await supa.from('intimacy_game_practices').delete().eq('game_id', currentId);
      if(selectedPractices.length){
        const rows = selectedPractices.map(k=>({ game_id: currentId, practice_key: k }));
        await supa.from('intimacy_game_practices').insert(rows);
      }
    }else{
      // insert
      const { data, error } = await supa.from('intimacy_games').insert(payload).select('id').single();
      if(error){ alert('Error al guardar'); console.error(error); return; }
      const newId = data.id;
      if(selectedPractices.length){
        const rows = selectedPractices.map(k=>({ game_id: newId, practice_key: k }));
        await supa.from('intimacy_game_practices').insert(rows);
      }
    }

    qs('#gameModal').close();
    refresh();
  }

  // ===== Init / bindings =====
  function mountOnce(){
    const wrap = qs('#view-juegos');
    if(!wrap || wrap.__bound) return;
    wrap.__bound = true;

    // set defaults filtros
    const fromI = qs('#gamesFrom'), toI=qs('#gamesTo');
    if(fromI) fromI.value = monthStart();
    if(toI)   toI.value   = monthEnd();
    fromI?.addEventListener('change', refresh);
    toI?.addEventListener('change', refresh);

    // botones
    qs('#btnAddGame')?.addEventListener('click', ()=> openModal());
    qs('#closeGameModal')?.addEventListener('click', ()=> qs('#gameModal')?.close());
    qs('#deleteGameBtn')?.addEventListener('click', async ()=>{
      if(!currentId) return;
      if(!confirm('¿Eliminar juego?')) return;
      await deleteGame(currentId);
      qs('#gameModal').close();
      refresh();
    });
    qs('#gameToys')?.addEventListener('change', ()=>{
      qs('#gameToysWith').disabled = (qs('#gameToys').value!=='true');
    });
    qs('#gameForm')?.addEventListener('submit', saveGame);
  }

  async function init(){
    mountOnce();
    await loadPracticesAndLocations();
    await refresh();
  }

  function onRoute(){
    const key = (location.hash||'#/resumen').replace('#/','');
    if(key==='juegos') init();
  }

  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();
