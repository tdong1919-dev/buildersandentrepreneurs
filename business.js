/* ===== Founders & Builders — Business Directory hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "business";

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
  function tags(str) {
    return String(str || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function normUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }
  function isHiring(b) {
    return String(b.hiring || "").toLowerCase().indexOf("hiring now") === 0
      || String(b.hiring || "").toLowerCase().indexOf("open to") === 0;
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "bdemo1", name: "Tinkerlab", category: "Startup", industry: "AI / SaaS",
      description: "An AI copilot that helps indie founders ship faster.",
      products: "Tinkerlab Copilot", services: "", team: "Solo founder", hiring: "Open to great people",
      website: "example.com", linkedin: "linkedin.com/company/example", email: "hello@tinkerlab.example"
    },
    {
      id: "bdemo2", name: "Reed Finance", category: "Service provider", industry: "Fintech",
      description: "Fractional CFO services for early-stage startups.",
      products: "", services: "Financial modeling, Fundraising prep, Bookkeeping", team: "3 people", hiring: "Not currently hiring",
      website: "example.com", email: "hello@reedfinance.example"
    },
    {
      id: "bdemo3", name: "Craftly", category: "Product", industry: "E-commerce",
      description: "A marketplace connecting local makers with buyers nearby.",
      products: "Craftly Marketplace", services: "", team: "5 people", hiring: "Hiring now",
      website: "example.com", instagram: "instagram.com/example", email: "hello@craftly.example"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchBusinesses(cb) {
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
     DIRECTORY PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var hiringChip = document.getElementById("hiringChip");
    var all = [];
    var hiringOnly = false;

    grid.innerHTML = skeletons(6);

    fetchBusinesses(function (err, businesses, isDemo) {
      all = businesses || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample listings — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " business" : " businesses");
      }
      render();
    });

    function matches(b) {
      if (hiringOnly && !isHiring(b)) return false;
      var cat = categorySelect && categorySelect.value;
      if (cat && b.category !== cat) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [b.name, b.description, b.industry, b.category, b.products, b.services]
        .join(" ").toLowerCase();
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
          var b = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (b) openModal(b);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
    if (hiringChip) hiringChip.addEventListener("click", function () {
      hiringOnly = !hiringOnly;
      hiringChip.classList.toggle("is-active", hiringOnly);
      render();
    });
  }

  function badges(b) {
    var out = "";
    if (b.category) out += '<span class="badge">' + esc(b.category) + "</span>";
    if (isHiring(b)) out += '<span class="badge badge--mentor">' + esc(b.hiring) + "</span>";
    return out;
  }

  function cardHTML(b) {
    var svcTags = tags(b.products).concat(tags(b.services)).slice(0, 4).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
    return (
      '<article class="pcard" data-id="' + esc(b.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          (b.logo ? '<img class="avatar" style="object-fit:cover" src="' + esc(normUrl(b.logo)) + '" alt="" />' :
            '<div class="avatar">' + esc(initials(b.name).toUpperCase()) + "</div>") +
          '<div>' +
            '<h3 class="pcard__name">' + esc(b.name) + "</h3>" +
            (b.industry ? '<p class="pcard__biz">' + esc(b.industry) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (b.description ? '<p class="pcard__building">' + esc(b.description) + "</p>" : "") +
        (svcTags ? '<div class="tags">' + svcTags + "</div>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' + (b.team ? esc(b.team) : "") + "</span>" +
          '<div class="badges">' + badges(b) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- business modal ---------- */
  function linkRow(b) {
    var links = [
      ["Website", normUrl(b.website)],
      ["LinkedIn", normUrl(b.linkedin)],
      ["X", normUrl(b.x)],
      ["Instagram", normUrl(b.instagram)]
    ].filter(function (l) { return l[1]; });
    if (!links.length) return "";
    return '<div class="modal__links">' + links.map(function (l) {
      return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + l[0] + " ↗</a>";
    }).join("") + "</div>";
  }

  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(b) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    var svcTags = tags(b.products).concat(tags(b.services)).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
    body.innerHTML =
      '<div class="modal__head">' +
        (b.logo ? '<img class="avatar avatar--lg" style="object-fit:cover" src="' + esc(normUrl(b.logo)) + '" alt="" />' :
          '<div class="avatar avatar--lg">' + esc(initials(b.name).toUpperCase()) + "</div>") +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(b.name) + "</h2>" +
          (b.industry ? '<p class="modal__biz">' + esc(b.industry) + "</p>" : "") +
          (b.team ? '<p class="modal__meta">' + esc(b.team) + "</p>" : "") +
          '<div class="badges">' + badges(b) + "</div>" +
        "</div>" +
      "</div>" +
      (b.description ? '<p class="modal__building">' + esc(b.description) + "</p>" : "") +
      (svcTags ? '<div class="tags">' + svcTags + "</div>" : "") +
      linkRow(b) +
      (b.email ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(b.email) + '">Get in touch</a>' : "");
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
     ADD-BUSINESS FORM
     ===================================================================== */
  var form = document.getElementById("businessForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.name || !data.email) {
        say("Please fill in your business name and contact email.", "err");
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
          say("Demo mode — your listing looks great! Connect the Google Sheet backend to publish it for real.", "ok");
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
      say("Your listing is live! Redirecting you to the directory…", "ok");
      setTimeout(function () { window.location.href = "business.html"; }, 1600);
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
