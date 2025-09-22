// sections/metas.js
(() => {
  const { qs, qsa, toast } = NT.ui;
  let fpGoal;
  function bind(){
    qs('#goalsFilterWho')?.addEventListener('change', render);
    qs('#goalsFilterDone')?.addEventListener('change', render);
    qs('#addGoalBtn')?.addEventListener('click', openAdd);
  }
  function openAdd(item=null){
    const title = prompt('Meta:', item?.goal||''); if (!title) return;
    const who = prompt('Promotor (Eddy|Dani|Ambos):', item?.promoter||'Ambos') || 'Ambos';
    const deadline = prompt('Fecha límite (YYYY-MM-DD):', item?.deadline||new Date().toISOString().slice(0,10));
    const done = (item?.done) ? item.done : false;
    NT.goals.upsert({ id:item?.id, goal:title, promoter:who, deadline, done })
      .then(()=> { toast('Guardado','success'); render(); })
      .catch(e=>{ console.error(e); toast('Error','error'); });
  }
  async function render(){
    const list = qs('#goalsList'); if (!list) return;
    list.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      const who = qs('#goalsFilterWho').value || '';
      const doneVal = qs('#goalsFilterDone').value;
      const items = await NT.goals.list({ who: who||undefined, done: doneVal===''?null:doneVal });
      if(!items.length){ list.innerHTML = `<div class="text-sm opacity-70">Sin metas.</div>`; return; }
      list.innerHTML = items.map(g=>`
        <div class="gs-card p-4 flex items-center justify-between">
          <div>
            <div class="font-medium">${g.goal}</div>
            <div class="text-xs opacity-70">${g.promoter} · ${g.deadline} ${g.done?'· ✅':''}</div>
          </div>
          <div class="flex gap-2">
            <button class="gs-btn" data-done="${g.id}" title="Toggle done">${g.done?'Desmarcar':'Cumplida'}</button>
            <button class="gs-btn" data-edit="${g.id}" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6"/></svg></button>
            <button class="gs-btn" data-del="${g.id}" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6"/></svg></button>
          </div>
        </div>`).join('');

      qsa('[data-edit]').forEach(b => b.addEventListener('click', ()=>{
        const id=b.getAttribute('data-edit'); const it=items.find(x=>x.id===id); openAdd(it);
      }));
      qsa('[data-del]').forEach(b => b.addEventListener('click', async ()=>{
        const id=b.getAttribute('data-del'); if(!confirm('¿Eliminar meta?')) return;
        await NT.goals.delete(id); toast('Eliminada','success'); render();
      }));
      qsa('[data-done]').forEach(b => b.addEventListener('click', async ()=>{
        const id=b.getAttribute('data-done'); const it=items.find(x=>x.id===id);
        await NT.goals.upsert({ id, done: !it.done }); render();
      }));
    }catch(e){ console.error(e); list.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`; }
  }
  bind();
  window.NT.sections.metas = { render };
})();
