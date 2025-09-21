// Supabase client + servicios (Auth + CRUD contactos)
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
    return data.user;
  }
  async function signOut() { await sb.auth.signOut(); }
  function onAuth(cb) { return sb.auth.onAuthStateChange((_e, s) => cb(s?.user || null)); }
  async function getUser() {
    const { data: { user } } = await sb.auth.getUser();
    return user;
  }

  // ===== Contacts CRUD =====
const CONTACTS = 'contacts'; // <- sin "public."

function contactsFrom() {
  // si algún día cambias a otro esquema, usa .schema('otro').from(CONTACTS)
  return window.NT.sb.from(CONTACTS);
}

async function listContacts({ status } = {}) {
  let q = contactsFrom().select('*').order('updated_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function upsertContact(payload) {
  const clean = { ...payload };
  if (!clean.id) delete clean.id; // insert -> usa DEFAULT gen_random_uuid()
  const { data, error } = await contactsFrom().upsert(clean).select().single();
  if (error) throw error;
  return data;
}

async function deleteContact(id) {
  const { error } = await contactsFrom().delete().eq('id', id);
  if (error) throw error;
}


  // ===== Export API to window =====
  window.NT = {
    sb,
    auth: { signIn, signOut, onAuth, getUser },
    contacts: { listContacts, upsertContact, deleteContact }
  };
})();
