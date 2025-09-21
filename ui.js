// Estado UI, router por hash, theming, renderizadores y modal
(() => {
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
  const $$ = (el, show=true) => el.classList.toggle('hidden-vis', !show);

  const views = {
    resumen: qs('#view-resumen'),
    acuerdos: qs('#view-acuerdos'),
    metas: qs('#view-metas'),
    luces: qs('#view-luces'),
    juegos: qs('#view-juegos'),
    ajustes: qs('#view-ajustes'),
  };

  const authCard = qs('#authCard');
  const appViews = qs('#appViews');
  const emailEl = qs('#userEmail');
  const logoutBtn = qs('#logoutBtn');
  const loginForm = qs('#loginForm');
  const themeToggle = qs('#themeToggle');
  const themeLabel = qs('#themeLabel');

  const filterStatus = qs('#filterStatus');
  const addFab = qs('#addContactFab');
  const contactsList = qs('#contactsList');

  const contactModal = qs('#contactModal');
  const modalTitle = qs('#modalTitle');
  const deleteBtn = qs('#deleteBtn');
  const contactForm = qs('#contactForm');

  const idInput = qs('#contactId');
  const ownerInput = qs('#ownerInput');
  const nameInput = qs('#nameInput');
  const categoryInput = qs('#categoryInput');
  const statusInput = qs('#statusInput');
  const actionPlanInput = qs('#actionPlanInput');
  const notesInput = qs('#notesInput');

  // ===== Theme =====
  const THEME_KEY = 'nt-theme';
  function applyTheme(t){
    document.documentElement.classList.toggle('dark', t==='dark');
    themeLabel.textContent = t==='dark' ? 'Light' : 'Dark';
    localStorage.setItem(THEME_KEY, t);
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
  }
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    applyTheme(cur==='dark' ? 'light' : 'dark');
  });

  // ===== Toasts =====
  function toast(msg, type='info') {
    const host = qs('#toastHost');
    const el = document.createElement('div');
    el.className = `gs-card px-4 py-2 text-sm border-l-4 ${type==='error' ? 'border-red-400' : type==='success' ? 'border-emerald-400' : 'border-brand-gold'}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=> el.remove(), 3000);
  }

  // ===== Router =====
  function showView(name) {
    Object.entries(views).forEach(([key, el]) => $$(el, key===name));
    // Render específico
    if (name === 'ajustes') renderContacts();
    if (name === 'resumen') renderResumen();
  }
  function parseRoute() {
    const h = location.hash || '#/resumen';
    const key = h.replace('#/', '');
    if (!views[key]) return showView('resumen');
    showView(key);
  }
  window.addEventListener('hashchange', parseRoute);

  // ===== Auth UI =====
  async function refreshAuthUI(user) {
    if (user) {
      $$(authCard, false);
      $$(appViews, true);
      emailEl.textContent = user.email || '';
      parseRoute();
    } else {
      $$(authCard, true);
      $$(appViews, false);
      emailEl.textContent = '';
    }
  }

  // ===== Login/Logout handlers =====
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('#emailInput').value.trim();
    const password = qs('#passwordInput').value;
    try {
      await window.NT.auth.signIn(email, password);
      toast('Sesión iniciada', 'success');
    } catch (err) {
      console.error(err);
      toast('Error de login (usuario no permitido o credenciales inválidas)', 'error');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await window.NT.auth.signOut();
    toast('Sesión cerrada', 'success');
  });

  window.NT.auth.onAuth(async (user) => refreshAuthUI(user));

  // ===== Resumen =====
  async function renderResumen() {
    const wrap = qs('#resumeStats');
    wrap.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try {
      const all = await window.NT.contacts.listContacts();
      // Mini-métricas iniciales (Fase 1: solo Contactos)
      const total = all.length;
      const bloqueados = all.filter(x => x.status === 'Bloqueado').length;
      const conservados = all.filter(x => x.status === 'Conservado').length;

      wrap.innerHTML = `
        <div class="gs-card p-4">
          <div class="text-xs opacity-70">Contactos</div>
          <div class="text-3xl font-bold text-brand-gold">${total}</div>
          <div class="text-xs opacity-70 mt-1">Totales</div>
        </div>
        <div class="gs-card p-4">
          <div class="text-xs opacity-70">Bloqueados</div>
          <div class="text-3xl font-bold">${bloqueados}</div>
          <div class="text-xs opacity-70 mt-1">Estado</div>
        </div>
        <div class="gs-card p-4">
          <div class="text-xs opacity-70">Conservados</div>
          <div class="text-3xl font-bold">${conservados}</div>
          <div class="text-xs opacity-70 mt-1">Estado</div>
        </div>
      `;
    } catch (e) {
      console.error(e);
      wrap.innerHTML = `<div class="text-sm text-red-300">No se pudieron cargar estadísticas</div>`;
    }
  }

  // ===== Contactos =====
  filterStatus.addEventListener('change', renderContacts);
  addFab.addEventListener('click', () => openModal());

  async function renderContacts() {
    contactsList.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try {
      const status = filterStatus.value || undefined;
      const items = await window.NT.contacts.listContacts({ status });
      if (!items.length) {
        contactsList.innerHTML = `<div class="text-sm opacity-70">Sin contactos.</div>`;
        return;
      }
      contactsList.innerHTML = items.map(cardContact).join('');
      // Wire actions
      qsa('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit');
        const item = items.find(x => x.id === id);
        openModal(item);
      }));
      qsa('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        if (!confirm('¿Eliminar contacto?')) return;
        try {
          await window.NT.contacts.deleteContact(id);
          toast('Eliminado', 'success');
          renderContacts();
          renderResumen();
        } catch (e) { console.error(e); toast('Error al eliminar', 'error'); }
      }));
    } catch (e) {
      console.error(e);
      contactsList.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`;
    }
  }

  function cardContact(c) {
    const ownerColor = c.owner === 'Dani' ? 'from-dani-navy to-slate-600' : 'from-eddy-indigo to-slate-600';
    return `
      <div class="gs-card p-4 flex items-start justify-between">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br ${ownerColor}"></div>
          <div>
            <div class="font-medium">${escapeHtml(c.name || '—')}</div>
            <div class="text-xs opacity-70">${escapeHtml(c.owner || '')} · ${escapeHtml(c.category || '')}</div>
            <div class="mt-2 text-xs opacity-80">${escapeHtml(c.notes || '')}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${c.status ? `<span class="gs-chip">${escapeHtml(c.status)}</span>` : ''}
          <button class="gs-btn bg-white/40 dark:bg-white/10 border border-white/30 text-xs" data-edit="${c.id}">Editar</button>
          <button class="gs-btn bg-white/20 dark:bg-white/5 border border-white/20 text-xs" data-del="${c.id}">Borrar</button>
        </div>
      </div>
    `;
  }

  // ===== Modal =====
  function openModal(item=null) {
    modalTitle.textContent = item ? 'Editar contacto' : 'Nuevo contacto';
    $$(deleteBtn, !!item);
    idInput.value = item?.id || '';
    ownerInput.value = item?.owner || 'Eddy';
    nameInput.value = item?.name || '';
    categoryInput.value = item?.category || 'Verde';
    statusInput.value = item?.status || '';
    actionPlanInput.value = item?.action_plan || '';
    notesInput.value = item?.notes || '';

    contactModal.showModal();
  }
  qs('#closeModal').addEventListener('click', () => contactModal.close());

  deleteBtn.addEventListener('click', async () => {
    const id = idInput.value;
    if (!id) return;
    if (!confirm('¿Eliminar contacto?')) return;
    try {
      await window.NT.contacts.deleteContact(id);
      contactModal.close();
      toast('Eliminado', 'success');
      renderContacts(); renderResumen();
    } catch (e) { console.error(e); toast('Error al eliminar', 'error'); }
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Validación mínima
    if (!nameInput.value.trim()) { toast('Nombre es obligatorio', 'error'); return; }
    try {
      const payload = {
        id: idInput.value || undefined,
        owner: ownerInput.value,
        name: nameInput.value.trim(),
        category: categoryInput.value || null,
        status: statusInput.value || null,
        action_plan: actionPlanInput.value || null,
        notes: notesInput.value || null
      };
      await window.NT.contacts.upsertContact(payload);
      contactModal.close();
      toast('Guardado', 'success');
      renderContacts(); renderResumen();
    } catch (e) {
      console.error(e); toast('Error al guardar (RLS o datos inválidos)', 'error');
    }
  });

  // ===== Utils =====
  function escapeHtml(s='') {
    return String(s).replace(/[&<>"'`=\/]/g, c => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;' }[c]
    ));
  }

  // ===== Init =====
  initTheme();
  (async () => { refreshAuthUI(await window.NT.auth.getUser()); })();
})();
