// section/juegos.js — v1.2 robusto
(() => {
  if (window.__NT_JUEGOS_ONCE) return;   // ⬅️ evita doble carga del módulo
  window.__NT_JUEGOS_ONCE = true;

  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&quot;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));
  const show= (el,v=true)=> el&&el.classList.toggle('hidden-vis',!v);
  const supa = window.NT?.supa;

  const todayISO = () => new Date().toISOString().slice(0,10);
  const monthStart = () => { const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10); };
  const monthEnd   = () => { const d=new Date(); d.setMonth(d.getMonth()+1); d.setDate(0); return d.toISOString().slice(0,10); };

  let practices=[], locations=[], games=[], currentId=null, saving=false;

  function gaugeSVG(val=7, size=50){
    const v=Math.max(1,Math.min(10,Number(val))); const pct=v/10, r=(size/2)-7, C=2*Math.PI*r, dash=(C*pct).toFixed(1);
    const color=`hsl(${Math.round(120*pct)},70%,45%)`, cx=size/2, cy=size/2;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#e5e7eb" stroke-width="6" fill="none"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="6" fill="none"
        stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="${size/4.5}" fill="currentColor">${v}</text>
    </svg>`;
  }

  async function loadCatalogs(){
    try{ practices = await window.NT.practices.listPractices({onlyActive:true}); }catch{ practices=[]; }
    try{ locations = await window.NT.locations.listLocations(); }catch{ locations=[]; }

    const pc = qs('#practicesChecklist');
    if (pc) pc.innerHTML = practices.map(p=>`
      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" value="${esc(p.key)}"> <span>${esc(p.label)}</span>
      </label>`).join('') || `<div class="text-xs opacity-70">Sin prácticas definidas.</div>`;

    const dl = qs('#locList');
    if (dl) dl.innerHTML = locations.map(l=> `<option value="${esc(l.name)}"></option>`).join('');
  }

  async function fetchGames(fromISO, toISO){
    let q = supa.from('intimacy_games')
      .select('id, played_on, kind, promoter, condom, role, toys, toys_with, cream_inside, location, satisfaction, notes')
      .order('played_on',{ascending:false});
    if(fromISO) q = q.gte('played_on', fromISO);
    if(toISO)   q = q.lte('played_on', toISO);

    const { data, error } = await q;
    if (error) throw error;
    const rows = data||[];
    if (!rows.length) return [];

    const ids = rows.map(r=>r.id);
    const { data: rel, error: e2 } = await supa
      .from('intimacy_game_practices')
      .select('game_id, practice_key')
      .in('game_id', ids);
    if (e2) throw e2;

    const map = new Map();
    (rel||[]).forEach(r=>{
      const arr = map.get(r.game_id)||[];
      arr.push(r.practice_key);
      map.set(r.game_id, arr);
    });

    return rows.map(r=> ({...r, practices: map.get(r.id)||[]}));
  }

  function paintStats(items){
    let eddy=0, dani=0;
    items.forEach(g=>{
      if(g.role==='Eddy→Dani') eddy++;
      else if(g.role==='Dani→Eddy') dani++;
      else if(g.role==='Ambos versátiles'){ eddy++; dani++; }
    });
    qs('#statEddyActive').textContent = eddy;
    qs('#statDaniActive').textContent = dani;
    qs('#statTotalGames').textContent = items.length;
  }

  function paintList(items){
    const box=qs('#gamesList'); if(!box) return;
    if(!items.length){ box.innerHTML = `<div class="text-sm opacity-70">Sin juegos.</div>`; return; }
    box.innerHTML = items.map(g=>{
      const chips=(g.practices||[]).map(k=>`<span class="gs-chip mr-1">${esc(k)}</span>`).join('');
      return `<div class="gs-card p-4 flex items-start justify-between">
        <div>
          <div class="font-medium">${esc(g.kind==='mini-juego'?'Mini-juego':'Juego')} · ${esc(g.promoter)} · ${esc(g.played_on)}</div>
          <div class="text-xs opacity-70">${esc(g.role)} · Condón: ${g.condom?'Sí':'No'} · Juguetes: ${g.toys?'Sí':'No'} ${g.toys?`· Con: ${esc(g.toys_with||'—')}`:''} · Lechita: ${esc(g.cream_inside||'Ninguno')}</div>
          <div class="text-xs opacity-70 mt-1">Lugar: ${esc(g.location||'—')}</div>
          ${chips? `<div class="mt-1 text-xs">${chips}</div>`:''}
          ${g.notes? `<div class="mt-2 text-xs opacity-80">${esc(g.notes)}</div>`:''}
        </div>
        <div class="flex items-center gap-3 ml-4">
          <div>${gaugeSVG(g.satisfaction||7,50)}</div>
          <button class="gs-btn" data-edit="${g.id}" title="Editar">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
          <button class="gs-btn" data-del="${g.id}" title="Borrar">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');

    qsa('[data-edit]').forEach(b=> b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-edit');
      const it=items.find(x=>x.id===id);
      openModal(it);
    }));
    qsa('[data-del]').forEach(b=> b.addEventListener('click', async()=>{
      const id=b.getAttribute('data-del');
      if(!confirm('¿Eliminar juego?')) return;
      await supa.from('intimacy_game_practices').delete().eq('game_id', id);
      await supa.from('intimacy_games').delete().eq('id', id);
      refresh();
    }));
  }

  async function refresh(){
    try{
      const from=qs('#gamesFrom')?.value || monthStart();
      const to  =qs('#gamesTo')?.value   || monthEnd();
      games = await fetchGames(from, to);
      paintStats(games);
      paintList(games);
    }catch(e){
      console.error(e);
      const box=qs('#gamesList'); if(box) box.innerHTML=`<div class="text-sm text-red-300">Error al cargar.</div>`;
    }
  }

  function openModal(item=null){
    const dlg=qs('#gameModal'); if(!dlg) return;
    currentId = item?.id || null;
    qs('#gameModalTitle').textContent = item ? 'Editar juego':'Nuevo juego';
    show(qs('#deleteGameBtn'), !!item);

    qs('#gameId').value            = item?.id || '';
    qs('#gameDate').value          = item?.played_on || todayISO();
    qs('#gameKind').value          = item?.kind || 'juego';
    qs('#gamePromoter').value      = item?.promoter || 'Ambos';
    qs('#gameRole').value          = item?.role || 'Ambos versátiles';
    qs('#gameCondom').value        = String(item?.condom ?? false);
    qs('#gameToys').value          = String(item?.toys ?? false);
    qs('#gameToysWith').value      = item?.toys_with || '';
    qs('#gameToysWith').disabled   = (qs('#gameToys').value!=='true');
    qs('#gameCream').value         = item?.cream_inside || 'Ninguno';
    qs('#gameLocation').value      = item?.location || '';
    qs('#gameSatisfaction').value  = Number(item?.satisfaction || 7);
    qs('#gameNotes').value         = item?.notes || '';

    // prácticas
    const chosen = new Set(item?.practices || []);
    qsa('#practicesChecklist input[type=checkbox]').forEach(ch => ch.checked = chosen.has(ch.value));

    dlg.showModal();
  }

  async function saveGame(e){
    e.preventDefault();
    if (saving) return;           // ⬅️ anti doble submit
    saving = true;
    try{
      const payload = {
        played_on: qs('#gameDate').value,
        kind: qs('#gameKind').value,
        promoter: qs('#gamePromoter').value,
        role: qs('#gameRole').value,
        condom: qs('#gameCondom').value === 'true',
        toys: qs('#gameToys').value === 'true',
        toys_with: (qs('#gameToys').value==='true') ? (qs('#gameToysWith').value || null) : null,
        cream_inside: qs('#gameCream').value,
        location: qs('#gameLocation').value || null,
        satisfaction: Number(qs('#gameSatisfaction').value || 7),
        notes: qs('#gameNotes').value || null
      };
      const selected = qsa('#practicesChecklist input[type=checkbox]').filter(ch=>ch.checked).map(ch=>ch.value);

      if(currentId){
        const { error } = await supa.from('intimacy_games').update(payload).eq('id', currentId);
        if (error) throw error;
        await supa.from('intimacy_game_practices').delete().eq('game_id', currentId);
        if (selected.length){
          const rows = selected.map(k=>({ game_id: currentId, practice_key:k }));
          await supa.from('intimacy_game_practices').insert(rows);
        }
      } else {
        const { data, error } = await supa.from('intimacy_games').insert(payload).select('id').single();
        if (error) throw error;
        const newId = data.id;
        if (selected.length){
          const rows = selected.map(k=>({ game_id: newId, practice_key:k }));
          await supa.from('intimacy_game_practices').insert(rows);
        }
      }
      qs('#gameModal').close();
      refresh();
    }catch(e){ console.error(e); alert('Error al guardar'); }
    finally{ saving=false; }
  }

  function bindOnce(){
    const wrap=qs('#view-juegos'); if(!wrap || wrap.__bound) return;
    wrap.__bound = true;

    const fromI=qs('#gamesFrom'), toI=qs('#gamesTo');
    if(fromI) fromI.value = monthStart();
    if(toI)   toI.value   = monthEnd();
    fromI?.addEventListener('change', refresh);
    toI?.addEventListener('change', refresh);

    qs('#btnAddGame')?.addEventListener('click', ()=> openModal());
    qs('#closeGameModal')?.addEventListener('click', ()=> qs('#gameModal')?.close());
    qs('#deleteGameBtn')?.addEventListener('click', async ()=>{
      if(!currentId) return;
      if(!confirm('¿Eliminar juego?')) return;
      await supa.from('intimacy_game_practices').delete().eq('game_id', currentId);
      await supa.from('intimacy_games').delete().eq('id', currentId);
      qs('#gameModal').close();
      refresh();
    });
    qs('#gameToys')?.addEventListener('change', ()=>{
      qs('#gameToysWith').disabled = (qs('#gameToys').value!=='true');
    });

    const form=qs('#gameForm'); if(form && !form.__bound){ form.__bound=true; form.addEventListener('submit', saveGame); }
  }

  async function init(){
    if(!qs('#view-juegos')) return;
    bindOnce();
    await loadCatalogs();
    await refresh();
  }

  function onRoute(){
    const key=(location.hash||'#/resumen').replace('#/','');
    if(key==='juegos') init();
  }
  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();
