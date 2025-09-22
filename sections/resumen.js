// sections/resumen.js
(() => {
  async function render(){
    const wrap = document.querySelector('#resumeStats'); if (!wrap) return;
    wrap.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;
    try{
      const [agre, lights, goals] = await Promise.all([
        NT.agreements.list({}),
        NT.lights.list({}),
        NT.goals.list({})
      ]);
      const aprob = agre.filter(a=>a.status==='Aprobado').length;
      const pend  = agre.filter(a=>a.status==='Pendiente').length;
      const now = new Date(), start = new Date('2025-09-14');
      const dias = Math.floor((now - start)/86400000);
      const last30 = lights.filter(l => (now - new Date(l.light_on)) <= 30*86400000);

      wrap.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Días desde reinicio</div>
            <div class="text-4xl font-extrabold" style="color:#C7A740">${dias}</div>
            <div class="text-xs opacity-70">Iniciado el 14/09/2025</div>
          </div>
          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Acuerdos</div>
            <div class="flex items-end gap-2 mt-1">
              <div class="text-3xl font-extrabold text-emerald-400">${aprob}</div>
              <div class="text-sm text-red-400">Pend: ${pend}</div>
            </div>
          </div>
          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Luces (30d)</div>
            <div class="text-3xl font-bold">${last30.length}</div>
          </div>
          <div class="gs-card p-4">
            <div class="text-xs opacity-70">Metas</div>
            <div class="text-3xl font-bold">${goals.length}</div>
          </div>
        </div>`;
    }catch(e){ console.error(e); wrap.innerHTML = `<div class="text-sm text-red-300">No se pudo cargar</div>`; }
  }
  window.NT.sections.resumen = { render };
})();
