/* ===== Founders & Builders — Help Board hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "help";

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

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "hdemo1", title: "Technical co-founder for a fintech MVP", name: "Marcus Reed",
      category: "Technical co-founder", urgency: "ASAP",
      description: "Non-technical founder with 10 years in banking, have paying pilot customers lined up. Need an engineer to build the MVP with me.",
      email: "marcus@example.com", linkedin: "linkedin.com/in/example"
    },
    {
      id: "hdemo2", title: "5 beta testers for an AI copilot", name: "Ava Chen",
      category: "Beta testers", urgency: "This month",
      description: "Looking for indie founders willing to try our AI copilot for two weeks and give structured feedback.",
      email: "ava@example.com", linkedin: ""
    },
    {
      id: "hdemo3", title: "Intro to a lawyer for SAFE docs", name: "Priya Nair",
      category: "Legal", urgency: "No rush",
      description: "Raising a small pre-seed round and need someone to review SAFE agreements before we sign.",
      email: "priya@example.com", linkedin: "linkedin.com/in/example"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchHelp(cb) {
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
     HELP BOARD PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var all = [];

    grid.innerHTML = skeletons(6);

    fetchHelp(function (err, items, isDemo) {
      all = items || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample requests — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " open ask" : " open asks");
      }
      render();
    });

    function matches(h) {
      var cat = categorySelect && categorySelect.value;
      if (cat && h.category !== cat) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [h.title, h.name, h.category, h.description].join(" ").toLowerCase();
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
          var h = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (h) openModal(h);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
  }

  function badges(h) {
    var out = "";
    if (h.category) out += '<span class="badge">' + esc(h.category) + "</span>";
    if (h.urgency === "ASAP") out += '<span class="badge badge--investor">🔥 ASAP</span>';
    else if (h.urgency) out += '<span class="badge badge--mentor">' + esc(h.urgency) + "</span>";
    return out;
  }

  function cardHTML(h) {
    return (
      '<article class="pcard" data-id="' + esc(h.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(h.name || h.title).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(h.title) + "</h3>" +
            (h.name ? '<p class="pcard__biz">' + esc(h.name) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (h.description ? '<p class="pcard__building">' + esc(h.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc"></span>' +
          '<div class="badges">' + badges(h) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- help modal ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(h) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(h.name || h.title).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(h.title) + "</h2>" +
          (h.name ? '<p class="modal__biz">' + esc(h.name) + "</p>" : "") +
          '<div class="badges">' + badges(h) + "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Description", h.description) +
      (h.linkedin
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(h.linkedin)) + '" target="_blank" rel="noopener noreferrer">🔗 LinkedIn</a>'
        : "") +
      (h.email
        ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(h.email) + "?subject=" + encodeURIComponent("Re: " + h.title) + '">✉️ I can help</a>'
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
     ADD-HELP FORM
     ===================================================================== */
  var form = document.getElementById("helpForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.title || !data.email) {
        say("Please describe what you need and add a contact email.", "err");
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
          say("✅ Demo mode — your ask looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Post to the help board";
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
        say("Something went wrong posting your ask. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Post to the help board";
      });
    });

    function onSuccess() {
      form.reset();
      say("🎉 Your ask is live! Redirecting you to the help board…", "ok");
      setTimeout(function () { window.location.href = "help.html"; }, 1600);
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
