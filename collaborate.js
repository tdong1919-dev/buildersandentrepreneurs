/* ===== Founders & Builders — Co-Host & Collaborate hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "collab";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }
  function normUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }
  function truthy(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    return s === "yes" || s === "true" || s === "1" || s === "on" || s === "y" || s === "virtual";
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "cdemo1", title: "Co-host a founder AMA on fundraising", name: "Marcus Reed",
      category: "AMA", format: "Virtual", city: "Virtual",
      description: "Looking for a co-host with product or growth experience to balance out the finance angle.",
      email: "marcus@example.com", linkedin: "linkedin.com/in/example"
    },
    {
      id: "cdemo2", title: "Cross-promote our newsletters", name: "Priya Nair",
      category: "Cross-promotion", format: "", city: "Remote",
      description: "I write a weekly newsletter for early-stage marketplace founders, ~2k subscribers. Open to a swap.",
      email: "priya@example.com", linkedin: ""
    },
    {
      id: "cdemo3", title: "Run a hands-on pricing workshop", name: "Ava Chen",
      category: "Workshop", format: "", city: "Boise",
      description: "Want to co-run an in-person workshop on pricing for SaaS founders. Looking for a co-facilitator.",
      email: "ava@example.com", linkedin: "linkedin.com/in/example"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchCollabs(cb) {
    if (!hasBackend) { cb(null, SAMPLE, true); return; }
    var cbName = "fbcb_" + Date.now();
    var timer = setTimeout(function () {
      cleanup();
      cb(new Error("Request timed out"), SAMPLE, true);
    }, 12000);
    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[cbName] = function (res) {
      cleanup();
      var list = res && (res.records || res.profiles);
      if (res && res.ok && Array.isArray(list)) cb(null, list, false);
      else cb(new Error(res && res.error || "Bad response"), SAMPLE, true);
    };
    var script = document.createElement("script");
    script.src = API + (API.indexOf("?") === -1 ? "?" : "&") + "type=" + TYPE
      + "&callback=" + cbName + "&t=" + Date.now();
    script.onerror = function () { cleanup(); cb(new Error("Network error"), SAMPLE, true); };
    document.body.appendChild(script);
  }

  /* =====================================================================
     COLLABORATE PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var virtualChip = document.getElementById("virtualChip");
    var all = [];
    var virtualOnly = false;

    grid.innerHTML = skeletons(6);

    fetchCollabs(function (err, collabs, isDemo) {
      all = collabs || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample collabs — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " open collab" : " open collabs");
      }
      render();
    });

    function matches(c) {
      if (virtualOnly && !truthy(c.format)) return false;
      var cat = categorySelect && categorySelect.value;
      if (cat && c.category !== cat) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [c.title, c.name, c.category, c.city, c.description].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    }

    function render() {
      var list = all.filter(matches);
      if (!list.length) {
        grid.innerHTML = "";
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;
      grid.innerHTML = list.map(cardHTML).join("");
      Array.prototype.forEach.call(grid.querySelectorAll("[data-id]"), function (el) {
        el.addEventListener("click", function () {
          var c = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (c) openModal(c);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
    if (virtualChip) virtualChip.addEventListener("click", function () {
      virtualOnly = !virtualOnly;
      virtualChip.classList.toggle("is-active", virtualOnly);
      render();
    });
  }

  function badges(c) {
    var out = "";
    if (c.category) out += '<span class="badge">' + esc(c.category) + "</span>";
    if (truthy(c.format)) out += '<span class="badge badge--mentor">🌎 Virtual</span>';
    return out;
  }

  function cardHTML(c) {
    return (
      '<article class="pcard" data-id="' + esc(c.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(c.name || c.title).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(c.title) + "</h3>" +
            (c.name ? '<p class="pcard__biz">' + esc(c.name) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (c.description ? '<p class="pcard__building">' + esc(c.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' + (c.city ? "📍 " + esc(c.city) : "") + "</span>" +
          '<div class="badges">' + badges(c) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- collab modal ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(c) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(c.name || c.title).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(c.title) + "</h2>" +
          (c.name ? '<p class="modal__biz">' + esc(c.name) + "</p>" : "") +
          '<p class="modal__meta">' + (c.city ? "📍 " + esc(c.city) : "") + "</p>" +
          '<div class="badges">' + badges(c) + "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Description", c.description) +
      (c.linkedin
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(c.linkedin)) + '" target="_blank" rel="noopener noreferrer">🔗 LinkedIn</a>'
        : "") +
      (c.email
        ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(c.email) + "?subject=" + encodeURIComponent("Re: " + c.title) + '">✉️ Let\'s talk</a>'
        : "");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  (function modalWiring() {
    var modal = document.getElementById("profileModal");
    if (!modal) return;
    function close() { modal.hidden = true; document.body.style.overflow = ""; }
    modal.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });
  })();

  /* =====================================================================
     ADD-COLLAB FORM
     ===================================================================== */
  var form = document.getElementById("collabForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.title || !data.email) {
        say("Please describe what you're proposing and add a contact email.", "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        say("Please enter a valid email address.", "err");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Posting…";

      if (!hasBackend) {
        setTimeout(function () {
          say("✅ Demo mode — your collab looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Post the collab";
        }, 600);
        return;
      }

      data.type = TYPE;
      fetch(API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      }).then(function () {
        onSuccess();
      }).catch(function () {
        say("Something went wrong posting your collab. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Post the collab";
      });
    });

    function onSuccess() {
      form.reset();
      say("🎉 Your collab is live! Redirecting you…", "ok");
      setTimeout(function () { window.location.href = "collaborate.html"; }, 1600);
    }

    function collect() {
      var d = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        if (el.type === "checkbox") d[el.name] = el.checked ? (el.value || "Yes") : "";
        else d[el.name] = el.value.trim();
      });
      return d;
    }

    function say(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = "form-status" + (kind ? " form-status--" + kind : "");
    }
  }
})();
