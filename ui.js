// UI state, router, theming, auth gating, CRUD contactos
(() => {
  const onReady = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
  const $$  = (el, show=true) => el.classList.toggle('hidden-vis', !show);

  const views = {
    resumen: qs('#view-resumen'),
    acuerdos: qs('#view-acuerdos'),
    metas: qs('#view-metas'),
    luces: qs('#view-luces'),
    juegos: qs('#view-juegos'),
    ajustes: qs('#view-ajustes'),
  };

  const mainNav     = qs('#mainNav');
  const authActions = qs('#authActions');

  // ===== Theme =====
  const THEME_KEY = 'nt-theme';
  function setThemeIcon(theme){
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    icon.innerHTML = theme==='dark'
      ? '<svg class="gs-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
      : '<svg class="gs-icon" viewBox="0 0 24 24" fill="none"><path d="M20 12.5A8 8 0 1 1 11.5 4a6.5 6.5 0 1 0 8.5 8.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function applyTheme(t){
    document.documentElement.classList.toggle('dark', t==='dark');
    localStorage.setItem(THEME_KEY, t);
    setThemeIcon(t);
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
  }
  onReady(() => {
    qs('#themeToggle')?.addEventListener('click', () => {
      const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      applyTheme(cur==='dark' ? 'light' : 'dark');
    });
  });

  // ===== Toasts =====
  function toast(msg, type='info') {
    const host = qs('#toastHost');
    const el = document.createElement('div');
    el.className = `gs-card px-4 py-2 text-sm border-l-4 ${type==='error' ? 'border-red-400' : type==='success' ? 'border-emerald-400' : 'border-[#C7A740]'}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=> el.remove(), 3000);
  }

  // ===== Router =====
  function highlightActiveNav() {
    const key = (location.hash || '#/resumen').replace('#/','');
    qsa('#mainNav .nav-link').forEach(a=>{
      const href = a.getAttribute('href').replace('#/','');
      a.classList.toggle('active', href === key);
    });
  }
  function showView(name) {
    Object.entries(views).forEach(([key, el]) => $$(el, key===name));
    if (name === 'ajustes') renderContacts();
    if (name === 'resumen') renderResumen();
    highlightActiveNav();
  }
  function parseRoute() {
    if (!location.hash) location.hash = '#/resumen';
    const key = (location.hash || '#/resumen').replace('#/','');
    if (!views[key]) return showView('resumen');
    showView(key);
  }
  window.addEventListener('hashchange', parseRoute);

  // ===== Auth gating =====
  const authCard = qs('#authCard');
  const appViews = qs('#appViews');

  async function refreshAuthUI(user) {
    const isIn = !!user;
    $$(authCard, !isIn);
    $$(appViews,  isIn);
    $$(mainNav,   isIn);
    $$(authActions, isIn);

    const tip = document.getElementById('userTooltip');
    if (tip) tip.textContent = isIn ? (user.email || '') : '';

    if (isIn) {
      if (!location.hash) location.hash = '#/resumen';
      parseRoute();
    }
  }

  // ===== Login/Logout =====
  onReady(() => {
    const loginForm = qs('#loginForm');
    const loginBtn  = qs('#loginBtn');

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = qs('#emailInput').value.trim();
      const password = qs('#passwordInput').value;
      if (!window.NT?.auth?.signIn) {
        toast('Config inválida (NT no inicializado). Revisa ANON KEY/URL.', 'error');
        return;
      }
      if (loginBtn){ loginBtn.disabled = true; loginBtn.style.opacity = .6; loginBtn.textContent = 'Entrando…'; }
      try {
        // 🔥 usamos el user DEVUELTO por signIn para refrescar al instante
        const signedUser = await window.NT.auth.signIn(email, password);
        toast('Sesión iniciada', 'success');
        await refreshAuthUI(signedUser);
      } catch (err) {
        console.error(err);
        toast(`Login failed: ${err.message || 'credenciales inválidas'}`, 'error');
      } finally {
        if (loginBtn){ loginBtn.disabled = false; loginBtn.style.opacity = 1; loginBtn.textContent = 'Entrar'; }
      }
    });

    qs('#logoutBtn')?.addEventListener('click', async () => {
      await window.NT.auth.signOut();
      toast('Sesión cerrada', 'success');
    });

    // suscripción a cambios de auth (recibe user desde app.js)
    if (window.NT?.auth?.onAuth) {
      window.NT.auth.onAuth((user) => { refreshAuthUI(user); });
    }
  });

  // Init con sesión previa
  onReady(async () => {
    initTheme();
    if (window.NT?.auth?.getUser) {
      const user = await window.NT.auth.getUser();
      refreshAuthUI(user);
    } else {
      refreshAuthUI(null);
    }
  });

  // ===== Resumen =====
  async function renderResumen() {
    const wrap = qs('#resumeStats');
    if (!window.NT?.contacts?.listContacts) {
      wrap.innerHTML = `<div class="text-sm text-red-300">Config inválida: NT no listo</div>`;
      return;
    }
    wrap.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try {
      const all = await window.NT.contacts.listContacts();
      const total = all.length;
      const bloqueados = all.filter(x => x.status === 'Bloqueado').length;
      const conservados = all.filter(x => x.status === 'Conservado').length;

      wrap.innerHTML = `
        <div class="gs-card p-4">
          <div class="text-xs opacity-70">Contactos</div>
          <div class="text-3xl font-bold" style="color:#C7A740">${total}</div>
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

  // ===== Contactos (CRUD) =====
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
  const aliasInput = qs('#aliasInput');
  const categoryInput = qs('#categoryInput');
  const statusInput = qs('#statusInput');
  const treatmentInput = qs('#treatmentInput');
  const notesInput = qs('#notesInput');

  filterStatus?.addEventListener('change', renderContacts);
  addFab?.addEventListener('click', () => openModal());

  async function renderContacts() {
    if (!window.NT?.contacts?.listContacts) return;
    contactsList.innerHTML = `<div class="text-sm opacity-70">Cargando...</div>`;
    try {
      const status = filterStatus.value || undefined;
      const items = await window.NT.contacts.listContacts({ status });
      if (!items.length) {
        contactsList.innerHTML = `<div class="text-sm opacity-70">Sin contactos.</div>`;
        return;
      }
      contactsList.innerHTML = items.map(cardContact).join('');
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
          renderContacts(); renderResumen();
        } catch (e) { console.error(e); toast('Error al eliminar', 'error'); }
      }));
    } catch (e) {
      console.error(e);
      contactsList.innerHTML = `<div class="text-sm text-red-300">Error al cargar</div>`;
    }
  }

  function cardContact(c) {
    const ownerColor = c.owner === 'Dani' ? 'background:linear-gradient(135deg,#163054,#334155)' : 'background:linear-gradient(135deg,#3F3D8F,#334155)';
    const nameLine = escapeHtml(c.alias ? `${c.name} · ${c.alias}` : (c.name || '—'));
    return `
      <div class="gs-card p-4 flex items-start justify-between">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl" style="${ownerColor}"></div>
          <div>
            <div class="font-medium">${nameLine}</div>
            <div class="text-xs opacity-70">${escapeHtml(c.owner || '')} · ${escapeHtml(c.category || '')}</div>
            ${c.treatment ? `<div class="mt-1 text-xs"><span class="gs-chip">${escapeHtml(c.treatment)}</span></div>` : ''}
            ${c.notes ? `<div class="mt-2 text-xs opacity-80">${escapeHtml(c.notes)}</div>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${c.status ? `<span class="gs-chip">${escapeHtml(c.status)}</span>` : ''}
          <button class="gs-btn text-xs" data-edit="${c.id}">Editar</button>
          <button class="gs-btn text-xs" data-del="${c.id}">Borrar</button>
        </div>
      </div>
    `;
  }

  function openModal(item=null) {
    modalTitle.textContent = item ? 'Editar contacto' : 'Nuevo contacto';
    $$(deleteBtn, !!item);
    idInput.value = item?.id || '';
    ownerInput.value = item?.owner || 'Eddy';
    nameInput.value = item?.name || '';
    aliasInput.value = item?.alias || '';
    categoryInput.value = item?.category || 'Verde';
    statusInput.value = item?.status || '';
    treatmentInput.value = item?.treatment || '';
    notesInput.value = item?.notes || '';
    contactModal.showModal();
  }
  qs('#closeModal')?.addEventListener('click', () => contactModal.close());

  deleteBtn?.addEventListener('click', async () => {
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

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!nameInput.value.trim()) { toast('Nombre es obligatorio', 'error'); return; }
    try {
      const payload = {
        id: idInput.value || undefined,
        owner: ownerInput.value,
        name: nameInput.value.trim(),
        alias: aliasInput.value || null,
        category: categoryInput.value || null,
        status: statusInput.value || null,
        treatment: treatmentInput.value || null,
        notes: notesInput.value || null
      };
      await window.NT.contacts.upsertContact(payload);
      contactModal.close();
      toast('Guardado', 'success');
      renderContacts(); renderResumen();
    } catch (e) {
      console.error(e);
      toast(`Error al guardar: ${e.message || 'RLS o datos inválidos'}`, 'error');
    }
  });

  function escapeHtml(s='') {
    return String(s).replace(/[&<>"'`=\/]/g, c => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;' }[c]
    ));
  }
})();
