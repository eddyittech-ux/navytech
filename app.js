// Supabase client + servicios (Auth + Contactos + Acuerdos + Prácticas + Juegos + Luces)
(() => {
  const { supabaseUrl, supabaseAnonKey } = window.__NT_CONFIG__ || {};
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
  async function getUser() { const { data:{ user } } = await sb.auth.getUser(); return user; }

  // ===== Contactos =====
  const contactsT = () => sb.from('contacts');
  async function listContacts({ status } = {}) {
    let q = contactsT().select('*').order('updated_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q; if (error) throw error; return data;
  }
  async function upsertContact(payload) {
    const clean = { ...payload }; if (!clean.id) delete clean.id;
    const { data, error } = await contactsT().upsert(clean).select().single();
    if (error) throw error; return data;
  }
  async function deleteContact(id) { const { error } = await contactsT().delete().eq('id', id); if (error) throw error; }

  // ===== Categorías de Acuerdos =====
  const agreCatsT = () => sb.from('agreement_categories');
  async function listAgreementCategories({ onlyActive=false }={}) {
    let q = agreCatsT().select('*').order('label', { ascending: true });
    if (onlyActive) q = q.eq('active', true);
    const { data, error } = await q; if (error) throw error; return data;
  }
  async function upsertAgreementCategory({ key, label, active=true }) {
    const { data, error } = await agreCatsT().upsert({ key, label, active }).select().single();
    if (error) throw error; return data;
  }
  async function deleteAgreementCategory(key) { const { error } = await agreCatsT().delete().eq('key', key); if (error) throw error; }

  // ===== Acuerdos (vista con estado) =====
  const agreementsViewT = () => sb.from('agreements_with_status');
  const agreementsT     = () => sb.from('agreements');
  async function listAgreements({ status } = {}) {
    let q = agreementsViewT().select('*').order('updated_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q; if (error) throw error; return data;
  }
  async function upsertAgreement(payload) {
    const clean = { ...payload }; if (!clean.id) delete clean.id;
    const { data, error } = await agreementsT().upsert(clean).select().single();
    if (error) throw error; return data;
  }
  async function deleteAgreement(id) { const { error } = await agreementsT().delete().eq('id', id); if (error) throw error; }

  // ===== Prácticas (Juegos) =====
  const practicesT = () => sb.from('intimacy_practices');
  async function listPractices({ onlyActive=false }={}) {
    let q = practicesT().select('*').order('label', { ascending: true });
    if (onlyActive) q = q.eq('active', true);
    const { data, error } = await q; if (error) throw error; return data;
  }
  async function upsertPractice({ key, label, active=true }) {
    const { data, error } = await practicesT().upsert({ key, label, active }).select().single();
    if (error) throw error; return data;
  }
  async function deletePractice(key) { const { error } = await practicesT().delete().eq('key', key); if (error) throw error; }

  // ===== Locations (sugerencias) =====
  const locationsT = () => sb.from('intimacy_locations');
  async function upsertLocation(name) { if (!name) return; await locationsT().upsert({ name }).select(); }
  async function listLocations() { const { data } = await locationsT().select('name').order('created_at',{ascending:false}).limit(50); return data || []; }

  // ===== Juegos =====
  const gamesT   = () => sb.from('intimacy_games');
  const gamePrT  = () => sb.from('intimacy_game_practices');

  async function listGames() {
    // obtenemos juegos + prácticas asociadas
    const { data: games, error } = await gamesT().select('*').order('played_on',{ascending:false}).order('updated_at',{ascending:false});
    if (error) throw error;
    const ids = games.map(g => g.id);
    let byId = {};
    if (ids.length) {
      const { data: links } = await gamePrT().select('*').in('game_id', ids);
      byId = (links || []).reduce((acc, r)=>{
        (acc[r.game_id] ||= []).push(r.practice_key);
        return acc;
      }, {});
    }
    return games.map(g => ({ ...g, practices: byId[g.id] || [] }));
  }

  async function upsertGame(payload) {
    // payload: {id?, played_on, kind, promoter, condom, role, toys, toys_with, cream_inside, location, satisfaction, notes, practices:[]}
    const copy = { ...payload };
    const practices = copy.practices || [];
    delete copy.practices;
    if (!copy.id) delete copy.id;

    const { data: game, error } = await gamesT().upsert(copy).select().single();
    if (error) throw error;

    // actualizar links (simple: borrar e insertar)
    await gamePrT().delete().eq('game_id', game.id);
    if (practices.length) {
      const rows = practices.map(p => ({ game_id: game.id, practice_key: p }));
      const { error: e2 } = await gamePrT().insert(rows);
      if (e2) throw e2;
    }

    // guardar location para sugerencias
    if (game.location) { await upsertLocation(game.location); }

    return game;
  }

  async function deleteGame(id) {
    // borrar links y juego
    await gamePrT().delete().eq('game_id', id);
    const { error } = await gamesT().delete().eq('id', id);
    if (error) throw error;
  }

  // ===== Luces =====
  const lightsT = () => sb.from('lights');

  async function listLights({ from, to } = {}) {
    let q = lightsT().select('*').order('light_on',{ascending:false}).order('updated_at',{ascending:false});
    if (from) q = q.gte('light_on', from);
    if (to)   q = q.lte('light_on', to);
    const { data, error } = await q; if (error) throw error; return data;
  }

  async function upsertLight(payload) {
    const copy = { ...payload }; if (!copy.id) delete copy.id;
    const { data, error } = await lightsT().upsert(copy).select().single();
    if (error) throw error; return data;
  }

  async function deleteLight(id) { const { error } = await lightsT().delete().eq('id', id); if (error) throw error; }

  // ===== Export =====
  window.NT = {
    sb,
    auth: { signIn, signOut, onAuth, getUser },
    contacts: { listContacts, upsertContact, deleteContact },
    agreCats: { listAgreementCategories, upsertAgreementCategory, deleteAgreementCategory },
    agreements: { listAgreements, upsertAgreement, deleteAgreement },
    practices: { listPractices, upsertPractice, deletePractice },
    locations: { listLocations },
    games: { listGames, upsertGame, deleteGame },
    lights: { listLights, upsertLight, deleteLight }
  };
})();
