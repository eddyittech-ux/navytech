/* ui.js v0.4.10 — NavyTech
   - Arreglo hard del SyntaxError (sin caracteres “raros” en templates).
   - Login robusto / router / tema / módulos (Resumen, Contactos, Acuerdos, Prácticas, Juegos, Luces).
   - Rango por defecto en Luces = Mes; reancla fecha al cambiar rango.
*/

(function () {
  // ===== Utils =====
  function onReady(fn){ if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",fn);} else {fn();}}
  function qs(sel,el){return (el||document).querySelector(sel);}
  function qsa(sel,el){return Array.prototype.slice.call((el||document).querySelectorAll(sel));}
  function show(el,flag){ if(!el) return; if(flag===false){el.classList.add("hidden-vis");} else {el.classList.remove("hidden-vis");}}
  function esc(s){ s=String(s||""); return s.replace(/[&<>"'`\/=]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]);});}

  // ===== Tema =====
  var THEME_KEY="nt-theme";
  function iconSun(){return '<circle cx="12" cy="12" r="4" stroke-width="1.6"></circle><g stroke-width="1.6" stroke-linecap="round"><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.2 4.2l1.4 1.4"></path><path d="M18.4 18.4l1.4 1.4"></path><path d="M19.8 4.2l-1.4 1.4"></path><path d="M5.6 18.4l-1.4 1.4"></path></g>'; }
  function iconMoon(){return '<path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" stroke-width="1.6" fill="none"></path>'; }
  function setThemeIcon(theme){ var svg=qs("#themeIcon"); if(svg){ svg.innerHTML = (theme==="dark"? iconMoon() : iconSun()); } }
  function applyTheme(t){ document.documentElement.classList.toggle("dark", t==="dark"); localStorage.setItem(THEME_KEY,t); setThemeIcon(t); }
  function initTheme(){ var saved=localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); applyTheme(saved); }
  onReady(function(){ var b=qs("#themeToggle"); if(b){ b.addEventListener("click",function(){ var cur=document.documentElement.classList.contains("dark")?"dark":"light"; applyTheme(cur==="dark"?"light":"dark");});}});

  // ===== Toast =====
  function toast(msg,type){ type=type||"info"; var host=qs("#toastHost")||document.body; var el=document.createElement("div"); el.className="gs-card px-4 py-2 text-sm border-l-4 "+(type==="error"?"border-red-400":(type==="success"?"border-emerald-400":"border-[#C7A740]")); el.textContent=msg; host.appendChild(el); setTimeout(function(){el.remove();},3200); }

  // ===== Router =====
  function getViews(){ return {
    resumen:qs("#view-resumen"), acuerdos:qs("#view-acuerdos"), metas:qs("#view-metas"),
    luces:qs("#view-luces"), juegos:qs("#view-juegos"), ajustes:qs("#view-ajustes")
  };}
  function highlightActiveNav(){ var key=(location.hash||"#/resumen").replace("#/",""); qsa("#mainNav .nav-link").forEach(function(a){ var href=a.getAttribute("href").replace("#/",""); a.classList.toggle("active", href===key);});}
  function showView(name){
    var views=getViews(); Object.keys(views).forEach(function(k){ show(views[k], k===name); });
    if(name==="ajustes"){ renderContacts(); renderAgreCats(); renderPractices(); }
    if(name==="resumen"){ renderResumen(); }
    if(name==="acuerdos"){ renderAgreements(); }
    if(name==="juegos"){ renderGames(); }
    if(name==="luces"){ renderLightsInit(); }
    highlightActiveNav();
  }
  function parseRoute(){ if(!location.hash) location.hash="#/resumen"; var key=(location.hash||"#/resumen").replace("#/",""); var views=getViews(); if(!views[key]) return showView("resumen"); showView(key); }
  onReady(function(){ window.addEventListener("hashchange", parseRoute); });

  // ===== Auth =====
  function authCard(){return qs("#authCard");}
  function appViews(){return qs("#appViews");}
  async function refreshAuthUI(user){
    var logged=!!user;
    show(authCard(), !logged===true); show(appViews(), logged); show(qs("#mainNav"), logged); show(qs("#authActions"), logged);
    var tip=qs("#userTooltip"); if(tip){ tip.textContent= logged ? (user.email||"") : ""; }
    if(logged){ if(!location.hash) location.hash="#/resumen"; parseRoute(); }
  }
  function attachLoginHandlers(attempt){
    attempt=attempt||0;
    var form=qs("#loginForm"), btn=qs("#loginBtn");
    if(!form||!btn){ if(attempt<20){ return setTimeout(function(){attachLoginHandlers(attempt+1);},100);} return; }
    if(form.__bound) return; form.__bound=true;
    form.addEventListener("submit", function(e){ e.preventDefault(); doLogin(); });
  }
  async function doLogin(){
    var email=(qs("#emailInput")||{}).value; email=email?email.trim():"";
    var password=(qs("#passwordInput")||{}).value||"";
    var btn=qs("#loginBtn");
    if(!email || !password){ toast("Completa email y password","error"); return; }
    try{
      btn.disabled=true; btn.textContent="Entrando…";
      var user=await window.NT.auth.signIn(email,password);
      toast("Sesión iniciada","success");
      await refreshAuthUI(user);
    }catch(err){
      console.error(err); toast(err.message||"No se pudo iniciar sesión","error");
    }finally{
      btn.disabled=false; btn.textContent="Entrar";
    }
  }
  onReady(async function(){
    attachLoginHandlers();
    if(window.NT && window.NT.auth && window.NT.auth.onAuth){ window.NT.auth.onAuth(function(u){ refreshAuthUI(u); }); }
    var u=null; try{ u=await (window.NT && window.NT.auth && window.NT.auth.getUser ? window.NT.auth.getUser() : null);}catch(e){}
    refreshAuthUI(u);
  });
  window.NT = window.NT || {}; window.NT.ui = window.NT.ui || {}; window.NT.ui.tryLogin = doLogin;

  // ===== Flatpickr helper =====
  function fp(el){ if(!el) return null; return flatpickr(el,{altInput:true,altFormat:"d/m/Y",dateFormat:"Y-m-d",defaultDate:new Date(),allowInput:true});}
  var fpAgreement, fpGame, fpLight, fpLightsStart;

  // ===== Resumen =====
  var RESTART_ISO="2025-09-14";
  var emoScore={ feliz:2, muy_feliz:3, emocionado:3, agradecido:2, confiado:2, aliviado:1, meh:0, cansado:-1, nervioso:-1, triste:-2, muy_triste:-3, frustrado:-2, estresado:-2, ansioso:-2, furioso:-3 };
  var eddyColor="#3F3D8F", daniColor="#163054", goldColor="#C7A740";

  function gaugeSVG(value,size){
    value = (value==null?7:Number(value));
    size = size||90;
    var pct=Math.max(1,Math.min(10,value))/10;
    var r=size/2-10, cx=size/2, cy=size/2, C=2*Math.PI*r, dash=(C*pct).toFixed(1);
    var color="hsl("+Math.round(120*pct)+",70%,45%)";
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" stroke="#e5e7eb" stroke-width="10" fill="none"></circle>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" stroke="'+color+'" stroke-width="10" fill="none" stroke-dasharray="'+dash+' '+C+'" stroke-linecap="round" transform="rotate(-90 '+cx+' '+cy+')"></circle>'
      +'<text x="'+cx+'" y="'+(cy+5)+'" text-anchor="middle" font-size="'+(size/3.2)+'" fill="currentColor" font-weight="700">'+(value||0).toFixed(1)+'</text>'
      +'</svg>';
  }
  function sparkline(values,color,w,h){
    values=values||[]; color=color||"#999"; w=w||520; h=h||60;
    if(values.length===0) return '<div class="text-xs opacity-70">Sin datos suficientes.</div>';
    var min = Math.min.apply(null, values.concat([-3]));
    var max = Math.max.apply(null, values.concat([3]));
    var pad=6, step=(w-2*pad)/Math.max(1,values.length-1);
    var pts = values.map(function(v,i){
      var x=pad + i*step; var t=(v-min)/(max-min || 1); var y=h - pad - t*(h-2*pad);
      return x.toFixed(1)+","+y.toFixed(1);
    }).join(" ");
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><polyline fill="none" stroke="'+color+'" stroke-width="2" points="'+pts+'"></polyline></svg>';
  }

  async function renderResumen(){
    var wrap=qs("#resumeStats"); if(!wrap) return;
    wrap.innerHTML='<div class="text-sm opacity-70">Cargando...</div>';
    try{
      var data = await Promise.all([ window.NT.agreements.listAgreements({}), window.NT.games.listGames(), (async function(){ var now=new Date(); var s=new Date(now); s.setDate(now.getDate()-60); return window.NT.lights.listLights({from:s.toISOString().slice(0,10), to:now.toISOString().slice(0,10)});} )() ]);
      var agreements=data[0], games=data[1], lights=data[2];

      var diffDays = Math.floor((Date.now() - new Date(RESTART_ISO).getTime())/86400000);
      var percent = 0;
      var eddyActive = games.filter(function(g){return g.role==="Eddy→Dani";}).length;
      var daniActive = games.filter(function(g){return g.role==="Dani→Eddy";}).length;
      var totalGames = games.length;
      var now=new Date(), monthAgo=new Date(now); monthAgo.setMonth(now.getMonth()-1);
      var weekAgo=new Date(now); weekAgo.setDate(now.getDate()-7);
      function avg(arr){ if(!arr.length) return 0; var s=arr.reduce(function(a,b){return a+(Number(b.satisfaction)||0);},0); return s/arr.length; }
      var avgTotal=avg(games), avgMonth=avg(games.filter(function(g){return new Date(g.played_on)>=monthAgo;})), avgWeek=avg(games.filter(function(g){return new Date(g.played_on)>=weekAgo;}));
      var aprob=agreements.filter(function(a){return a.status==="Aprobado";}).length;
      var pend =agreements.filter(function(a){return a.status==="Pendiente";}).length;

      function seriesFor(person){
        var map={}; lights.filter(function(l){return l.who===person;}).forEach(function(l){
          var d=l.light_on, s=(emoScore[l.emotion]||0); if(!map[d]) map[d]={sum:0,n:0}; map[d].sum+=s; map[d].n++;
        });
        var dates=Object.keys(map).sort();
        return dates.map(function(d){ var v=map[d]; return v.sum/v.n; });
      }
      var eddySeries=seriesFor("Eddy"), daniSeries=seriesFor("Dani");

      wrap.innerHTML =
        '<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 w-full">'
        +  '<div class="gs-card p-4 col-span-2 md:col-span-1 xl:col-span-2 flex items-center justify-between">'
        +    '<div>'
        +      '<div class="text-xs opacity-70">Días desde reinicio</div>'
        +      '<div class="text-4xl font-extrabold" style="color:'+goldColor+'">'+diffDays+'</div>'
        +      '<div class="text-xs opacity-70">Iniciado el 14/09/2025</div>'
        +    '</div>'
        +    '<div class="text-xs opacity-70">v0.4</div>'
        +  '</div>'
        +  '<div class="gs-card p-4"><div class="text-xs opacity-70">Avance de planes/metas</div><div class="text-4xl font-extrabold">'+percent+'%</div><div class="text-xs opacity-70">Se recalculará cuando metas estén activas</div></div>'
        +  '<div class="gs-card p-4"><div class="text-xs opacity-70">Juegos</div><div class="text-3xl font-bold">'+totalGames+'</div>'
        +    '<div class="flex gap-2 mt-2 items-center text-xs">'
        +      '<span class="gs-chip" style="border-color:'+daniColor+';color:'+daniColor+'">Eddy activo: '+eddyActive+'</span>'
        +      '<span class="gs-chip" style="border-color:'+eddyColor+';color:'+eddyColor+'">Dani activo: '+daniActive+'</span>'
        +    '</div></div>'
        +  '<div class="gs-card p-4 flex items-center justify-between"><div><div class="text-xs opacity-70">Satisfacción</div><div class="mt-2 flex gap-2">'
        +    '<span class="gs-chip">Mes: '+avgMonth.toFixed(1)+'</span>'
        +    '<span class="gs-chip">Semana: '+avgWeek.toFixed(1)+'</span>'
        +  '</div></div><div>'+gaugeSVG(avgTotal,90)+'</div></div>'
        +  '<div class="gs-card p-4"><div class="text-xs opacity-70">Acuerdos</div><div class="flex items-end gap-2 mt-1"><div class="text-3xl font-extrabold" style="color:#22c55e">'+aprob+'</div><div class="text-sm text-red-500">Pend: '+pend+'</div></div></div>'
        +  '<div class="gs-card p-4 col-span-2"><div class="text-sm font-medium" style="color:'+eddyColor+'">Emociones · Eddy (60d)</div><div class="mt-2">'+sparkline(eddySeries, eddyColor, 520, 60)+'</div></div>'
        +  '<div class="gs-card p-4 col-span-2"><div class="text-sm font-medium" style="color:'+daniColor+'">Emociones · Dani (60d)</div><div class="mt-2">'+sparkline(daniSeries, daniColor, 520, 60)+'</div></div>'
        +'</div>';
    }catch(e){ console.error(e); wrap.innerHTML='<div class="text-sm text-red-300">No se pudo cargar</div>'; }
  }

  // ===== Contactos (igual que antes, sin cambios de sintaxis) =====
  var filterStatus=qs("#filterStatus"), addFab=qs("#addContactFab"), contactsList=qs("#contactsList");
  var contactModal=qs("#contactModal"), modalTitle=qs("#modalTitle"), deleteBtn=qs("#deleteBtn"), contactForm=qs("#contactForm");
  var idInput=qs("#contactId"), ownerInput=qs("#ownerInput"), nameInput=qs("#nameInput"), aliasInput=qs("#aliasInput"), categoryInput=qs("#categoryInput"), statusInput=qs("#statusInput"), treatmentInput=qs("#treatmentInput"), notesInput=qs("#notesInput");
  if(filterStatus) filterStatus.addEventListener("change", renderContacts);
  if(addFab) addFab.addEventListener("click", function(){ openContactModal(); });

  async function renderContacts(){
    if(!contactsList) return; contactsList.innerHTML='<div class="text-sm opacity-70">Cargando...</div>';
    try{
      var status=filterStatus?filterStatus.value:undefined;
      var items=await window.NT.contacts.listContacts({status:status});
      if(!items.length){ contactsList.innerHTML='<div class="text-sm opacity-70">Sin contactos.</div>'; return;}
      contactsList.innerHTML=items.map(function(c){
        var chip = c.treatment? '<div class="mt-1 text-xs"><span class="gs-chip">'+esc(c.treatment)+'</span></div>' : '';
        var notes = c.notes? '<div class="mt-2 text-xs opacity-80">'+esc(c.notes)+'</div>' : '';
        var bg = (c.owner==="Dani" ? "background:linear-gradient(135deg,#163054,#334155)" : "background:linear-gradient(135deg,#3F3D8F,#334155)");
        return '<div class="gs-card p-4 flex items-start justify-between"><div class="flex items-start gap-3"><div class="w-9 h-9 rounded-xl" style="'+bg+'"></div><div><div class="font-medium">'+esc(c.alias? (c.name+" · "+c.alias) : (c.name||"—"))+'</div><div class="text-xs opacity-70">'+esc(c.owner||"")+' · '+esc(c.category||"")+'</div>'+chip+notes+'</div></div><div class="flex items-center gap-2"><button class="gs-btn" data-edit="'+c.id+'" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button><button class="gs-btn" data-del="'+c.id+'" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button></div></div>';
      }).join("");
      qsa("[data-edit]").forEach(function(b){ b.addEventListener("click", function(){ var id=b.getAttribute("data-edit"); var it=(items||[]).find(function(x){return x.id===id;}); openContactModal(it); });});
      qsa("[data-del]").forEach(function(b){ b.addEventListener("click", async function(){ var id=b.getAttribute("data-del"); if(!confirm("¿Eliminar contacto?")) return; try{ await window.NT.contacts.deleteContact(id); toast("Eliminado","success"); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});});
    }catch(e){ console.error(e); contactsList.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }
  function openContactModal(item){
    item=item||null; if(!contactModal) return;
    modalTitle.textContent=item?"Editar contacto":"Nuevo contacto";
    show(deleteBtn, !!item);
    idInput.value=item&&item.id||"";
    ownerInput.value=item&&item.owner||"Eddy";
    nameInput.value=item&&item.name||"";
    aliasInput.value=item&&item.alias||"";
    categoryInput.value=item&&item.category||"Verde";
    statusInput.value=item&&item.status||"";
    treatmentInput.value=item&&item.treatment||"";
    notesInput.value=item&&item.notes||"";
    contactModal.showModal();
  }
  var closeModalBtn=qs("#closeModal"); if(closeModalBtn) closeModalBtn.addEventListener("click", function(){ if(contactModal) contactModal.close();});
  if(deleteBtn) deleteBtn.addEventListener("click", async function(){ var id=idInput.value; if(!id) return; if(!confirm("¿Eliminar contacto?")) return; try{ await window.NT.contacts.deleteContact(id); contactModal.close(); toast("Eliminado","success"); renderContacts(); renderResumen(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});
  if(contactForm) contactForm.addEventListener("submit", async function(e){ e.preventDefault(); if(!nameInput.value.trim()){ toast("Nombre es obligatorio","error"); return;} try{ var payload={ id:idInput.value||undefined, owner:ownerInput.value, name:nameInput.value.trim(), alias:aliasInput.value||null, category:categoryInput.value||null, status:statusInput.value||null, treatment:treatmentInput.value||null, notes:notesInput.value||null }; await window.NT.contacts.upsertContact(payload); contactModal.close(); toast("Guardado","success"); renderContacts(); renderResumen(); }catch(err){ console.error(err); toast("Error al guardar: "+(err.message||""),"error"); }});

  // ===== Acuerdos (idéntico en lógica; sin templates complejos) =====
  var agreFilterStatus=qs("#agreFilterStatus"), addAgreementBtn=qs("#addAgreementBtn"), agreementsList=qs("#agreementsList");
  var agreementModal=qs("#agreementModal"), agreementForm=qs("#agreementForm"), deleteAgreementBtn=qs("#deleteAgreementBtn");
  var agreementModalTitle=qs("#agreementModalTitle"), agreementId=qs("#agreementId"), agreementCategory=qs("#agreementCategory"), agreementDate=qs("#agreementDate"), agreementPromoter=qs("#agreementPromoter"), agreementStatusRO=qs("#agreementStatusRO"), agreementTitle=qs("#agreementTitle"), agreementNotes=qs("#agreementNotes"), eddyDecision=qs("#eddyDecision"), daniDecision=qs("#daniDecision");
  if(agreFilterStatus) agreFilterStatus.addEventListener("change", renderAgreements);
  if(addAgreementBtn) addAgreementBtn.addEventListener("click", async function(){ await loadAgreementCategories(true); openAgreementModal(); });

  async function loadAgreementCategories(onlyActive){ onlyActive=!!onlyActive; if(!agreementCategory) return; var cats=await window.NT.agreCats.listAgreementCategories({onlyActive:onlyActive}); agreementCategory.innerHTML=cats.map(function(c){return '<option value="'+esc(c.key)+'">'+esc(c.label)+'</option>';}).join(""); }
  function computeStatus(e,d){ e=e||"none"; d=d||"none"; if(e==="approve" && d==="approve") return "Aprobado"; if(e==="reject" && d==="reject") return "Rechazado"; if(e==="reject" || d==="reject") return "Pendiente"; return "Pendiente"; }
  async function renderAgreements(){
    if(!agreementsList) return; agreementsList.innerHTML='<div class="text-sm opacity-70">Cargando...</div>';
    try{
      var status=agreFilterStatus?agreFilterStatus.value:undefined;
      var items=await window.NT.agreements.listAgreements({status:status});
      if(!items.length){ agreementsList.innerHTML='<div class="text-sm opacity-70">Sin acuerdos.</div>'; return; }
      agreementsList.innerHTML=items.map(function(a){
        var notes=a.notes? '<div class="mt-1 text-xs opacity-80">'+esc(a.notes)+'</div>' : '';
        return '<div class="gs-card p-4 flex items-start justify-between"><div><div class="font-medium">'+esc(a.title)+'</div><div class="text-xs opacity-70">'+esc(a.category_key)+' · '+esc(a.promoter)+' · '+esc(a.created_on)+'</div>'+notes+'<div class="mt-2 flex gap-2 text-xs"><span class="gs-chip">Eddy: '+esc(a.eddy_decision)+'</span><span class="gs-chip">Dani: '+esc(a.dani_decision)+'</span></div></div><div class="flex items-center gap-2"><span class="gs-chip">'+esc(a.status)+'</span><button class="gs-btn" data-edit-agre="'+a.id+'" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button><button class="gs-btn" data-del-agre="'+a.id+'" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button></div></div>';
      }).join("");
      qsa("[data-edit-agre]").forEach(function(b){ b.addEventListener("click", async function(){ var id=b.getAttribute("data-edit-agre"); var it=(items||[]).find(function(x){return x.id===id;}); await loadAgreementCategories(false); openAgreementModal(it); });});
      qsa("[data-del-agre]").forEach(function(b){ b.addEventListener("click", async function(){ var id=b.getAttribute("data-del-agre"); if(!confirm("¿Eliminar acuerdo?")) return; try{ await window.NT.agreements.deleteAgreement(id); toast("Eliminado","success"); renderAgreements(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});});
    }catch(e){ console.error(e); agreementsList.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }
  function openAgreementModal(item){
    item=item||null; if(!agreementModal) return;
    agreementModalTitle.textContent=item?"Editar acuerdo":"Nuevo acuerdo";
    show(deleteAgreementBtn, !!item);
    agreementId.value=item&&item.id||"";
    agreementPromoter.value=item&&item.promoter||"Ambos";
    agreementTitle.value=item&&item.title||"";
    agreementNotes.value=item&&item.notes||"";
    eddyDecision.value=item&&item.eddy_decision||"none";
    daniDecision.value=item&&item.dani_decision||"none";
    agreementStatusRO.value=computeStatus(eddyDecision.value,daniDecision.value);
    agreementModal.showModal();
    if(fpAgreement) fpAgreement.destroy(); fpAgreement=fp(agreementDate);
  }
  var closeAgreementModalBtn=qs("#closeAgreementModal"); if(closeAgreementModalBtn) closeAgreementModalBtn.addEventListener("click", function(){ if(agreementModal) agreementModal.close();});
  if(eddyDecision) eddyDecision.addEventListener("change", function(){ agreementStatusRO.value=computeStatus(eddyDecision.value,daniDecision.value); });
  if(daniDecision) daniDecision.addEventListener("change", function(){ agreementStatusRO.value=computeStatus(eddyDecision.value,daniDecision.value); });
  if(deleteAgreementBtn) deleteAgreementBtn.addEventListener("click", async function(){ var id=agreementId.value; if(!id) return; if(!confirm("¿Eliminar acuerdo?")) return; try{ await window.NT.agreements.deleteAgreement(id); agreementModal.close(); toast("Eliminado","success"); renderAgreements(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});
  if(agreementForm) agreementForm.addEventListener("submit", async function(e){ e.preventDefault(); if(!agreementTitle.value.trim()){ toast("El acuerdo necesita un título","error"); return; } try{ var payload={ id:agreementId.value||undefined, category_key:agreementCategory.value, title:agreementTitle.value.trim(), notes:agreementNotes.value||null, created_on:agreementDate.value, promoter:agreementPromoter.value, eddy_decision:eddyDecision.value, dani_decision:daniDecision.value }; await window.NT.agreements.upsertAgreement(payload); agreementModal.close(); toast("Guardado","success"); renderAgreements(); }catch(err){ console.error(err); toast("Error al guardar: "+(err.message||""),"error"); }});

  // ===== Prácticas =====
  var practicesList=qs("#practicesList"), addPracticeBtn=qs("#addPracticeBtn");
  if(addPracticeBtn) addPracticeBtn.addEventListener("click", function(){ openPracticeModal(); });
  function openPracticeModal(item){
    item=item||{};
    var key = item.key || prompt("Clave (ej: oral_e2d):",""); if(!key) return;
    var label = item.label || prompt("Nombre visible:",""); if(!label) return;
    var active = (item.active==null? true : !!item.active);
    window.NT.practices.upsertPractice({key:key,label:label,active:active})
      .then(function(){ toast("Guardado","success"); renderPractices(); })
      .catch(function(e){ console.error(e); toast("Error: "+(e.message||""),"error");});
  }
  async function renderPractices(){
    if(!practicesList) return; practicesList.innerHTML='<div class="text-sm opacity-70">Cargando...</div>';
    try{
      var items=await window.NT.practices.listPractices();
      practicesList.innerHTML=items.map(function(p){
        return '<div class="gs-card p-4 flex items-center justify-between"><div><div class="font-medium">'+esc(p.label)+'</div><div class="text-xs opacity-70">key: '+esc(p.key)+' · '+(p.active?'Activa':'Inactiva')+'</div></div><div class="flex gap-2"><button class="gs-btn" data-edit-pr="'+p.key+'" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button><button class="gs-btn" data-del-pr="'+p.key+'" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button></div></div>';
      }).join("");
      qsa("[data-edit-pr]").forEach(function(b){ b.addEventListener("click", function(){ var key=b.getAttribute("data-edit-pr"); var it=items.find(function(x){return x.key===key;}); openPracticeModal(it);});});
      qsa("[data-del-pr]").forEach(function(b){ b.addEventListener("click", async function(){ var key=b.getAttribute("data-del-pr"); if(!confirm("¿Eliminar práctica?")) return; try{ await window.NT.practices.deletePractice(key); toast("Eliminada","success"); renderPractices(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});});
    }catch(e){ console.error(e); practicesList.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }

  // ===== Juegos =====
  var gamesList=qs("#gamesList"), addGameBtn=qs("#addGameBtn");
  var gameModal=qs("#gameModal"), gameForm=qs("#gameForm"), deleteGameBtn=qs("#deleteGameBtn");
  var gameModalTitle=qs("#gameModalTitle");
  var gameId=qs("#gameId"), gameDate=qs("#gameDate"), gameKind=qs("#gameKind"), gamePromoter=qs("#gamePromoter"), gameCondom=qs("#gameCondom"), gameRole=qs("#gameRole"), gameToys=qs("#gameToys"), gameToysWith=qs("#gameToysWith"), gameCream=qs("#gameCream"), gameLocation=qs("#gameLocation"), gameSatisfaction=qs("#gameSatisfaction"), gameNotes=qs("#gameNotes");
  var locList=qs("#locList"), practicesChecklist=qs("#practicesChecklist"), satisfactionGauge=qs("#satisfactionGauge");
  if(addGameBtn) addGameBtn.addEventListener("click", async function(){ await loadPracticesChecklist(); await loadLocations(); openGameModal(); });
  function gauge(value){ if(!satisfactionGauge) return; value=Number(value||7); var pct=Math.max(1,Math.min(10,value))/10; var r=28,C=2*Math.PI*r,dash=(C*pct).toFixed(1); var color="hsl("+Math.round(120*pct)+",70%,45%)"; satisfactionGauge.innerHTML='<svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="'+r+'" stroke="#e5e7eb" stroke-width="8" fill="none"></circle><circle cx="40" cy="40" r="'+r+'" stroke="'+color+'" stroke-width="8" fill="none" stroke-dasharray="'+dash+' '+C+'" stroke-linecap="round" transform="rotate(-90 40 40)"></circle><text x="40" y="45" text-anchor="middle" font-size="18" fill="currentColor">'+value+'</text></svg>'; }
  if(gameSatisfaction) gameSatisfaction.addEventListener("input", function(){ gauge(gameSatisfaction.value); });
  if(gameToys) gameToys.addEventListener("change", function(){ if(gameToysWith) gameToysWith.disabled = (gameToys.value!=="true");});
  async function loadPracticesChecklist(){ if(!practicesChecklist) return; var practices=await window.NT.practices.listPractices({onlyActive:true}); practicesChecklist.innerHTML=practices.map(function(p){return '<label class="flex items-center gap-2 text-sm"><input type="checkbox" value="'+esc(p.key)+'"> <span>'+esc(p.label)+'</span></label>';}).join(""); }
  async function loadLocations(){ if(!locList) return; var locs=await window.NT.locations.listLocations(); locList.innerHTML=locs.map(function(l){return '<option value="'+esc(l.name)+'"></option>';}).join(""); }
  async function renderGames(){
    if(!gamesList) return; gamesList.innerHTML='<div class="text-sm opacity-70">Cargando...</div>';
    try{
      var items=await window.NT.games.listGames();
      if(!items.length){ gamesList.innerHTML='<div class="text-sm opacity-70">Sin juegos.</div>'; return;}
      gamesList.innerHTML=items.map(function(g){
        var chips = (g.practices&&g.practices.length)? '<div class="mt-1 text-xs">'+g.practices.map(function(p){return '<span class="gs-chip mr-1">'+esc(p)+'</span>';}).join("")+'</div>' : '';
        var notes = g.notes? '<div class="mt-2 text-xs opacity-80">'+esc(g.notes)+'</div>' : '';
        var v=g.satisfaction||1, pct=v/10, r=18, C=2*Math.PI*r, dash=(C*pct).toFixed(1), color="hsl("+Math.round(120*pct)+",70%,45%)";
        var gaugeMini = '<svg width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="'+r+'" stroke="#e5e7eb" stroke-width="6" fill="none"></circle><circle cx="25" cy="25" r="'+r+'" stroke="'+color+'" stroke-width="6" fill="none" stroke-dasharray="'+dash+' '+C+'" stroke-linecap="round" transform="rotate(-90 25 25)"></circle><text x="25" y="30" text-anchor="middle" font-size="12" fill="currentColor">'+v+'</text></svg>';
        return '<div class="gs-card p-4 flex items-start justify-between"><div><div class="font-medium">'+esc(g.kind==="juego"?"Juego":"Mini-juego")+' · '+esc(g.promoter)+' · '+esc(g.played_on)+'</div><div class="text-xs opacity-70">'+esc(g.role)+' · Condón: '+(g.condom?"Sí":"No")+' · Juguetes: '+(g.toys?"Sí":"No")+(g.toys?(' · Con: '+esc(g.toys_with||"—")):"")+' · Lechita: '+esc(g.cream_inside)+'</div><div class="text-xs opacity-70 mt-1">Lugar: '+esc(g.location||"—")+'</div>'+chips+notes+'</div><div class="flex items-center gap-3"><div>'+gaugeMini+'</div><button class="gs-btn" data-edit-game="'+g.id+'" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button><button class="gs-btn" data-del-game="'+g.id+'" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button></div></div>';
      }).join("");
      qsa("[data-edit-game]").forEach(function(b){ b.addEventListener("click", async function(){ var id=b.getAttribute("data-edit-game"); var it=(items||[]).find(function(x){return x.id===id;}); await loadPracticesChecklist(); await loadLocations(); openGameModal(it); });});
      qsa("[data-del-game]").forEach(function(b){ b.addEventListener("click", async function(){ var id=b.getAttribute("data-del-game"); if(!confirm("¿Eliminar juego?")) return; try{ await window.NT.games.deleteGame(id); toast("Eliminado","success"); renderGames(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});});
    }catch(e){ console.error(e); gamesList.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }
  function openGameModal(item){
    item=item||null; if(!gameModal) return;
    gameModalTitle.textContent=item?"Editar juego":"Nuevo juego";
    show(deleteGameBtn, !!item);
    gameId.value=item&&item.id||"";
    gameKind.value=item&&item.kind||"juego";
    gamePromoter.value=item&&item.promoter||"Ambos";
    gameCondom.value=String(item && item.condom!=null ? item.condom : false);
    gameRole.value=item&&item.role||"Ambos versátiles";
    gameToys.value=String(item && item.toys!=null ? item.toys : false);
    gameToysWith.value=item&&item.toys_with||"";
    if(gameToysWith) gameToysWith.disabled=(gameToys.value!=="true");
    gameCream.value=item&&item.cream_inside||"Ninguno";
    gameLocation.value=item&&item.location||"";
    gameSatisfaction.value=item&&item.satisfaction||7; gauge(gameSatisfaction.value);
    gameNotes.value=item&&item.notes||"";
    qsa('input[type=checkbox]', practicesChecklist||document).forEach(function(ch){ ch.checked = !!((item&&item.practices)||[]).includes(ch.value);});
    gameModal.showModal();
    if(fpGame) fpGame.destroy(); fpGame=fp(gameDate); if(item&&item.played_on) fpGame.setDate(item.played_on,true);
  }
  var closeGameModalBtn=qs("#closeGameModal"); if(closeGameModalBtn) closeGameModalBtn.addEventListener("click", function(){ if(gameModal) gameModal.close();});
  if(deleteGameBtn) deleteGameBtn.addEventListener("click", async function(){ var id=gameId.value; if(!id) return; if(!confirm("¿Eliminar juego?")) return; try{ await window.NT.games.deleteGame(id); gameModal.close(); toast("Eliminado","success"); renderGames(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});
  if(gameForm) gameForm.addEventListener("submit", async function(e){ e.preventDefault(); var practices=qsa('input[type=checkbox]', practicesChecklist||document).filter(function(ch){return ch.checked;}).map(function(ch){return ch.value;}); try{ var payload={ id:gameId.value||undefined, played_on:gameDate.value, kind:gameKind.value, promoter:gamePromoter.value, condom:(gameCondom.value==="true"), role:gameRole.value, toys:(gameToys.value==="true"), toys_with:(gameToys.value==="true"?(gameToysWith.value||null):null), cream_inside:gameCream.value, location:gameLocation.value||null, satisfaction:Number(gameSatisfaction.value), notes:gameNotes.value||null, practices:practices }; await window.NT.games.upsertGame(payload); gameModal.close(); toast("Guardado","success"); renderGames(); }catch(err){ console.error(err); toast("Error al guardar: "+(err.message||""),"error"); }});

  // ===== Luces =====
  var lightsList=qs("#lightsList"), btnAddLight=qs("#addLightBtn"), lightsStats=qs("#lightsStats"), lightsRangeType=qs("#lightsRangeType"), lightsRangeStart=qs("#lightsRangeStart");
  var lightModal=qs("#lightModal"), lightForm=qs("#lightForm"), deleteLightBtn=qs("#deleteLightBtn");
  var lightModalTitle=qs("#lightModalTitle"), lightId=qs("#lightId"), lightDate=qs("#lightDate"), lightColor=qs("#lightColor"), lightWho=qs("#lightWho"), lightEmotion=qs("#lightEmotion"), lightAction=qs("#lightAction"), lightNotes=qs("#lightNotes");

  function rangeFrom(type, anchor){
    var d=new Date(anchor);
    if(type==="week"){ var day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); } else { d.setDate(1); }
    return d.toISOString().slice(0,10);
  }
  function colorDot(color){ var map={Rojo:"#ef4444","Ámbar":"#f59e0b",Verde:"#22c55e",Azul:"#60a5fa"}; var c=map[color]||"#9ca3af"; return '<span class="inline-block w-2.5 h-2.5 rounded-full" style="background:'+c+'"></span>'; }
  function emoIcon(e){
    var base="currentColor";
    var faces={
      feliz:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      muy_feliz:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M7.5 14c2.5 3 6.5 3 9 0" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      emocionado:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M8 14c2 2 4 2 8 0" stroke="'+base+'" stroke-width="1.6"></path><path d="M12 6v2" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      agradecido:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M8 15c2 1 6 1 8 0" stroke="'+base+'" stroke-width="1.6"></path><path d="M7 7l2 2M17 7l-2 2" stroke="'+base+'" stroke-width="1.6"></path>',
      confiado:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="'+base+'" stroke-width="1.6"></path><path d="M7 7l2 2" stroke="'+base+'" stroke-width="1.6"></path>',
      aliviado:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><path d="M9 10l-1 1M16 10l-1 1" stroke="'+base+'" stroke-width="1.6"></path><path d="M8.5 14c1.5 2 5.5 2 7 0" stroke="'+base+'" stroke-width="1.6"></path>',
      meh:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M8 15h8" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      cansado:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><path d="M8 10h2M14 10h2" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path><path d="M8 15h8" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      nervioso:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><path d="M8 10l1 1M16 10l-1 1" stroke="'+base+'" stroke-width="1.6"></path><path d="M8 16c2 0 6 0 8 0" stroke="'+base+'" stroke-width="1.6" stroke-dasharray="3 2"></path>',
      triste:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      muy_triste:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1.2" fill="'+base+'"></circle><circle cx="15" cy="10" r="1.2" fill="'+base+'"></circle><path d="M7.5 17c2.5-3 6.5-3 9 0" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>',
      frustrado:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><path d="M8 10l2-1M16 10l-2-1" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path><path d="M8 16l8-1" stroke="'+base+'" stroke-width="1.6"></path>',
      estresado:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><path d="M8 10l2 1M14 11l2-1" stroke="'+base+'" stroke-width="1.6"></path><path d="M7 16h10" stroke="'+base+'" stroke-width="1.6" stroke-dasharray="2 2"></path>',
      ansioso:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><circle cx="9" cy="10" r="1" fill="'+base+'"></circle><circle cx="15" cy="12" r="1" fill="'+base+'"></circle><path d="M8 16h8" stroke="'+base+'" stroke-width="1.6" stroke-dasharray="1 2"></path>',
      furioso:'<circle cx="12" cy="12" r="10" stroke="'+base+'" fill="none"></circle><path d="M8 9l2-2M16 9l-2-2" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path><path d="M8.5 16c1.5-2 5.5-2 7 0" stroke="'+base+'" stroke-width="1.6" stroke-linecap="round"></path>'
    };
    var svg = faces[e] || faces.meh;
    return '<svg class="icon-sm" viewBox="0 0 24 24" fill="none">'+svg+'</svg>';
  }
  function opposite(who){ return who==="Eddy" ? "Dani" : "Eddy"; }

  async function renderLightsInit(){
    var today=new Date();
    if(lightsRangeType) lightsRangeType.value="month"; // por defecto Mes
    if(fpLightsStart) fpLightsStart.destroy();
    fpLightsStart = flatpickr("#lightsRangeStart",{altInput:true,altFormat:"d/m/Y",dateFormat:"Y-m-d",defaultDate: rangeFrom(lightsRangeType?lightsRangeType.value:"month", today), allowInput:true, onChange:function(){ renderLights(); }});
    if(lightsRangeType) lightsRangeType.addEventListener("change", function(){
      var type=lightsRangeType.value; var base=rangeFrom(type, new Date()); if(fpLightsStart) fpLightsStart.setDate(base,true); renderLights();
    });
    renderLights();
  }

  if(btnAddLight) btnAddLight.addEventListener("click", function(){ openLightModal(); });

  async function renderLights(){
    var list=qs("#lightsList"); if(!list) return; list.innerHTML='<div class="text-sm opacity-70">Cargando...</div>';
    try{
      var type=(lightsRangeType&&lightsRangeType.value)||"month";
      var start=(lightsRangeStart&&lightsRangeStart.value) || rangeFrom(type, new Date());
      var dStart=new Date(start), dEnd=new Date(start);
      if(type==="week"){ dEnd.setDate(dStart.getDate()+6); } else { dEnd.setMonth(dStart.getMonth()+1); dEnd.setDate(dEnd.getDate()-1); }
      var from=start, to=dEnd.toISOString().slice(0,10);
      var items=await window.NT.lights.listLights({from:from,to:to});
      var counts={Rojo:0,"Ámbar":0,Verde:0,Azul:0};
      items.forEach(function(i){ counts[i.color]=(counts[i.color]||0)+1; });
      if(lightsStats) lightsStats.innerHTML = ["Rojo","Ámbar","Verde","Azul"].map(function(k){
        return '<div class="gs-card p-3 flex items-center justify-between"><div class="flex items-center gap-2">'+colorDot(k)+' <span>'+k+'</span></div><div class="text-2xl font-semibold">'+(counts[k]||0)+'</div></div>';
      }).join("");

      if(!items.length){
        function fmt(iso){ var a=iso.split("-"); return a[2]+"/"+a[1]+"/"+a[0]; }
        list.innerHTML='<div class="text-sm opacity-70">No hay entradas entre <strong>'+fmt(from)+'</strong> y <strong>'+fmt(to)+'</strong>. Cambia a Mes o mueve la fecha.</div>';
        return;
      }
      list.innerHTML = items.map(function(l){
        var notes = l.notes? '<div class="mt-2 text-xs opacity-80">'+esc(l.notes)+'</div>' : '';
        return '<div class="gs-card p-4">'
          +'<div class="flex items-center justify-between mb-1 text-sm opacity-80"><div class="flex items-center gap-2">'+colorDot(l.color)+' <strong>'+esc(l.who)+'</strong></div><div>'+esc(l.light_on)+'</div></div>'
          +'<div class="font-medium">'+esc(l.action)+'</div>'
          +'<div class="mt-1 text-xs opacity-80 flex items-center gap-2"><span>'+opposite(l.who)+'</span> · <span class="inline-flex items-center gap-1">'+emoIcon(l.emotion)+' <span>'+esc(l.emotion)+'</span></span></div>'
          + notes
          +'<div class="mt-3 flex items-center gap-2 justify-end"><button class="gs-btn" data-edit-light="'+l.id+'" title="Editar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button><button class="gs-btn" data-del-light="'+l.id+'" title="Borrar"><svg class="icon-sm" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 12h8l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></button></div>'
          +'</div>';
      }).join("");
      qsa("[data-edit-light]").forEach(function(b){ b.addEventListener("click", function(){ var id=b.getAttribute("data-edit-light"); var it=items.find(function(x){return x.id===id;}); openLightModal(it); });});
      qsa("[data-del-light]").forEach(function(b){ b.addEventListener("click", async function(){ var id=b.getAttribute("data-del-light"); if(!confirm("¿Eliminar entrada?")) return; try{ await window.NT.lights.deleteLight(id); toast("Eliminada","success"); renderLights(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});});
    }catch(e){ console.error(e); if(lightsList) lightsList.innerHTML='<div class="text-sm text-red-300">Error al cargar</div>'; }
  }

  function openLightModal(item){
    item=item||null; if(!lightModal) return;
    show(deleteLightBtn, !!item);
    lightModalTitle.textContent=item?"Editar entrada":"Nueva entrada";
    lightId.value=item&&item.id||"";
    lightColor.value=item&&item.color||"Verde";
    lightWho.value=item&&item.who||"Eddy";
    lightEmotion.value=item&&item.emotion||"meh";
    lightAction.value=item&&item.action||"";
    lightNotes.value=item&&item.notes||"";
    lightModal.showModal();
    if(fpLight) fpLight.destroy(); fpLight=fp(lightDate); if(item&&item.light_on) fpLight.setDate(item.light_on,true);
  }
  var closeLightModalBtn=qs("#closeLightModal"); if(closeLightModalBtn) closeLightModalBtn.addEventListener("click", function(){ if(lightModal) lightModal.close();});
  if(deleteLightBtn) deleteLightBtn.addEventListener("click", async function(){ var id=lightId.value; if(!id) return; if(!confirm("¿Eliminar entrada?")) return; try{ await window.NT.lights.deleteLight(id); lightModal.close(); toast("Eliminada","success"); renderLights(); }catch(e){ console.error(e); toast("Error al eliminar","error"); }});
  if(lightForm) lightForm.addEventListener("submit", async function(e){ e.preventDefault(); var action=lightAction.value.trim(); if(!action){ toast("Acción es obligatoria","error"); return;} try{ var payload={ id:lightId.value||undefined, light_on:lightDate.value, color:lightColor.value, who:lightWho.value, action:action, emotion:lightEmotion.value, notes:lightNotes.value||null }; await window.NT.lights.upsertLight(payload); lightModal.close(); toast("Guardado","success"); renderLights(); }catch(err){ console.error(err); toast("Error al guardar: "+(err.message||""),"error"); }});

  // ===== Arranque =====
  onReady(function(){ initTheme(); if(!location.hash) location.hash="#/resumen"; parseRoute(); });
})();
