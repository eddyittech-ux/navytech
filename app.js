// app.js  (reemplaza TODO el bloque de creación del cliente por esto)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = 'https://zhavnscqhedrvcoeb.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYXZuc2NxaHNlZHJ2b2tlb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODQ1MDcsImV4cCI6MjA3NDA2MDUwN30.Lace39ORNPoDb5iGz8_hlRTRhH3I1JhvD5sPKwzOiys';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// expón para depuración
window.NT = window.NT || {};
window.NT.supabase = supabase;

  // -------- AUTH
  const auth = {
    async signIn(email, password){ const {data, error} = await supa.auth.signInWithPassword({ email, password }); if (error) throw error; return data.user; },
    async signOut(){ await supa.auth.signOut(); },
    async getUser(){ const {data} = await supa.auth.getUser(); return data.user || null; },
    onAuth(cb){ supa.auth.onAuthStateChange((_evt, session) => cb(session?.user || null)); }
  };

  // -------- CONTACTOS
  const contacts = {
    async list({status}={}) {
      let q = supa.from('contacts').select('*').order('created_at',{ascending:false});
      if (status) q = q.eq('status', status);
      const {data, error} = await q; if (error) throw error; return data || [];
    },
    async upsert(payload){ const {data, error} = await supa.from('contacts').upsert(payload).select().single(); if (error) throw error; return data; },
    async delete(id){ const {error} = await supa.from('contacts').delete().eq('id', id); if (error) throw error; }
  };

  // -------- ACUERDOS
  const agreCats = {
    async list(){ const {data, error} = await supa.from('agreement_categories').select('*').order('label'); if (error) throw error; return data || []; }
  };
  const agreements = {
    async list({status}={}) {
      let q = supa.from('agreements').select('*').order('created_on',{ascending:false});
      if (status) q = q.eq('status', status);
      const {data, error} = await q; if (error) throw error; return data || [];
    },
    async upsert(payload){ const {data, error} = await supa.from('agreements').upsert(payload).select().single(); if (error) throw error; return data; },
    async delete(id){ const {error} = await supa.from('agreements').delete().eq('id', id); if (error) throw error; }
  };

  // -------- LUCES
  const lights = {
    async list({from, to, who}={}) {
      let q = supa.from('lights').select('*').order('light_on',{ascending:false});
      if (from) q = q.gte('light_on', from);
      if (to)   q = q.lte('light_on', to);
      if (who)  q = q.eq('who', who);
      const {data, error} = await q; if (error) throw error; return data || [];
    },
    async upsert(payload){ const {data, error} = await supa.from('lights').upsert(payload).select().single(); if (error) throw error; return data; },
    async delete(id){ const {error} = await supa.from('lights').delete().eq('id', id); if (error) throw error; }
  };
  const lightEmotions = {
    async list(){ const {data, error} = await supa.from('light_emotions').select('*').order('key'); if (error) throw error; return data || []; }
  };

  // -------- PRÁCTICAS (ajustes)
  const practices = {
    async list(){ const {data, error} = await supa.from('intimacy_practices').select('*').order('label'); if (error) throw error; return data || []; },
    async upsert(payload){ const {data, error} = await supa.from('intimacy_practices').upsert(payload).select().single(); if (error) throw error; return data; },
    async delete(key){ const {error} = await supa.from('intimacy_practices').delete().eq('key', key); if (error) throw error; }
  };

  // -------- GOALS (metas)
  const goals = {
    async list({who, done}={}) {
      let q = supa.from('goals').select('*').order('deadline',{ascending:true});
      if (who) q = q.eq('promoter', who);
      if (done != null) q = q.eq('done', done === true || done === 'true');
      const {data, error} = await q; if (error) throw error; return data || [];
    },
    async upsert(payload){ const {data, error} = await supa.from('goals').upsert(payload).select().single(); if (error) throw error; return data; },
    async delete(id){ const {error} = await supa.from('goals').delete().eq('id', id); if (error) throw error; }
  };

  window.NT = { supa, auth, contacts, agreCats, agreements, lights, lightEmotions, practices, goals };
})();
