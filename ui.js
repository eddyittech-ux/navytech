// ui.js — tema, router, login, utilidades
(() => {
  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const $$  = (el, show=true) => el && el.classList.toggle('hidden-vis', !show);

  // ✅ Toast disponible SIEMPRE (scope local + window.NT.ui)
  function toast(msg, type='info'){
    const el = document.createElement('div');
    el.role = 'status';
    el.className = [
      'fixed right-4 bottom-4 z-[1000]',
      'px-4 py-2 rounded-md shadow-lg text-sm text-white',
      type==='error' ? 'bg-red-600' : type==='success' ? 'bg-emerald-600' : 'bg-amber-600'
    ].join(' ');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2500);
  }

  // ---- Tema (dark/light)
  const THEME_KEY = 'nt-theme';
  const iconSun  = () => `<circle cx="12" cy="12" r="4" stroke-width="1.6"></circle>
  <g stroke-width="1.6" stroke-linecap="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.2 4.2l1.4 1.4"/><path d="M18.4 18.4l1.4 1.4"/><path d="M19.8 4.2l-1.4 1.4"/><path d="M5.6 18.4l-1.4 1.4"/></g>`;
  const iconMoon = () => `<path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" stroke-width="1.6" fill="none"></path>`;

  function setThemeIcon(theme){
    const svg = document.querySelector('#themeIcon');
    if (!svg) return;
    svg.innerHTML = theme==='dark' ? iconMoon() : iconSun();
  }

  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    setThemeIcon(theme);
  }

  function initTheme(){
    const saved = localStorage.getItem(THEME_KEY)
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
  }

  document.querySelector('#themeToggle')?.addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur==='dark' ? 'light' : 'dark');
  });

  // ---- Router / views
  function views() {
    return {
      resumen:  qs('#view-resumen'),
      acuerdos: qs('#view-acuerdos'),
      luces:    qs('#view-luces'),
      ajustes:  qs('#view-ajustes'),
      metas:    qs('#view-metas'),
    };
  }

  function highlightNav(){
    const key=(location.hash||'#/resumen').replace('#/','');
    qsa('#mainNav .nav-link').forEach(a=>{
      const h=a.getAttribute('href').replace('#/','');
      a.classList.toggle('active', h===key);
    });
  }

  async function showView(name){
    // Antes (peligroso si NT.sections no existe aún):
// if (name==='resumen') NT.sections.resumen?.render?.();

// Después (seguro):
const S = window.NT?.sections;
if (name==='resumen') S?.resumen?.render?.();
if (name==='acuerdos') S?.acuerdos?.render?.();
if (name==='luces')    (S?.luces?.init?.() ?? window.dispatchEvent(new Event('hashchange')));
if (name==='ajustes')  { S?.ajustes?.renderContacts?.(); S?.ajustes?.renderPractices?.(); }
if (name==='metas')    S?.metas?.render?.();
 }

  function parseRoute(){
    if(!location.hash) location.hash='#/resumen';
    const key=(location.hash||'#/resumen').replace('#/','');
    const v=views();
    showView(v[key]?key:'resumen');
  }
  window.addEventListener('hashchange', parseRoute);

  // ---- Auth + header
  function authCard(){ return qs('#authCard'); }
  function appViews(){ return qs('#appViews'); }

  async function refreshAuthUI(user){
    const logged = !!user;
    $$(authCard(), !logged);
    $$(appViews(), logged);
    $$(qs('#mainNav'), logged);
    const email = user?.email || '';
    const tip = qs('#userTooltip');
    if (tip) tip.textContent = email;
    if (logged) parseRoute();
  }

  qs('#logoutBtn')?.addEventListener('click', async () => {
    try { await NT.auth.signOut(); location.hash='#/resumen'; } catch(e){}
  });

  // ---- Login
  function attachLogin(){
    const form = qs('#loginForm'), btn = qs('#loginBtn');
    if (!form) return;
    form.addEventListener('submit', async (e)=> {
      e.preventDefault();
      const email = qs('#emailInput').value.trim();
      const password = qs('#passwordInput').value;
      if (!email || !password) return toast('Completa email y password','error');
      try{
        btn.disabled=true; btn.textContent='Entrando…';
        const user = await NT.auth.signIn(email, password);
        toast('Sesión iniciada','success');
        await refreshAuthUI(user);
      } catch (err) {
        console.error('signIn error:', err);
        (window.NT?.ui?.toast || ((m)=>alert(m)))(err?.message || 'Error de login', 'error');
      } finally {
        btn.disabled=false; btn.textContent='Entrar';
      }
    });
  }

  // ---- Init
  window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    attachLogin();
    NT.auth.onAuth((u)=> refreshAuthUI(u));
    const u = await NT.auth.getUser().catch(()=>null);
    refreshAuthUI(u);
  });

  // ---- Export para otros módulos (incluye toast)
  window.NT = window.NT || {};
  window.NT.ui = { qs, qsa, $$, parseRoute, toast };
})();

// AGREGA esto al final del archivo (después de exportar NT.ui está bien):
window.addEventListener('load', () => {
  // solo navegar cuando ya todo lo defer se evaluó
  if (location.hash) parseRoute();
});
