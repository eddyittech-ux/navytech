/* app.js v0.5 — NavyTech
   - Supabase init
   - Auth helpers
   - Servicios: contacts, agreCats, agreements, practices, locations, games, lights, goals
*/

(() => {
  // ===== Supabase =====
  const SUPABASE_URL = "https://zhavnscqhsedrvokeocb.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYXZuc2NxaHNlZHJ2b2tlb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODQ1MDcsImV4cCI6MjA3NDA2MDUwN30.Lace39ORNPoDb5iGz8_hlRTRhH3I1JhvD5sPKwzOiys";

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });

  // Exponer namespace
  window.NT = window.NT || {};
  window.NT.db = client;

  // ===== Auth =====
  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }
  async function signOut() {
    const { error } = await client.auth.signOut(); if (error) throw error; return true;
  }
  async function getUser() {
    const { data } = await client.auth.getUser(); return data?.user || null;
  }
  function onAuth(cb) {
    client.auth.onAuthStateChange((_evt, sess)=> cb(sess?.user || null));
  }

  window.NT.auth = { signIn, signOut, getUser, onAuth };

  // ===== Helpers =====
  const selAll = async (q) => { const { data, error } = await q; if (error) throw error; return data || []; };
  const selOne = async (q) => { const { data, error } = await q.select().single(); if (error) throw error; return data; };

  // ===== Contacts =====
  window.NT.contacts = (() => {
    const T = 'contacts';
    async function listContacts({ status } = {}) {
      let q = client.from(T).select('*').order('updated_at', { ascending: false });
      if (status) q = q.eq('status', status);
      return selAll(q);
    }
    async function upsertContact(payload) { return selOne(client.from(T).upsert(payload)); }
    async function deleteContact(id) { const { error } = await client.from(T).delete().eq('id', id); if (error) throw error; return true; }
    return { listContacts, upsertContact, deleteContact };
  })();

  // ===== Agreement Categories =====
  window.NT.agreCats = (() => {
    const T='agreement_categories';
    async function listAgreementCategories({ onlyActive } = {}) {
      let q = client.from(T).select('*').order('label', { ascending: true });
      if (onlyActive) q = q.eq('active', true);
      return selAll(q);
    }
    return { listAgreementCategories };
  })();

  // ===== Agreements =====
  window.NT.agreements = (() => {
    const T='agreements';
    async function listAgreements({ status } = {}) {
      let q = client.from(T).select('*').order('created_on', { ascending: false });
      if (status) q = q.eq('status', status);
      return selAll(q);
    }
    async function upsertAgreement(payload){ return selOne(client.from(T).upsert(payload)); }
    async function deleteAgreement(id){ const { error } = await client.from(T).delete().eq('id', id); if (error) throw error; return true; }
    return { listAgreements, upsertAgreement, deleteAgreement };
  })();

  // ===== Practices =====
  window.NT.practices = (() => {
    const T='practices';
    async function listPractices({ onlyActive } = {}) {
      let q = client.from(T).select('*').order('label', { ascending: true });
      if (onlyActive) q = q.eq('active', true);
      return selAll(q);
    }
    async function upsertPractice(payload){ return selOne(client.from(T).upsert(payload)); }
    async function deletePractice(key){ const { error } = await client.from(T).delete().eq('key', key); if (error) throw error; return true; }
    return { listPractices, upsertPractice, deletePractice };
  })();

  // ===== Locations (for juegos) =====
  window.NT.locations = (() => {
    const T='locations';
    async function listLocations(){ try { return await selAll(client.from(T).select('*').order('name', { ascending: true })); } catch { return []; } }
    return { listLocations };
  })();

  // ===== Games =====
  window.NT.games = (() => {
    const T='games';
    async function listGames(){ return selAll(client.from(T).select('*').order('played_on',{ascending:false})); }
    async function upsertGame(payload){ return selOne(client.from(T).upsert(payload)); }
    async function deleteGame(id){ const { error } = await client.from(T).delete().eq('id', id); if (error) throw error; return true; }
    return { listGames, upsertGame, deleteGame };
  })();

  // ===== Lights =====
  window.NT.lights = (() => {
    const T='lights';
    async function listLights({ from, to } = {}) {
      let q = client.from(T).select('*').order('light_on', { ascending:false });
      if (from) q = q.gte('light_on', from);
      if (to)   q = q.lte('light_on', to);
      return selAll(q);
    }
    async function upsertLight(payload){ return selOne(client.from(T).upsert(payload)); }
    async function deleteLight(id){ const { error } = await client.from(T).delete().eq('id', id); if (error) throw error; return true; }
    return { listLights, upsertLight, deleteLight };
  })();

  // ===== Goals =====
  window.NT.goals = (() => {
    const T='goals';
    async function listGoals({ promoter, status } = {}) {
      let q = client.from(T).select('*').order('deadline',{ascending:true});
      if (promoter && promoter!=='Todos') q = q.eq('promoter', promoter);
      if (status && status!=='todas') q = q.eq('status', status);
      return selAll(q);
    }
    async function upsertGoal(payload){ return selOne(client.from(T).upsert(payload)); }
    async function deleteGoal(id){ const { error } = await client.from(T).delete().eq('id', id); if (error) throw error; return true; }
    return { listGoals, upsertGoal, deleteGoal };
  })();

})();
