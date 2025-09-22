// Supabase client + servicios (Auth + CRUD contactos, acuerdos y categorías)
(() => {
  const { supabaseUrl, supabaseAnonKey } = window.__NT_CONFIG__ || {};
  if (!supabaseUrl || !supabaseAnonKey || /REEMPLAZA/i.test(String(supabaseAnonKey))) {
    alert("Config inválida: falta ANON KEY real en window.__NT_CONFIG__");
    console.error("Falta supabase config/anon key");
  }

  const sb = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // ===== Auth =====
  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user; // devolvemos el user directo
  }
  async function signOut() { await sb.auth.signOut(); }
  function onAuth(cb) { return sb.auth.onAuthStateChange((_e, s) => cb(s?.user || null)); }
  async function getUser() { const { data:{ user } } = await sb.auth.getUser(); return user; }

  // ===== Contacts =====
  const CONTACTS = 'contacts';
  const contactsT = () => sb.from(CONTACTS);

  async function listContacts({ status } = {}) {
    let q = contactsT().select('*').order('updated_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }
  async function upsertContact(payload) {
    const clean = { ...payload }; if (!clean.id) delete clean.id;
    const { data, error } = await contactsT().upsert(clean).select().single();
    if (error) throw error; return data;
  }
  async function deleteContact(id) { const { error } = await contactsT().delete().eq('id', id); if (error) throw error; }

  // ===== Agreement Categories =====
  const AGRE_CATS = 'agreement_categories';
  const agreCatsT = () => sb.from(AGRE_CATS);

  async function listAgreementCategories({ onlyActive=false }={}) {
    let q = agreCatsT().select('*').order('label', { ascending: true });
    if (onlyActive) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function upsertAgreementCategory({ key, label, active=true }) {
    const { data, error } = await agreCatsT().upsert({ key, label, active }).select().single();
    if (error) throw error; return data;
  }
  async function deleteAgreementCategory(key) {
    const { error } = await agreCatsT().delete().eq('key', key);
    if (error) throw error;
  }

  // ===== Agreements =====
  const AGREEMENTS = 'agreements';
  const AGREEMENTS_VIEW = 'agreements_with_status';
  const agreT = () => sb.from(AGREEMENTS);
  const agreViewT = () => sb.from(AGREEMENTS_VIEW);

  async function listAgreements({ status } = {}) {
    let q = agreViewT().select('*').order('updated_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error; return data;
  }
  async function upsertAgreement(payload) {
    // Inserta/actualiza en la tabla base (la vista es solo para leer)
    const clean = { ...payload }; if (!clean.id) delete clean.id;
    const { data, error } = await agreT().upsert(clean).select().single();
    if (error) throw error; return data;
  }
  async function deleteAgreement(id) {
    const { error } = await agreT().delete().eq('id', id);
    if (error) throw error;
  }

  // ===== Export =====
  window.NT = {
    sb,
    auth: { signIn, signOut, onAuth, getUser },
    contacts: { listContacts, upsertContact, deleteContact },
    agreCats: { listAgreementCategories, upsertAgreementCategory, deleteAgreementCategory },
    agreements: { listAgreements, upsertAgreement, deleteAgreement }
  };
})();
