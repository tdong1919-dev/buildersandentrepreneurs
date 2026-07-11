/* ===== Founders & Builders — Marketplace hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "listing";

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
      id: "ldemo1", name: "Tinkerlab Copilot", category: "AI tools",
      description: "An AI copilot that helps indie founders ship faster — from idea to launch.",
      pricing: "$29/mo", demo: "example.com/demo", website: "example.com",
      email: "hello@tinkerlab.example"
    },
    {
      id: "ldemo2", name: "Brand-in-a-Box", category: "Graphic design",
      description: "A complete brand identity package — logo, colors, type, and templates.",
      pricing: "$650 flat", website: "example.com", email: "hello@brandbox.example"
    },
    {
      id: "ldemo3", name: "Fundraising Deck Templates", category: "Templates",
      description: "Investor-ready pitch deck templates used by 50+ funded startups.",
      pricing: "$39", demo: "example.com/preview", website: "example.com",
      email: "hello@decks.example"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchListings(cb) {
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
     MARKETPLACE PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var demoChip = document.getElementById("demoChip");
    var all = [];
    var demoOnly = false;

    grid.innerHTML = skeletons(6);

    fetchListings(function (err, listings, isDemo) {
      all = listings || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample listings — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " listing" : " listings");
      }
      render();
    });

    function matches(l) {
      if (demoOnly && !l.demo) return false;
      var cat = categorySelect && categorySelect.value;
      if (cat && l.category !== cat) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [l.name, l.description, l.category, l.pricing].join(" ").toLowerCase();
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
          var l = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (l) openModal(l);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
    if (demoChip) demoChip.addEventListener("click", function () {
      demoOnly = !demoOnly;
      demoChip.classList.toggle("is-active", demoOnly);
      render();
    });
  }

  function badges(l) {
    var out = "";
    if (l.category) out += '<span class="badge">' + esc(l.category) + "</span>";
    if (l.demo) out += '<span class="badge badge--speaker">🎥 Demo</span>';
    return out;
  }

  function cardHTML(l) {
    return (
      '<article class="pcard" data-id="' + esc(l.id) + '" tabindex="0" role="button">' +
        (l.image
          ? '<img class="pcard__img" src="' + esc(normUrl(l.image)) + '" alt="" />'
          : '<div class="pcard__top">' +
              '<div class="avatar">' + esc(initials(l.name).toUpperCase()) + "</div>" +
            "</div>") +
        '<h3 class="pcard__name">' + esc(l.name) + "</h3>" +
        (l.description ? '<p class="pcard__building">' + esc(l.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc pcard__price">' + (l.pricing ? esc(l.pricing) : "") + "</span>" +
          '<div class="badges">' + badges(l) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- listing modal ---------- */
  function linkRow(l) {
    var links = [
      ["Website", normUrl(l.website)],
      ["View demo", normUrl(l.demo)]
    ].filter(function (x) { return x[1]; });
    if (!links.length) return "";
    return '<div class="modal__links">' + links.map(function (x) {
      return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener noreferrer">' + x[0] + " ↗</a>";
    }).join("") + "</div>";
  }

  function openModal(l) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      (l.image ? '<img class="modal__img" src="' + esc(normUrl(l.image)) + '" alt="" />' : "") +
      '<div class="modal__head">' +
        (l.image ? "" :
          '<div class="avatar avatar--lg">' + esc(initials(l.name).toUpperCase()) + "</div>") +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(l.name) + "</h2>" +
          (l.pricing ? '<p class="modal__biz modal__price">' + esc(l.pricing) + "</p>" : "") +
          '<div class="badges">' + badges(l) + "</div>" +
        "</div>" +
      "</div>" +
      (l.description ? '<p class="modal__building">' + esc(l.description) + "</p>" : "") +
      linkRow(l) +
      (l.email
        ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(l.email) + "?subject=" + encodeURIComponent("Booking consultation: " + l.name) + '">📅 Book a consultation</a>'
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
     ADD-LISTING FORM
     ===================================================================== */
  var form = document.getElementById("listingForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.name || !data.email) {
        say("Please fill in the product/service name and contact email.", "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        say("Please enter a valid email address.", "err");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Publishing…";

      if (!hasBackend) {
        setTimeout(function () {
          say("✅ Demo mode — your listing looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Publish listing";
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
        say("Something went wrong sending your listing. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Publish listing";
      });
    });

    function onSuccess() {
      form.reset();
      say("🎉 Your listing is live! Redirecting you to the marketplace…", "ok");
      setTimeout(function () { window.location.href = "marketplace.html"; }, 1600);
    }

    function collect() {
      var d = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        d[el.name] = el.value.trim();
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
