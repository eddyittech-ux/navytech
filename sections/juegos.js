// section/juegos.js  —  v1.0
// Requisitos: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// Se auto-inicializa y escucha el hash #/juegos para renderizar su UI.

(() => {
  // ====== Config ======
  const SUPABASE_URL  = 'https://zhavnscqhsedrvokeocb.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYXZuc2NxaHNlZHJ2b2tlb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODQ1MDcsImV4cCI6MjA3NDA2MDUwN30.Lace39ORNPoDb5iGz8_hlRTRhH3I1JhvD5sPKwzOiys';

  // ====== Cliente ======
  const sb = (window.NT && window.NT.sb) || (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON));

  // ====== Utils ======
  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const esc = (s='') => String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]));
  const show = (el, v=true) => el && el.classList.toggle('hidden-vis', !v);

  // ====== Estado en memoria ======
  let practicesCache = [];    // {key,label,active}
  let locationsCache = [];    // {name}
  let gamesCache = [];        // rows
  let currentEditId = null;

  // ====== Montaje de layout (si no existe) ======
  function ensureLayout() {
    const wrap = qs('#view-juegos');
    if (!wrap) return;
    if (wrap.__mounted) return;

    wrap.innerHTML = `
      <div class="gs-card p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Juegos</h2>
          <div class="flex items-center gap-2">
            <button id="btnAddGame" class="gs-btn" title="Agregar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="gamesList" class="mt-4 space-y-3"></div>
      </div>

      <dialog id="gameModal" class="gs-modal">
        <form id="gameForm" class="gs-modal-body">
          <div class="gs-modal-head">
            <div class="text-lg font-medium" id="gameModalTitle">Nuevo juego</div>
            <button type="button" id="closeGameModal" class="gs-icon-btn" title="Cerrar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="gs-label">Fecha</label>
              <input id="gameDate" type="date" class="gs-input" required>
            </div>

            <div>
              <label class="gs-label">Tipo</label>
              <select id="gameKind" class="gs-input">
                <option value="juego">Juego</option>
                <option value="mini-juego">Mini-juego</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Promotor</label>
              <select id="gamePromoter" class="gs-input">
                <option>Ambos</option>
                <option>Eddy</option>
                <option>Dani</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Rol</label>
              <select id="gameRole" class="gs-input">
                <option>Ambos versátiles</option>
                <option>Eddy→Dani</option>
                <option>Dani→Eddy</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Condón</label>
              <select id="gameCondom" class="gs-input">
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Juguetes</label>
              <select id="gameToys" class="gs-input">
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Juguetes con</label>
              <select id="gameToysWith" class="gs-input" disabled>
                <option value="">—</option>
                <option value="Eddy">Eddy</option>
                <option value="Dani">Dani</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Lechita adentro</label>
              <select id="gameCream" class="gs-input">
                <option>Ninguno</option>
                <option>Eddy→Dani</option>
                <option>Dani→Eddy</option>
              </select>
            </div>

            <div>
              <label class="gs-label">Lugar</label>
              <input id="gameLocation" class="gs-input" list="locList" placeholder="Cuarto, Sala, Auto…">
              <datalist id="locList"></datalist>
            </div>

            <div>
              <label class="gs-label">Satisfacción (1–10)</label>
              <input id="gameSatisfaction" class="gs-input" type="number" min="1" max="10" step="1" value="7" required>
            </div>

            <div class="md:col-span-2">
              <label class="gs-label">Prácticas</label>
              <div id="practicesChecklist" class="grid grid-cols-1 md:grid-cols-2 gap-2"></div>
            </div>

            <div class="md:col-span-2">
              <label class="gs-label">Notas</label>
              <textarea id="gameNotes" class="gs-input" rows="3" placeholder=""></textarea>
            </div>
          </div>

          <div class="gs-modal-foot">
            <button type="button" id="deleteGameBtn" class="gs-btn danger hidden-vis">Borrar</button>
            <div class="flex-1"></div>
            <button class="gs-btn primary" type="submit">Guardar</button>
          </div>
        </form>
      </dialog>
    `;
    wrap.__mounted = true;

    // Handlers UI
    qs('#btnAddGame')?.addEventListener('click', async () => {
      await loadPracticesAndLocations();
      openGameModal();
    });
    qs('#closeGameModal')?.addEventListener('click', () => qs('#gameModal').close());
    qs('#gameToys')?.addEventListener('change', () => {
      qs('#gameToysWith').disabled = (qs('#gameToys').value !== 'true');
    });
    qs('#deleteGameBtn')?.addEventListener('click', onDeleteGame);
    qs('#gameForm')?.addEventListener('submit', onSubmitGame);
  }

  // ====== Data loads ======
  async function loadPracticesAndLocations() {
    const [pr, loc] = await Promise.all([
      sb.from('intimacy_practices').select('key,label,active').order('label', { ascending: true }),
      sb.from('intimacy_locations').select('name').order('name', { ascending: true })
    ]);
    if (pr.error) throw pr.error;
    if (loc.error) throw loc.error;

    practicesCache = (pr.data || []).filter(p => p.active !== false);
    locationsCache = loc.data || [];

    // Pintar checklist / datalist
    const target = qs('#practicesChecklist');
    if (target) {
      target.innerHTML = practicesCache.map(p => `
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" value="${esc(p.key)}"> <span>${esc(p.label)}</span>
        </label>
      `).join('');
    }
    const dl = qs('#locList');
    if (dl) dl.innerHTML = locationsCache.map(l => `<option value="${esc(l.name)}"></option>`).join('');
  }

  async function listGames() {
    const box = qs('#gamesList');
    if (!box) return;
    box.innerHTML = `<div class="text-sm opacity-70">Cargando…</div>`;

    // Trae juegos + prácticas relacionadas
    const { data, error } = await sb
      .from('intimacy_games')
      .select('id, played_on, kind, promoter, condom, role, toys, toys_with, cream_inside, location, satisfaction, notes, intimacy_game_practices (practice_key)')
      .order('played_on', { ascending: false });

    if (error) {
      console.error(error);
      box.innerHTML = `<div class="text-sm text-red-300">Error al cargar.</div>`;
      return;
    }

    gamesCache = data || [];
    if (!gamesCache.length) {
      box.innerHTML = `<div class="text-sm opacity-70">Sin juegos.</div>`;
      return;
    }

    box.innerHTML = gamesCache.map(g => {
      const plist = (g.intimacy_game_practices || []).map(r => esc(r.practice_key)).map(k => `<span class="gs-chip mr-1">${k}</span>`).join('');
      const v = Number(g.satisfaction || 1);
      const pct = Math.max(1, Math.min(10, v)) / 10;
      const r = 18, C = 2 * Math.PI * r, dash = (C * pct).toFixed(1);
      const color = `hsl(${Math.round(120 * pct)},70%,45%)`;

      return `
        <div class="gs-card p-4 flex items-start justify-between">
          <div>
            <div class="font-medium">${esc(g.kind === 'mini-juego' ? 'Mini-juego' : 'Juego')} · ${esc(g.promoter)} · ${esc(g.played_on)}</div>
            <div class="text-xs opacity-70">${esc(g.role)} · Condón: ${g.condom ? 'Sí' : 'No'} · Juguetes: ${g.toys ? 'Sí' : 'No'} ${g.toys ? `· Con: ${esc(g.toys_with || '—')}` : ''} · Lechita: ${esc(g.cream_inside || 'Ninguno')}</div>
            <div class="text-xs opacity-70 mt-1">Lugar: ${esc(g.location || '—')}</div>
            ${plist ? `<div class="mt-1 text-xs">${plist}</div>` : ''}
            ${g.notes ? `<div class="mt-2 text-xs opacity-80">${esc(g.notes)}</div>` : ''}
          </div>
          <div class="flex items-center gap-3 ml-4">
            <div>
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="${r}" stroke="#e5e7eb" stroke-width="6" fill="none"></circle>
                <circle cx="25" cy="25" r="${r}" stroke="${color}" stroke-width="6" fill="none"
                  stroke-dasharray="${dash} ${C}" stroke-linecap="round" transform="rotate(-90 25 25)"></circle>
                <text x="25" y="30" text-anchor="middle" font-size="12" fill="currentColor">${v}</text>
              </svg>
            </div>
            <button class="gs-btn" data-edit-game="${g.id}" title="Editar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
            <button class="gs-btn" data-del-game="${g.id}" title="Borrar">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    qsa('[data-edit-game]').forEach(b => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-edit-game');
      await loadPracticesAndLocations();
      const it = gamesCache.find(x => x.id === id);
      openGameModal(it);
    }));

    qsa('[data-del-game]').forEach(b => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-del-game');
      if (!confirm('¿Eliminar juego?')) return;
      await deleteGame(id);
      listGames();
    }));
  }

  // ====== Modal ======
  function openGameModal(item = null) {
    const dlg = qs('#gameModal');
    if (!dlg) return;

    currentEditId = item?.id || null;
    qs('#gameModalTitle').textContent = item ? 'Editar juego' : 'Nuevo juego';
    show(qs('#deleteGameBtn'), !!item);

    // set defaults
    const todayIso = new Date().toISOString().slice(0,10);
    qs('#gameDate').value        = item?.played_on || todayIso;
    qs('#gameKind').value        = item?.kind || 'juego';
    qs('#gamePromoter').value    = item?.promoter || 'Ambos';
    qs('#gameRole').value        = item?.role || 'Ambos versátiles';
    qs('#gameCondom').value      = String(item?.condom ?? false);
    qs('#gameToys').value        = String(item?.toys ?? false);
    qs('#gameToysWith').value    = item?.toys_with || '';
    qs('#gameToysWith').disabled = (qs('#gameToys').value !== 'true');
    qs('#gameCream').value       = item?.cream_inside || 'Ninguno';
    qs('#gameLocation').value    = item?.location || '';
    qs('#gameSatisfaction').value= Number(item?.satisfaction || 7);
    qs('#gameNotes').value       = item?.notes || '';

    // marcar prácticas
    const selected = new Set((item?.intimacy_game_practices || []).map(r => r.practice_key));
    qsa('#practicesChecklist input[type=checkbox]').forEach(ch => {
      ch.checked = selected.has(ch.value);
    });

    dlg.showModal();
  }

  async function onDeleteGame() {
    if (!currentEditId) return;
    if (!confirm('¿Eliminar juego?')) return;
    await deleteGame(currentEditId);
    qs('#gameModal').close();
    listGames();
  }

  async function deleteGame(id) {
    // Primero borrar relaciones (por si no hay cascada)
    await sb.from('intimacy_game_practices').delete().eq('game_id', id);
    await sb.from('intimacy_games').delete().eq('id', id);
  }

  async function onSubmitGame(e) {
    e.preventDefault();

    const payload = {
      played_on: qs('#gameDate').value,
      kind: qs('#gameKind').value,
      promoter: qs('#gamePromoter').value,
      role: qs('#gameRole').value,
      condom: qs('#gameCondom').value === 'true',
      toys: qs('#gameToys').value === 'true',
      toys_with: qs('#gameToys').value === 'true' ? (qs('#gameToysWith').value || null) : null,
      cream_inside: qs('#gameCream').value,
      location: qs('#gameLocation').value || null,
      satisfaction: Number(qs('#gameSatisfaction').value || 7),
      notes: qs('#gameNotes').value || null
    };
    const selectedPractices = qsa('#practicesChecklist input[type=checkbox]').filter(ch => ch.checked).map(ch => ch.value);

    if (currentEditId) {
      // update
      const { error } = await sb.from('intimacy_games').update(payload).eq('id', currentEditId);
      if (error) { console.error(error); alert('Error al guardar'); return; }

      await sb.from('intimacy_game_practices').delete().eq('game_id', currentEditId);
      if (selectedPractices.length) {
        const rows = selectedPractices.map(k => ({ game_id: currentEditId, practice_key: k }));
        await sb.from('intimacy_game_practices').insert(rows);
      }
    } else {
      // insert
      const { data, error } = await sb.from('intimacy_games').insert(payload).select('id').single();
      if (error) { console.error(error); alert('Error al guardar'); return; }
      const newId = data.id;

      if (selectedPractices.length) {
        const rows = selectedPractices.map(k => ({ game_id: newId, practice_key: k }));
        await sb.from('intimacy_game_practices').insert(rows);
      }
    }

    qs('#gameModal').close();
    listGames();
  }

  // ====== Router hook ======
  function onRoute() {
    if ((location.hash || '#/resumen').replace('#/', '') !== 'juegos') return;
    ensureLayout();
    Promise.resolve()
      .then(loadPracticesAndLocations)
      .then(listGames)
      .catch(err => {
        console.error(err);
        const box = qs('#gamesList');
        if (box) box.innerHTML = `<div class="text-sm text-red-300">Error al cargar.</div>`;
      });
  }

  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
})();
