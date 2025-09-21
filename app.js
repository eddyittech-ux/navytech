// Supabase client + servicios (Auth + CRUD contactos)
(() => {
  const { supabaseUrl, supabaseAnonKey } = window.__NT_CONFIG__ || {};
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Falta supabase config"); return;
  }

  const sb = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // ===== Auth =====
  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }
  async function signOut() { await sb.auth.signOut(); }
  function onAuth(cb) { return sb.auth.onAuthStateChange((_e, s) => cb(s?.user || null)); }
  async function getUser() {
    const { data: { user } } = await sb.auth.getUser();
    return user;
  }

  // ===== Contacts CRUD =====
  const CONTACTS = 'public.contacts';

  async function listContacts({ status } = {}) {
    let q = sb.from(CONTACTS).select('*').order('updated_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function upsertContact(payload) {
    // Si viene id -> update; si no -> insert
    const clean = { ...payload };
    if (!clean.id) delete clean.id;
    const { data, error } = await sb.from(CONTACTS).upsert(clean).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteContact(id) {
    const { error } = await sb.from(CONTACTS).delete().eq('id', id);
    if (error) throw error;
  }

  // ===== Export API to window =====
  window.NT = {
    sb,
    auth: { signIn, signOut, onAuth, getUser },
    contacts: { listContacts, upsertContact, deleteContact }
  };
})();
