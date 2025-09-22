/* app.js v0.4.10 — NavyTech
   - Supabase client + Auth
   - Servicios: contacts, agreCats, agreements, practices, locations, games, lights, goals
*/

(() => {
  // --------- Supabase ----------
  const SUPABASE_URL = 'https://zhavnscqhsedrvokeocb.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYXZuc2NxaHNlZHJ2b2tlb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODQ1MDcsImV4cCI6MjA3NDA2MDUwN30.Lace39ORNPoDb5iGz8_hlRTRhH3I1JhvD5sPKwzOiys';

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  // Exponer
  window.NT = window.NT || {};
  window.NT.db = client;

  // --------- Auth helpers ----------
  window.NT.auth = {
    onAuth(cb){ client.auth.onAuthStateChange((_e, s)=> cb(s?.user||null)); },
    async getUser(){ const { data } = await client.auth.getUser(); return data.user || null; },
    async signIn(email, password){
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    async signOut(){ await client.auth.signOut(); }
  };

  // --------- Servicios ----------
  // CONTACTS
  window.NT.contacts = (() => {
    const table='contacts';
    async function listContacts({ status } = {}){
      let q = client.from(table).select('*').order('updated_at', { ascending:false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    async function upsertContact(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deleteContact(id){
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    return { listContacts, upsertContact, deleteContact };
  })();

  // AGREEMENT CATEGORIES
  window.NT.agreCats = (() => {
    const table='agreement_categories';
    async function listAgreementCategories({ onlyActive=false } = {}){
      let q = client.from(table).select('*').order('label', { ascending:true });
      if (onlyActive) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    async function upsertAgreCat(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deleteAgreCat(key){
      const { error } = await client.from(table).delete().eq('key', key);
      if (error) throw error;
      return true;
    }
    return { listAgreementCategories, upsertAgreCat, deleteAgreCat };
  })();

  // AGREEMENTS
  window.NT.agreements = (() => {
    const table='agreements';
    async function listAgreements({ status } = {}){
      let q = client.from(table).select('*').order('created_on', { ascending:false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    async function upsertAgreement(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deleteAgreement(id){
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    return { listAgreements, upsertAgreement, deleteAgreement };
  })();

  // PRACTICES
  window.NT.practices = (() => {
    const table='practices';
    async function listPractices({ onlyActive=false } = {}){
      let q = client.from(table).select('*').order('label', { ascending:true });
      if (onlyActive) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    async function upsertPractice(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deletePractice(key){
      const { error } = await client.from(table).delete().eq('key', key);
      if (error) throw error;
      return true;
    }
    return { listPractices, upsertPractice, deletePractice };
  })();

  // LOCATIONS (para juegos; se puede almacenar como tabla simple)
  window.NT.locations = (() => {
    const table='locations';
    async function listLocations(){
      const { data, error } = await client.from(table).select('*').order('name',{ascending:true});
      if (error && error.code !== '42P01') return []; // por si no existe la tabla
      return data || [];
    }
    return { listLocations };
  })();

  // GAMES
  window.NT.games = (() => {
    const table='games';
    async function listGames(){
      const { data, error } = await client.from(table).select('*').order('played_on',{ascending:false});
      if (error) throw error;
      return data || [];
    }
    async function upsertGame(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deleteGame(id){
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    return { listGames, upsertGame, deleteGame };
  })();

  // LIGHTS
  window.NT.lights = (() => {
    const table='lights';
    async function listLights({ from, to } = {}){
      let q = client.from(table).select('*').order('light_on', { ascending:false });
      if (from) q = q.gte('light_on', from);
      if (to)   q = q.lte('light_on', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    async function upsertLight(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deleteLight(id){
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    return { listLights, upsertLight, deleteLight };
  })();

  // GOALS (METAS)
  window.NT.goals = (() => {
    const table='goals';
    async function listGoals({ promoter, status } = {}){
      let q = client.from(table).select('*').order('deadline',{ascending:true});
      if (promoter && promoter !== 'Todos') q = q.eq('promoter', promoter);
      if (status && status !== 'todas') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    async function upsertGoal(payload){
      const { data, error } = await client.from(table).upsert(payload).select().single();
      if (error) throw error;
      return data;
    }
    async function deleteGoal(id){
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    return { listGoals, upsertGoal, deleteGoal };
  })();

  // logout btn
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logoutBtn');
    btn?.addEventListener('click', async () => { await window.NT.auth.signOut(); location.hash = '#/resumen'; location.reload(); });
  });
})();
