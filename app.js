// app.js v0.6 — cliente Supabase + servicios con alias compatibles

window.NT = window.NT || {};
NT.sections = NT.sections || {}; // evita set de propiedad sobre undefined


window.NT = window.NT || {};
NT.sections = NT.sections || {};   // 👈 evita "Cannot set properties of undefined (setting 'resumen')"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = 'https://zhavnscqhsedrvokeocb.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYXZuc2NxaHNlZHJ2b2tlb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODQ1MDcsImV4cCI6MjA3NDA2MDUwN30.Lace39ORNPoDb5iGz8_hlRTRhH3I1JhvD5sPKwzOiys';

// Cliente supabase (nombre CONSISTENTE: "supa")
export const supa = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Exponer cliente para otros módulos
window.NT = window.NT || {};
window.NT.supa = supa;

// ========== AUTH ==========
const auth = {
  async signIn(email, password) {
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signOut() { await supa.auth.signOut(); },
  async getUser() {
    const { data } = await supa.auth.getUser();
    return data.user || null;
  },
  onAuth(cb) { supa.auth.onAuthStateChange((_e, sess) => cb(sess?.user || null)); },
};

// ========== CONTACTOS ==========
const contacts = {
  async list({ status } = {}) {
    let q = supa.from('contacts').select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q; if (error) throw error; return data || [];
  },
  async upsert(payload) {
    const { data, error } = await supa.from('contacts').upsert(payload).select().single();
    if (error) throw error; return data;
  },
  async delete(id) { const { error } = await supa.from('contacts').delete().eq('id', id); if (error) throw error; },
};

// ========== ACUERDOS ==========
const agreCats = {
  async list() { const { data, error } = await supa.from('agreement_categories').select('*').order('label'); if (error) throw error; return data || []; },
};
const agreements = {
  async list({ status } = {}) {
    let q = supa.from('agreements').select('*').order('created_on', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q; if (error) throw error; return data || [];
  },
  async upsert(payload) { const { data, error } = await supa.from('agreements').upsert(payload).select().single(); if (error) throw error; return data; },
  async delete(id) { const { error } = await supa.from('agreements').delete().eq('id', id); if (error) throw error; },
};

// ========== LUCES (con ALIAS que esperan tus secciones) ==========
const lights = {
  async list({ from, to, who } = {}) {
    let q = supa.from('lights').select('*').order('light_on', { ascending: false });
    if (from) q = q.gte('light_on', from);
    if (to)   q = q.lte('light_on', to);
    if (who)  q = q.eq('who', who);
    const { data, error } = await q; if (error) throw error; return data || [];
  },
  async upsert(payload) {
    const { data, error } = await supa.from('lights').upsert(payload).select().single();
    if (error) throw error; return data;
  },
  async delete(id) { const { error } = await supa.from('lights').delete().eq('id', id); if (error) throw error; },

  // === ALIAS usados por sections/luces.js ===
  async listLights(args) { return this.list(args); },
  async upsertLight(payload) { return this.upsert(payload); },
  async deleteLight(id) { return this.delete(id); },
};

const lightEmotions = {
  async list() { const { data, error } = await supa.from('light_emotions').select('*').order('label'); if (error) throw error; return data || []; },
  // alias por si alguna sección los pide así
  async listEmotions() { return this.list(); },
};

// ========== PRÁCTICAS / LOCATIONS para JUEGOS ==========
const practices = {
  async list() { const { data, error } = await supa.from('intimacy_practices').select('*').order('label'); if (error) throw error; return data || []; },
  async upsert(payload) { const { data, error } = await supa.from('intimacy_practices').upsert(payload).select().single(); if (error) throw error; return data; },
  async delete(key) { const { error } = await supa.from('intimacy_practices').delete().eq('key', key); if (error) throw error; },
  // alias para sections/juegos.js
  async listPractices() { return this.list(); },
};

const locations = {
  async list() { const { data, error } = await supa.from('intimacy_locations').select('*').order('name'); if (error) throw error; return data || []; },
  async listLocations() { return this.list(); }, // alias
};

// ========== METAS ==========
const goals = {
  async list({ who, done } = {}) {
    let q = supa.from('goals').select('*').order('deadline', { ascending: true });
    if (who) q = q.eq('promoter', who);
    if (done != null) q = q.eq('done', done === true || done === 'true');
    const { data, error } = await q; if (error) throw error; return data || [];
  },
  async upsert(payload) { const { data, error } = await supa.from('goals').upsert(payload).select().single(); if (error) throw error; return data; },
  async delete(id) { const { error } = await supa.from('goals').delete().eq('id', id); if (error) throw error; },
};

// Exponer todo bajo window.NT
window.NT = {
  ...window.NT,
  auth, contacts, agreCats, agreements,
  lights, lightEmotions,
  practices, locations,
  goals,
};
