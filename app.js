/* app.js v0.5.0 — NavyTech Core (Supabase + servicios)
   - Usa tu proyecto y anon key reales (sin placeholders)
   - Tablas: contacts, agreement_categories, agreements, practices, locations, games, lights
*/

(() => {
  // ---- Supabase client ----
  const SUPABASE_URL = "https://zhavnscqhsedrvokeocb.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYXZuc2NxaHNlZHJ2b2tlb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODQ1MDcsImV4cCI6MjA3NDA2MDUwN30.Lace39ORNPoDb5iGz8_hlRTRhH3I1JhvD5sPKwzOiys";

  const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: { schema: "public" },
  });

  // ---- Helpers de error ----
  const unwrap = async (res) => {
    const { data, error } = await res;
    if (error) throw error;
    return data ?? null;
  };

  // ---- Auth ----
  const auth = {
    async signIn(email, password) {
      // Solo Eddy y Dani (RLS ya restringe, pero validamos UX)
      const allowed = ["eddytcamayo@gmail.com", "sanchezsanchezdaniel1912@gmail.com"];
      if (!allowed.includes(String(email).toLowerCase())) {
        throw new Error("Usuario no permitido.");
      }
      const { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    async signOut() {
      await supa.auth.signOut();
      return true;
    },
    async getUser() {
      const { data } = await supa.auth.getUser();
      return data?.user ?? null;
    },
    onAuth(cb) {
      supa.auth.onAuthStateChange((_evt, session) => cb(session?.user ?? null));
    },
  };

  // ---- Tablas ----
  const TBL = {
    contacts: "contacts",
    agreCats: "agreement_categories",
    agreements: "agreements",
    practices: "practices",
    locations: "locations",
    games: "games",          // <- nombre correcto
    lights: "lights",
  };

  // ---- Servicios ----
  const contacts = {
    async listContacts({ status } = {}) {
      let q = supa.from(TBL.contacts).select("*").order("updated_at", { ascending: false });
      if (status) q = q.eq("status", status);
      return unwrap(q);
    },
    async upsertContact(payload) {
      // Campos permitidos
      const item = {
        id: payload.id ?? undefined,
        owner: payload.owner,
        name: payload.name,
        alias: payload.alias ?? null,
        category: payload.category ?? null,
        status: payload.status ?? null,
        treatment: payload.treatment ?? null,
        notes: payload.notes ?? null,
      };
      return unwrap(supa.from(TBL.contacts).upsert(item).select().single());
    },
    async deleteContact(id) {
      return unwrap(supa.from(TBL.contacts).delete().eq("id", id));
    },
  };

  const agreCats = {
    async listAgreementCategories({ onlyActive = false } = {}) {
      let q = supa.from(TBL.agreCats).select("*").order("label", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      return unwrap(q);
    },
    async upsertAgreementCategory({ key, label, active = true }) {
      return unwrap(
        supa
          .from(TBL.agreCats)
          .upsert({ key, label, active })
          .select()
          .single()
      );
    },
  };

  const agreements = {
    async listAgreements({ status } = {}) {
      let q = supa.from(TBL.agreements).select("*").order("created_on", { ascending: false });
      if (status) q = q.eq("status", status);
      return unwrap(q);
    },
    async upsertAgreement(p) {
      const item = {
        id: p.id ?? undefined,
        category_key: p.category_key,
        title: p.title,
        notes: p.notes ?? null,
        created_on: p.created_on, // yyyy-mm-dd
        promoter: p.promoter,     // Eddy / Dani / Ambos
        eddy_decision: p.eddy_decision, // approve/reject/none
        dani_decision: p.dani_decision, // approve/reject/none
        status: p.status ?? null,       // puede calcularlo el UI
      };
      return unwrap(supa.from(TBL.agreements).upsert(item).select().single());
    },
    async deleteAgreement(id) {
      return unwrap(supa.from(TBL.agreements).delete().eq("id", id));
    },
  };

  const practices = {
    async listPractices({ onlyActive = false } = {}) {
      let q = supa.from(TBL.practices).select("*").order("label", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      return unwrap(q);
    },
    async upsertPractice({ key, label, active = true }) {
      return unwrap(
        supa.from(TBL.practices).upsert({ key, label, active }).select().single()
      );
    },
    async deletePractice(key) {
      return unwrap(supa.from(TBL.practices).delete().eq("key", key));
    },
  };

  const locations = {
    async listLocations() {
      // Si no tienes tabla, puedes crearla; si no existe, devolvemos lista vacía
      try {
        return await unwrap(supa.from(TBL.locations).select("*").order("name", { ascending: true }));
      } catch {
        return [];
      }
    },
  };

  const games = {
    async listGames() {
      return unwrap(
        supa.from(TBL.games).select("*").order("played_on", { ascending: false })
      );
    },
    async upsertGame(p) {
      const item = {
        id: p.id ?? undefined,
        played_on: p.played_on,    // yyyy-mm-dd
        kind: p.kind,              // juego / mini
        promoter: p.promoter,      // Eddy / Dani / Ambos
        condom: !!p.condom,
        role: p.role,              // Eddy→Dani / Dani→Eddy / Ambos versátiles
        toys: !!p.toys,
        toys_with: p.toys ? (p.toys_with ?? null) : null,
        cream_inside: p.cream_inside,
        location: p.location ?? null,
        satisfaction: Number(p.satisfaction ?? 0),
        notes: p.notes ?? null,
        practices: p.practices ?? [], // array text
      };
      return unwrap(supa.from(TBL.games).upsert(item).select().single());
    },
    async deleteGame(id) {
      return unwrap(supa.from(TBL.games).delete().eq("id", id));
    },
  };

  const lights = {
    async listLights({ from, to, who } = {}) {
      let q = supa
        .from(TBL.lights)
        .select("*")
        .order("light_on", { ascending: false });
      if (from) q = q.gte("light_on", from);
      if (to) q = q.lte("light_on", to);
      if (who) q = q.eq("who", who);
      return unwrap(q);
    },
    async upsertLight(p) {
      const item = {
        id: p.id ?? undefined,
        light_on: p.light_on, // yyyy-mm-dd
        color: p.color,       // Rojo/Ámbar/Verde/Azul
        who: p.who,           // Eddy/Dani
        action: p.action,
        emotion: p.emotion,   // clave del mapa (meh, feliz, furioso, etc.)
        notes: p.notes ?? null,
      };
      return unwrap(supa.from(TBL.lights).upsert(item).select().single());
    },
    async deleteLight(id) {
      return unwrap(supa.from(TBL.lights).delete().eq("id", id));
    },
  };

  // ---- Exponer al UI ----
  window.NT = {
    auth,
    contacts,
    agreCats,
    agreements,
    practices,
    locations,
    games,
    lights,
  };

  // Logout botón (si existe)
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("logoutBtn");
    if (btn) {
      btn.addEventListener("click", async () => {
        await auth.signOut();
        location.hash = "#/resumen";
        location.reload();
      });
    }
  });
})();
