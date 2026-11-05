/**
 * Lógica de la página: datos de contacto desde config.js, modo
 * claro/oscuro, menú, scroll, animaciones, acordeón y formulario.
 */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  // Desplazamiento suave (Lenis); se crea en initScenes si está disponible
  var smoothScroll = null;
  var contacto = CONFIG.contacto || {};

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  function isPending(value) {
    return !value || /PENDIENTE/i.test(String(value));
  }

  // Oculta la fila (lista de contacto o del footer) de un dato pendiente
  function hidePendingRow(el) {
    var row = el.closest(".contact-list li, .site-footer li");
    if (row) row.style.display = "none";
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  // Construye los enlaces a partir de config.js
  var hrefBuilders = {
    telefono: function () {
      return isPending(contacto.telefono) ? null : "tel:" + String(contacto.telefono).replace(/[^\d+]/g, "");
    },
    whatsapp: function () {
      if (isPending(contacto.whatsapp)) return null;
      var numero = String(contacto.whatsapp).replace(/\D/g, "");
      var texto = contacto.whatsappMensaje ? "?text=" + encodeURIComponent(contacto.whatsappMensaje) : "";
      return "https://wa.me/" + numero + texto;
    },
    correo: function () {
      return isPending(contacto.correo) ? null : "mailto:" + contacto.correo;
    },
    mapa: function () {
      if (contacto.mapaUrl && !isPending(contacto.mapaUrl)) return contacto.mapaUrl;
      if (isPending(contacto.direccion)) return null;
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(contacto.direccion);
    }
  };

  /* ---------------------------------------------------------------
     1. Datos de contacto desde config.js
     --------------------------------------------------------------- */
  function applyConfig() {
    document.querySelectorAll("[data-config-text]").forEach(function (el) {
      var value = getPath(CONFIG, el.getAttribute("data-config-text"));
      if (value === undefined || value === "") return;
      el.textContent = value;
      el.classList.toggle("is-pending", isPending(value));
      // Un dato pendiente no se muestra al visitante: se oculta su fila.
      if (isPending(value)) hidePendingRow(el);
    });

    document.querySelectorAll("[data-config-href]").forEach(function (el) {
      var builder = hrefBuilders[el.getAttribute("data-config-href")];
      var href = builder ? builder() : null;
      if (href) {
        el.setAttribute("href", href);
        el.removeAttribute("aria-disabled");
      } else {
        // Dato pendiente: el enlace no lleva a ningún sitio.
        el.removeAttribute("href");
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("title", "Dato de contacto pendiente de configurar");
        if (!el.hasAttribute("data-config-text")) el.classList.add("is-disabled");
        // Botones sin destino (p. ej. WhatsApp sin número) no se muestran.
        if (!el.hasAttribute("data-config-text")) el.style.display = "none";
      }
    });

    // Redes sociales (se ocultan las que estén vacías)
    var redes = CONFIG.redes || {};
    var nombres = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok", youtube: "YouTube" };
    document.querySelectorAll("[data-config-social]").forEach(function (list) {
      list.innerHTML = "";
      Object.keys(nombres).forEach(function (red) {
        var url = redes[red];
        if (!url || isPending(url)) return;
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.setAttribute("aria-label", nombres[red] + (isPending(url) ? " (pendiente)" : ""));
        if (isPending(url)) {
          a.setAttribute("aria-disabled", "true");
          a.setAttribute("title", nombres[red] + ": enlace pendiente de configurar");
        } else {
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener";
        }
        a.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-' + red + '"/></svg>';
        li.appendChild(a);
        list.appendChild(li);
      });
      var wrapper = list.closest(".contact-social");
      if (wrapper && !list.children.length) wrapper.hidden = true;
    });

    // Testimonios: mientras sigan los de ejemplo, la sección no se muestra
    var testimonios = document.getElementById("testimonios");
    if (testimonios && testimonios.textContent.indexOf("[Testimonio de ejemplo]") !== -1) testimonios.hidden = true;

    // Año actual en el footer
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    injectJsonLd();
  }

  /* Datos estructurados JSON-LD (Organization) generados desde config.js */
  function injectJsonLd() {
    var empresa = CONFIG.empresa || {};
    var redes = CONFIG.redes || {};
    var baseUrl = String(empresa.url || "").replace(/\/$/, "");
    var data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: empresa.nombre,
      description: "Servicios de automatización online para negocios: captación, seguimiento de ventas, citas, CRM, facturación y páginas web personalizadas.",
      url: baseUrl || undefined,
      logo: baseUrl ? baseUrl + "/" + (empresa.logo || "assets/logo.png") : undefined,
      sameAs: Object.keys(redes).map(function (k) { return redes[k]; }).filter(function (u) { return u && !isPending(u); })
    };
    var contactPoint = { "@type": "ContactPoint", contactType: "customer service", availableLanguage: "Spanish" };
    if (!isPending(contacto.telefono)) contactPoint.telephone = contacto.telefono;
    if (!isPending(contacto.correo)) contactPoint.email = contacto.correo;
    if (contactPoint.telephone || contactPoint.email) data.contactPoint = contactPoint;
    if (!isPending(contacto.correo)) data.email = contacto.correo;
    if (!isPending(contacto.telefono)) data.telephone = contacto.telefono;
    if (!isPending(contacto.direccion)) data.address = contacto.direccion;

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ---------------------------------------------------------------
     2. Modo oscuro / claro
     La página es oscura por defecto. Si el visitante pulsa el botón,
     su elección se guarda en el navegador (la aplica antes de pintar
     el script del <head>). Las escenas animadas siempre son oscuras.
     --------------------------------------------------------------- */
  var THEME_KEY = "ascenda-tema";
  var THEME_COLORS = { light: "#F4F7FC", dark: "#03060F" };

  function initTheme() {
    var root = document.documentElement;
    var buttons = document.querySelectorAll(".theme-toggle");
    var metas = document.querySelectorAll('meta[name="theme-color"]');

    function currentTheme() {
      return root.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    function render() {
      var theme = currentTheme();
      var isDark = theme === "dark";
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(isDark));
        btn.setAttribute("title", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      });
      // Color de la barra del navegador en móviles
      metas.forEach(function (meta) {
        meta.removeAttribute("media");
        meta.setAttribute("content", THEME_COLORS[theme]);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin almacenamiento: solo esta visita */ }
        render();
      });
    });

    render();
  }

  /* ---------------------------------------------------------------
     3. Header, menú móvil y sección activa
     --------------------------------------------------------------- */
  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("menu-principal");
    var backToTop = document.querySelector(".back-to-top");

    function closeMenu(returnFocus) {
      if (!toggle || !nav || !nav.classList.contains("is-open")) return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      nav.classList.remove("is-open");
      if (returnFocus) toggle.focus();
    }

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
        nav.classList.toggle("is-open", !open);
        // Al abrir, el foco pasa al primer enlace para navegar con teclado
        if (!open) {
          var first = nav.querySelector("a");
          if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
        }
      });
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) closeMenu(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu(true);
      });
      document.addEventListener("click", function (e) {
        if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
      });
    }

    function onScroll() {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (backToTop) backToTop.classList.toggle("is-visible", y > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener("click", function () {
        if (smoothScroll) smoothScroll.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        var skip = document.querySelector(".brand");
        if (skip) skip.focus({ preventScroll: true });
      });
    }

    // Resaltado de la sección activa en el menú
    var links = Array.prototype.slice.call(document.querySelectorAll('.main-nav ul a[href^="#"]'));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    // Perla del menú: sigue al enlace activo; al pasar el cursor se adelanta y al salir vuelve
    var bead = document.querySelector(".nav-bead");
    var activeLink = null;
    function moveBead(a) {
      if (!bead) return;
      if (!a || a.offsetWidth === 0) { bead.classList.remove("is-on"); return; }
      bead.style.setProperty("--bx", a.parentNode.offsetLeft + "px");
      bead.style.setProperty("--bw", a.parentNode.offsetWidth + "px");
      bead.classList.add("is-on");
    }
    links.forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveBead(a); });
      a.addEventListener("focus", function () { moveBead(a); });
      a.addEventListener("mouseleave", function () { moveBead(activeLink); });
      a.addEventListener("blur", function () { moveBead(activeLink); });
    });
    window.addEventListener("resize", function () { moveBead(activeLink); });

    if (!("IntersectionObserver" in window) || !sections.length) return;

    var visible = new Map();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible.set(entry.target.id, entry.isIntersecting); });
      var activeId = null;
      sections.forEach(function (s) { if (visible.get(s.id)) activeId = activeId || s.id; });
      links.forEach(function (a) {
        var isActive = a.getAttribute("href") === "#" + activeId;
        a.classList.toggle("is-active", isActive);
        if (isActive) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
        if (isActive) activeLink = a;
      });
      if (!activeId) activeLink = null;
      moveBead(activeLink);
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---------------------------------------------------------------
     4. Animación fade-in al hacer scroll
     --------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (el) {
      // Escalonado sutil entre elementos hermanos
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.animationDelay = Math.min(index * 50, 250) + "ms";
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------
     5. Acordeón FAQ: mantiene una sola pregunta abierta
     --------------------------------------------------------------- */
  function initFaq() {
    var items = document.querySelectorAll(".faq-item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }

  /* ---------------------------------------------------------------
     5b. Sección del producto (ASCENDA System): textos, módulos y capturas
     --------------------------------------------------------------- */
  function initProducto() {
    var section = document.getElementById("sistema");
    if (!section) return;
    var prod = CONFIG.producto || {};

    section.querySelectorAll("[data-producto]").forEach(function (el) {
      var value = prod[el.getAttribute("data-producto")];
      if (value !== undefined && value !== "") el.textContent = value;
    });
    section.querySelectorAll("[data-producto-href]").forEach(function (el) {
      var url = prod[el.getAttribute("data-producto-href")];
      if (url && !isPending(url)) {
        el.href = url;
        el.target = "_blank";
        el.rel = "noopener";
        el.hidden = false;
      }
    });

    var trial = section.querySelector("[data-producto-prueba]");
    if (trial && prod.diasPrueba) trial.textContent = "Pide tu prueba de " + prod.diasPrueba + " días gratis";

    var list = section.querySelector("[data-producto-modulos]");
    if (list && Array.isArray(prod.modulos)) {
      list.textContent = "";
      prod.modulos.forEach(function (texto) {
        var li = document.createElement("li");
        li.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';
        li.appendChild(document.createTextNode(texto));
        list.appendChild(li);
      });
    }

    var img = section.querySelector(".product-frame img");
    var tabs = section.querySelectorAll("[data-shot]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t === tab)); });
        img.src = tab.getAttribute("data-shot");
        img.alt = tab.getAttribute("data-alt");
      });
    });
  }

  /* ---------------------------------------------------------------
     6. Botones que preseleccionan el servicio del formulario
     --------------------------------------------------------------- */
  function initServicePreselect() {
    var select = document.getElementById("f-servicio");
    if (!select) return;
    document.querySelectorAll("[data-servicio]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-servicio");
        Array.prototype.some.call(select.options, function (opt) {
          if (opt.value === value || opt.text === value) { select.value = opt.value || opt.text; return true; }
          return false;
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     7. Formulario de contacto
     --------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = form.querySelector(".form-status");
    var submit = form.querySelector('button[type="submit"]');

    var rules = {
      nombre: function (v) { return v.trim().length >= 2 || "Escribe tu nombre (mínimo 2 caracteres)."; },
      correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Escribe un correo electrónico válido."; },
      telefono: function (v) { return v.replace(/\D/g, "").length >= 7 || "Escribe un teléfono válido (mínimo 7 dígitos)."; },
      servicio: function (v) { return v !== "" || "Selecciona el servicio que te interesa."; },
      mensaje: function (v) { return v.trim().length >= 10 || "Cuéntanos un poco más (mínimo 10 caracteres)."; },
      privacidad: function (_v, el) { return el.checked || "Debes aceptar la política de privacidad."; }
    };

    function validateField(el) {
      var rule = rules[el.name];
      if (!rule) return true;
      var result = rule(el.value, el);
      var ok = result === true;
      var field = el.closest(".field");
      var error = document.getElementById("e-" + el.name);
      if (field) field.classList.toggle("has-error", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      if (error) error.textContent = ok ? "" : result;
      return ok;
    }

    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") validateField(el); });
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validateField(el); });
      el.addEventListener("change", function () { if (el.getAttribute("aria-invalid") === "true") validateField(el); });
    });

    function showStatus(type, message) {
      status.hidden = false;
      status.className = "form-status " + (type === "success" ? "is-success" : "is-error");
      status.textContent = message;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.hidden = true;

      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        var el = form.elements[name];
        if (el && !validateField(el) && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showStatus("error", "Revisa los campos marcados e inténtalo de nuevo.");
        return;
      }

      // Campo trampa: si un bot lo llenó, fingimos éxito y no enviamos nada.
      if (form.elements.web && form.elements.web.value) {
        form.reset();
        showStatus("success", "¡Gracias! Recibimos tu mensaje.");
        return;
      }

      var utm = new URLSearchParams(window.location.search);
      var payload = {
        nombre: form.elements.nombre.value.trim(),
        correo: form.elements.correo.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        servicio: form.elements.servicio.value,
        mensaje: form.elements.mensaje.value.trim(),
        aceptaPrivacidad: true,
        // Campaña de origen (?utm_source=...&utm_campaign=... en el enlace del anuncio)
        utm_source: utm.get("utm_source") || "",
        utm_medium: utm.get("utm_medium") || "",
        utm_campaign: utm.get("utm_campaign") || "",
        origen: window.location.href,
        fecha: new Date().toISOString()
      };

      var endpoint = (CONFIG.formulario && CONFIG.formulario.endpoint) || "";
      var originalText = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Enviando…";

      function done(ok, message) {
        submit.disabled = false;
        submit.textContent = originalText;
        if (ok) {
          form.reset();
          form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
        }
        showStatus(ok ? "success" : "error", message);
      }

      var exito = "¡Gracias, " + payload.nombre.split(" ")[0] + "! Recibimos tu mensaje y te contactaremos muy pronto.";

      /*
       * MODO SIMULADO: no hay endpoint configurado en js/config.js
       * (CONFIG.formulario.endpoint está vacío). El mensaje NO se envía
       * a ningún sitio; solo se muestra el mensaje de éxito para pruebas.
       * Configura el endpoint antes de publicar la página.
       */
      if (!endpoint) {
        console.warn("[Formulario] Sin endpoint configurado en js/config.js: envío simulado.", payload);
        setTimeout(function () { done(true, exito); }, 700);
        return;
      }

      // Envío real (compatible con Formspree y con webhooks que acepten JSON)
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          done(true, exito);
        })
        .catch(function (err) {
          console.error("[Formulario] Error al enviar:", err);
          done(false, "No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp o correo.");
        });
    });
  }

  /* ---------------------------------------------------------------
     8. Agenda de demos (módulo de citas)
     --------------------------------------------------------------- */
  function initBooking() {
    var root = document.getElementById("booking");
    if (!root) return;
    var cfg = CONFIG.citas || {};
    var zona = cfg.zonaHoraria || "America/Santo_Domingo";
    var daysEl = document.getElementById("booking-days");
    var slotsEl = document.getElementById("booking-slots");
    var msgEl = document.getElementById("booking-msg");
    var summaryEl = document.getElementById("booking-summary");
    var form = document.getElementById("booking-form");
    var status = form.querySelector(".form-status");
    var submit = form.querySelector('button[type="submit"]');
    var tzEl = document.getElementById("booking-tz");
    if (tzEl && cfg.zonaVisible) tzEl.textContent = "(" + cfg.zonaVisible + ")";

    var dias = [];
    var elegido = { fecha: "", hora: "" };

    // Las fechas llegan como "AAAA-MM-DD" en la zona del negocio; se formatean en UTC para no desfasarlas.
    function fechaUTC(f) { var p = f.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
    function fmt(f, opts) { return new Intl.DateTimeFormat("es-MX", Object.assign({ timeZone: "UTC" }, opts)).format(fechaUTC(f)); }
    // Las horas viajan en 24 h (HH:mm) hacia n8n; al visitante se le muestran en formato de 12 h.
    function h12(t) { var x = t.split(":"), h = +x[0]; return (h % 12 || 12) + ":" + x[1] + (h < 12 ? " a. m." : " p. m."); }
    function legible() { return fmt(elegido.fecha, { weekday: "long", day: "numeric", month: "long" }) + ", " + h12(elegido.hora); }

    // Modo simulado: genera horarios de ejemplo con el horario de config.js.
    function horariosSimulados() {
      var h = cfg.horarioSimulado || { dias: [1, 2, 3, 4, 5], inicio: "09:00", fin: "18:00", diasAdelante: 14 };
      var dur = cfg.duracionMin || 30;
      var partes = {};
      new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { partes[p.type] = p.value; });
      var hoy = partes.year + "-" + partes.month + "-" + partes.day;
      var ahoraMin = (+partes.hour) * 60 + (+partes.minute) + 120;
      var aMin = function (t) { var x = t.split(":"); return (+x[0]) * 60 + (+x[1]); };
      var out = [];
      for (var d = 0; d <= h.diasAdelante; d++) {
        var dt = fechaUTC(hoy); dt.setUTCDate(dt.getUTCDate() + d);
        var dow = dt.getUTCDay() || 7;
        if (h.dias.indexOf(dow) === -1) continue;
        var f = dt.toISOString().slice(0, 10);
        var horas = [];
        for (var m = aMin(h.inicio); m + dur <= aMin(h.fin); m += dur) {
          if (d === 0 && m < ahoraMin) continue;
          horas.push(("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2));
        }
        out.push({ fecha: f, horas: horas });
      }
      return out;
    }

    function cargar() {
      msgEl.textContent = "Cargando horarios…";
      daysEl.innerHTML = ""; slotsEl.innerHTML = "";
      if (!cfg.horarios) {
        console.warn("[Agenda] Sin URL de horarios en js/config.js: horarios de ejemplo.");
        dias = horariosSimulados(); pintarDias(); return;
      }
      fetch(cfg.horarios, { headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (data) { dias = (data && data.dias) || []; pintarDias(); })
        .catch(function (err) {
          console.error("[Agenda] No se pudieron cargar los horarios:", err);
          msgEl.innerHTML = 'No pudimos cargar la agenda en este momento. <a href="#contacto">Escríbenos aquí</a> y te proponemos un horario.';
        });
    }

    function pintarDias() {
      daysEl.innerHTML = "";
      var primero = null;
      dias.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "booking-day";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = "<small>" + fmt(d.fecha, { weekday: "short" }) + "</small><strong>" + fmt(d.fecha, { day: "numeric" }) +
          "</strong><small>" + fmt(d.fecha, { month: "short" }) + "</small>";
        b.setAttribute("aria-label", fmt(d.fecha, { weekday: "long", day: "numeric", month: "long" }) + (d.horas.length ? "" : ", sin horarios"));
        b.disabled = !d.horas.length;
        b.addEventListener("click", function () { elegirDia(d.fecha); });
        daysEl.appendChild(b);
        if (!primero && d.horas.length) primero = d.fecha;
      });
      if (primero) elegirDia(primero);
      else msgEl.innerHTML = 'No quedan horarios libres en los próximos días. <a href="#contacto">Escríbenos</a> y lo coordinamos.';
    }

    function elegirDia(fecha) {
      elegido = { fecha: fecha, hora: "" };
      daysEl.querySelectorAll(".booking-day").forEach(function (b, i) { b.setAttribute("aria-pressed", String(dias[i].fecha === fecha)); });
      var d = dias.filter(function (x) { return x.fecha === fecha; })[0];
      slotsEl.innerHTML = "";
      (d ? d.horas : []).forEach(function (h) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "booking-slot"; b.textContent = h12(h);
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          elegido.hora = h;
          slotsEl.querySelectorAll(".booking-slot").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          resumen();
        });
        slotsEl.appendChild(b);
      });
      msgEl.textContent = "";
      resumen();
    }

    function resumen() {
      if (elegido.fecha && elegido.hora) summaryEl.innerHTML = "Tu cita: <strong>" + legible() + "</strong>";
      else summaryEl.textContent = elegido.fecha ? "Elige una hora para el " + fmt(elegido.fecha, { weekday: "long", day: "numeric", month: "long" }) + "." : "Aún no eliges horario.";
    }

    var rules = {
      nombre: function (v) { return v.trim().length >= 2 || "Escribe tu nombre (mínimo 2 caracteres)."; },
      correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Escribe un correo electrónico válido."; },
      telefono: function (v) { return v.replace(/\D/g, "").length >= 7 || "Escribe un teléfono válido (mínimo 7 dígitos)."; },
      privacidad: function (_v, el) { return el.checked || "Debes aceptar la política de privacidad."; }
    };
    function validar(el) {
      var r = rules[el.name](el.value, el), ok = r === true;
      var field = el.closest(".field"), error = document.getElementById("eb-" + el.name);
      if (field) field.classList.toggle("has-error", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      if (error) error.textContent = ok ? "" : r;
      return ok;
    }
    function aviso(tipo, texto) {
      status.hidden = false;
      status.className = "form-status " + (tipo === "success" ? "is-success" : "is-error");
      status.textContent = texto;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.hidden = true;
      if (!elegido.fecha || !elegido.hora) { aviso("error", "Elige primero un día y una hora."); slotsEl.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      var primero = null;
      Object.keys(rules).forEach(function (n) { var el = form.elements[n]; if (el && !validar(el) && !primero) primero = el; });
      if (primero) { primero.focus(); aviso("error", "Revisa los campos marcados e inténtalo de nuevo."); return; }
      if (form.elements.web.value) { form.reset(); aviso("success", "¡Listo! Tu cita quedó agendada."); return; }

      var utm = new URLSearchParams(window.location.search);
      var payload = {
        nombre: form.elements.nombre.value.trim(),
        correo: form.elements.correo.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        mensaje: form.elements.mensaje.value.trim(),
        fecha: elegido.fecha,
        hora: elegido.hora,
        utm_source: utm.get("utm_source") || "",
        utm_medium: utm.get("utm_medium") || "",
        utm_campaign: utm.get("utm_campaign") || "",
        origen: window.location.href
      };
      var texto = submit.textContent;
      submit.disabled = true; submit.textContent = "Agendando…";
      var cuando = legible();
      function fin(ok, mensaje) {
        submit.disabled = false; submit.textContent = texto;
        if (ok) { form.reset(); elegido.hora = ""; resumen(); }
        aviso(ok ? "success" : "error", mensaje);
      }
      var exito = function (meet) {
        return "¡Listo, " + payload.nombre.split(" ")[0] + "! Tu llamada de arranque quedó para el " + cuando + " y tu demo gratis de 7 días empieza ese día" +
          ". Te enviamos la invitación a " + payload.correo + (meet ? " con el enlace de Google Meet." : ".");
      };

      if (!cfg.reservar) {
        console.warn("[Agenda] Sin URL de reserva en js/config.js: reserva simulada.", payload);
        setTimeout(function () { fin(true, exito(true)); }, 700);
        return;
      }
      fetch(cfg.reservar, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { r: r, data: data }; }); })
        .then(function (res) {
          if (res.r.ok && res.data.ok !== false) { fin(true, exito(res.data.meet)); cargar(); return; }
          fin(false, res.data.error || "No pudimos agendar la cita. Inténtalo de nuevo.");
          if (res.r.status === 409) cargar();
        })
        .catch(function (err) {
          console.error("[Agenda] Error al reservar:", err);
          fin(false, "No pudimos agendar la cita. Inténtalo de nuevo o escríbenos por el formulario de contacto.");
        });
    });

    cargar();
  }

  /* ---------------------------------------------------------------
     9. Escenas animadas al deslizar
     - [data-scene]: recibe --p (0 → 1) mientras su parte fija está en
       pantalla. [data-horizontal] mueve su fila de tarjetas de lado;
       [data-steps] muestra un paso a la vez.
     - [data-view]: recibe --v (0 → 1) mientras cruza la pantalla.
     Con "reducir movimiento" no se anima nada: todo se ve completo.
     --------------------------------------------------------------- */
  function initScenes() {
    var root = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { root.classList.add("is-static"); return; }

    var header = document.querySelector(".site-header");
    var hero = document.querySelector(".scene-hero");
    var heroCopy = hero && hero.querySelector(".hero-copy");

    // Manifiesto: separa el texto en palabras para encenderlas una a una
    document.querySelectorAll("[data-words]").forEach(function (el) {
      function wrap(node, hl) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var span = document.createElement("span");
              span.className = "w" + (hl ? " w-hl" : "");
              span.textContent = part;
              frag.appendChild(span);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            wrap(child, hl || child.hasAttribute("data-hl"));
          }
        });
      }
      wrap(el, false);
    });

    // Lo que se anima: posiciones medidas una vez, valores escritos solo si cambian
    function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
    var scenes = all("[data-scene]").map(function (el) {
      return {
        el: el, top: 0, len: 0, p: -1, lit: -1, step: -1,
        words: el.querySelectorAll(".w"),
        steps: el.hasAttribute("data-steps") ? el.querySelectorAll(".steps-stage .step") : null
      };
    });
    var views = all("[data-view]").map(function (el) { return { el: el, top: 0, h: 0, v: -1 }; });
    var lits = all("[data-lit]").map(function (el) {
      return { el: el, top: 0, on: false, once: el.getAttribute("data-lit") === "once" };
    });
    var vh = window.innerHeight;

    function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

    // Galería horizontal: la escena mide lo necesario para recorrer la fila
    function sizeHorizontal() {
      document.querySelectorAll("[data-horizontal]").forEach(function (sec) {
        var track = sec.querySelector(".h-track");
        // En pantallas angostas la fila se desliza con el dedo (ver CSS): sin escena fija
        if (window.innerWidth < 900) { sec.style.removeProperty("height"); sec.style.setProperty("--shift", "0px"); return; }
        var shift = Math.max(0, track.scrollWidth - window.innerWidth);
        sec.style.setProperty("--shift", shift + "px");
        sec.style.height = (shift + window.innerHeight * 1.2) + "px";
      });
    }

    function measure() {
      vh = window.innerHeight;
      var y = window.scrollY;
      scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + y; s.len = r.height - vh; });
      views.forEach(function (o) { var r = o.el.getBoundingClientRect(); o.top = r.top + y; o.h = r.height; });
      lits.forEach(function (o) { o.top = o.el.getBoundingClientRect().top + y; });
    }

    function updateSteps(s, p) {
      var steps = s.steps;
      var idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
      if (idx === s.step) return;
      s.step = idx;
      Array.prototype.forEach.call(steps, function (st, i) {
        st.classList.toggle("is-active", i === idx);
        st.classList.toggle("is-past", i < idx);
        st.setAttribute("aria-hidden", String(i !== idx));
      });
      s.el.querySelectorAll(".steps-dots i").forEach(function (d, i) { d.classList.toggle("is-on", i <= idx); });
      var now = s.el.querySelector("[data-step-now]");
      if (now) now.textContent = ("0" + (idx + 1)).slice(-2);
    }

    function lightWords(s, p) {
      var n = s.words.length;
      var count = Math.max(0, Math.min(n, Math.floor(p * (n + 6) - 0.3)));
      if (count === s.lit) return;
      var from = s.lit < 0 ? 0 : Math.min(count, s.lit);
      var to = s.lit < 0 ? n : Math.max(count, s.lit);
      for (var i = from; i < to; i++) s.words[i].classList.toggle("is-lit", i < count);
      s.lit = count;
    }

    function update() {
      var y = window.scrollY;
      scenes.forEach(function (s) {
        var p = s.len > 0 ? clamp01((y - s.top) / s.len) : 0;
        p = Math.round(p * 10000) / 10000;
        if (p !== s.p) { s.p = p; s.el.style.setProperty("--p", p); }
        if (s.steps) updateSteps(s, p);
        if (s.words.length) lightWords(s, p);
        if (s.el === hero && heroCopy) {
          var hide = p > 0.12;
          if (heroCopy.inert !== hide) heroCopy.inert = hide;
        }
      });
      views.forEach(function (o) {
        var v = Math.round(clamp01((y + vh - o.top) / (vh + o.h)) * 10000) / 10000;
        if (v !== o.v) { o.v = v; o.el.style.setProperty("--v", v); }
      });
      lits.forEach(function (o) {
        var on = o.top < y + vh * 0.8;
        if (o.once && o.on) return;
        if (on !== o.on) { o.on = on; o.el.classList.toggle("is-lit", on); }
      });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    function refresh() { measure(); update(); }

    // Rueda del ratón con inercia; en pantallas táctiles queda el desplazamiento nativo
    if (typeof window.Lenis === "function") {
      try {
        smoothScroll = new window.Lenis({ lerp: 0.09, smoothWheel: true, allowNestedScroll: true, autoRaf: true });
        smoothScroll.on("scroll", update);
      } catch (err) { smoothScroll = null; }
    }

    // Enlaces internos (#seccion): mismo desplazamiento suave, debajo del menú fijo
    if (smoothScroll) {
      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || a.classList.contains("skip-link")) return;
        var hash = a.getAttribute("href");
        var target = hash.length > 1 && document.getElementById(hash.slice(1));
        if (!target) return;
        e.preventDefault();
        var y = 0;
        if (target !== header) {
          y = target.getBoundingClientRect().top + window.scrollY;
          if (!target.hasAttribute("data-scene")) y -= (header ? header.offsetHeight : 68) + 12;
        }
        smoothScroll.scrollTo(Math.max(0, y), { duration: 1.3 });
        try { history.pushState(null, "", hash); } catch (err) { /* sin historial */ }
      });
    }

    sizeHorizontal();
    refresh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { sizeHorizontal(); refresh(); });
    window.addEventListener("load", function () { sizeHorizontal(); refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sizeHorizontal(); refresh(); });
    // Si algo cambia de alto (preguntas abiertas, agenda, imágenes), se vuelve a medir
    if ("ResizeObserver" in window) {
      var pending = false;
      new ResizeObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; refresh(); });
      }).observe(document.body);
    }
  }

  /* ---------------------------------------------------------------
     Entrada animada (como el video de marca)
     Un cometa dibuja el arco, sube el mástil con la estrella, aparecen
     las velas, la estrella brilla, se escribe ASCENDA y el logo vuela a
     su lugar en el inicio mientras la página aparece por debajo.
     --------------------------------------------------------------- */
  function initIntro() {
    var root = document.documentElement;
    var intro = document.querySelector(".intro");
    if (!intro) return;
    if (!root.classList.contains("intro-play")) { intro.parentNode.removeChild(intro); return; }

    var q = function (sel) { return intro.querySelector(sel); };
    var logo = q(".intro-logo"), heroMark = document.querySelector(".hero-mark");
    var arcLine = q(".i-arc-line"), trail = q(".i-trail"), comet = q(".i-comet");
    var mast = q(".i-mast"), star = q(".i-star"), halo = q(".i-halo"), ring = q(".i-ring");
    var clipL = q(".i-clip-l"), clipR = q(".i-clip-r"), barL = q(".i-bar-l"), barR = q(".i-bar-r");
    var word = q(".intro-word"), spark = q(".intro-spark"), skipBtn = q(".intro-skip");
    var letters = Array.prototype.slice.call(word.querySelectorAll("span"));
    var tagLines = Array.prototype.slice.call(intro.querySelectorAll(".intro-tag i"));
    var tagText = q(".intro-tag span");
    var END = 6.4; // segundos hasta que el logo vuela al inicio

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function span(t, a, d) { return clamp01((t - a) / d); }
    function inOut(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
    function out(k) { return 1 - Math.pow(1 - k, 3); }
    function back(k) { var c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
    function n(v) { return Math.round(v * 1000) / 1000; }

    // Solo escribe en el DOM cuando el valor cambia
    function attr(el, name, v) {
      var key = "_" + name;
      if (el[key] === v) return;
      el[key] = v;
      el.setAttribute(name, v);
    }
    function css(el, name, v) {
      var key = "_c" + name;
      if (el[key] === v) return;
      el[key] = v;
      el.style.setProperty(name, v);
    }

    // Medidas: centro del logo sin su desplazamiento, y posición de cada letra
    var trailLen = trail.getTotalLength();
    var lx = 0, ly = 0, ls = 1.18, lx0 = 0, ly0 = 0;
    function measureLogo() {
      var r = logo.getBoundingClientRect(), box = intro.getBoundingClientRect();
      lx0 = (box.width / 2) - (r.left + r.width / 2 - lx);
      ly0 = (box.height / 2) - (r.top + r.height / 2 - ly);
    }
    var lettersX = null;
    function measureLetters() {
      lettersX = letters.map(function (el) { return { x: el.offsetLeft, w: el.offsetWidth }; });
    }
    function remeasure() { measureLogo(); lettersX = null; }

    // Dibuja el cuadro del segundo t. tp: tiempo de las piezas del logo (al saltar se completan de golpe)
    function render(t, tp) {
      if (tp === undefined) tp = t;

      // 1. Arco: el cometa lo traza de izquierda a derecha
      var a = inOut(span(tp, 0.35, 1.1));
      attr(arcLine, "stroke-dashoffset", n(1 - a));
      attr(trail, "stroke-dashoffset", n(0.14 - a));
      var trace = tp < 0.35 ? 0 : tp < 1.45 ? clamp01((tp - 0.35) / 0.08) : 1 - span(tp, 1.45, 0.35);
      attr(trail, "opacity", n(trace));
      attr(comet, "opacity", n(trace));
      if (trace > 0) {
        var pt = trail.getPointAtLength(a * trailLen);
        attr(comet, "cx", n(pt.x));
        attr(comet, "cy", n(pt.y));
      }

      // 2. Mástil que sube con la estrella encima
      var m = inOut(span(tp, 1.3, 0.8));
      attr(mast, "transform", "translate(0 566) scale(1 " + n(Math.max(m, 0.001)) + ") translate(0 -566)");
      var flare = span(tp, 2.2, 0.7);
      var sc = 0.38 + 0.62 * back(flare);
      var starY = 241.5 + (1 - m) * 324.5;
      attr(star, "opacity", n(span(tp, 1.3, 0.15)));
      attr(star, "transform", "translate(768.5 " + n(starY) + ") scale(" + n(sc) + ") translate(-768.5 -241.5)");
      attr(halo, "cy", n(starY));

      // 3. Velas: una barra de luz las descubre de abajo hacia arriba
      var l = inOut(span(tp, 1.6, 0.7)), r = inOut(span(tp, 1.75, 0.7));
      attr(clipL, "y", n(612 - 232 * l)); attr(clipL, "height", n(232 * l));
      attr(clipR, "y", n(578 - 197 * r)); attr(clipR, "height", n(197 * r));
      attr(barL, "y", n(612 - 232 * l - 2)); attr(barL, "opacity", n(Math.sin(Math.PI * l)));
      attr(barR, "y", n(578 - 197 * r - 2)); attr(barR, "opacity", n(Math.sin(Math.PI * r)));

      // 4. La estrella brilla y suelta un anillo de luz
      var h = tp < 2.2 ? 0.2 * span(tp, 1.3, 0.3)
        : tp < 2.9 ? 0.2 + 0.8 * out(span(tp, 2.2, 0.7))
        : 1 - 0.55 * inOut(span(tp, 2.9, 0.4));
      attr(halo, "opacity", n(h));
      attr(halo, "r", n(48 * (1 + 0.6 * Math.sin(Math.PI * flare))));
      var k = span(tp, 2.3, 0.85);
      attr(ring, "r", n(26 + 94 * out(k)));
      attr(ring, "opacity", n(k > 0 && k < 1 ? 0.75 * (1 - k) : 0));

      // 5. El logo se corre para dejar sitio al nombre
      var mv = inOut(span(t, 3.0, 0.75));
      lx = lx0 * (1 - mv); ly = ly0 * (1 - mv); ls = 1.18 - 0.18 * mv;
      css(logo, "--lx", n(lx) + "px");
      css(logo, "--ly", n(ly) + "px");
      css(logo, "--ls", String(n(ls)));

      // 6. Una chispa escribe A S C E N D Λ letra por letra
      if (t > 3.2) {
        if (!lettersX) measureLetters();
        letters.forEach(function (el, i) {
          var e = out(span(t, 3.45 + i * 0.16, 0.5));
          css(el, "opacity", String(n(e)));
          css(el, "transform", "translate3d(0," + n((1 - e) * 14) + "px,0)");
        });
        var f = (t - 3.45) / 0.16, last = lettersX.length - 1, sx;
        if (f <= 0) sx = lettersX[0].x;
        else if (f >= last + 1) sx = lettersX[last].x + lettersX[last].w;
        else { var i0 = Math.floor(f); sx = lettersX[i0].x + (f - i0) * lettersX[i0].w; }
        var so = t < 3.35 ? 0 : t < 4.55 ? clamp01((t - 3.35) / 0.1) : 1 - span(t, 4.55, 0.25);
        css(spark, "opacity", String(n(so)));
        css(spark, "transform", "translate3d(" + n(sx) + "px,0,0)");
      }

      // 7. Lema con sus dos líneas
      if (t > 4.6) {
        var tl = inOut(span(t, 4.7, 0.6));
        tagLines.forEach(function (el) { css(el, "transform", "scaleX(" + n(tl) + ")"); });
        var tt = out(span(t, 4.9, 0.6));
        css(tagText, "opacity", String(n(tt)));
      }
    }

    var t = 0, lastNow = 0, raf = 0, leaving = false, done = false;

    // Termina: el logo del inicio toma el relevo y la página queda libre
    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      root.classList.remove("intro-play", "intro-mark-hidden");
      root.classList.add("intro-reveal");
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      if (smoothScroll) smoothScroll.start();
      setTimeout(function () { root.classList.remove("intro-reveal"); }, 1800);
    }

    // Salida: el fondo se desvanece y el logo vuela hasta el logo del inicio
    function leave(fast) {
      if (leaving) return;
      leaving = true;
      cancelAnimationFrame(raf);
      unbind();
      try {
        if (fast) render(t, END);
        intro.classList.add("is-leaving");
        root.classList.remove("intro-play");
        root.classList.add("intro-reveal");
        var to = heroMark && heroMark.getBoundingClientRect();
        var from = logo.getBoundingClientRect();
        if (!to || !to.width || !from.width || typeof logo.animate !== "function") { finish(); return; }
        var s = to.width / from.width;
        var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        var op = parseFloat(getComputedStyle(heroMark).opacity);
        var dur = fast ? 700 : 1100;
        var anim = logo.animate([
          { transform: "translate3d(" + n(lx) + "px," + n(ly) + "px,0) scale(" + n(ls) + ")", opacity: 1 },
          { transform: "translate3d(" + n(lx + dx) + "px," + n(ly + dy) + "px,0) scale(" + n(ls * s) + ")", opacity: isNaN(op) ? 1 : op }
        ], { duration: dur, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
        anim.onfinish = finish;
        setTimeout(finish, dur + 500); // por si el navegador no avisa del final
      } catch (err) { finish(); }
    }

    function frame(now) {
      if (leaving) return;
      // El reloj avanza con los cuadros (máx. 50 ms): en una pestaña de fondo la entrada espera
      t += (lastNow ? Math.min(now - lastNow, 50) : 16) / 1000;
      lastNow = now;
      try { render(t); } catch (err) { finish(); return; }
      if (window.ascendaIntroRespaldo) { clearTimeout(window.ascendaIntroRespaldo); window.ascendaIntroRespaldo = 0; }
      if (t >= END) leave(false);
      else raf = requestAnimationFrame(frame);
    }

    // Saltar: botón, rueda, toque o cualquier tecla (menos Tab para llegar al botón)
    function onSkip(e) {
      if (e.type === "keydown" && (e.key === "Tab" || e.key === "Shift" || e.altKey || e.ctrlKey || e.metaKey)) return;
      leave(true);
    }
    var opts = { passive: true };
    function unbind() {
      window.removeEventListener("wheel", onSkip, opts);
      window.removeEventListener("touchstart", onSkip, opts);
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("resize", remeasure);
    }
    skipBtn.addEventListener("click", function () { leave(true); });
    window.addEventListener("wheel", onSkip, opts);
    window.addEventListener("touchstart", onSkip, opts);
    window.addEventListener("keydown", onSkip);
    window.addEventListener("resize", remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!leaving) remeasure(); });

    if (smoothScroll) smoothScroll.stop();
    window.scrollTo(0, 0);
    try { measureLogo(); render(0); } catch (err) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------
     Inicio
     --------------------------------------------------------------- */
  function init() {
    applyConfig();
    initTheme();
    initNav();
    initReveal();
    initFaq();
    initProducto();
    initServicePreselect();
    initForm();
    initBooking();
    initScenes();
    initIntro();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
