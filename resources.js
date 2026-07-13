/* ===== Founders & Builders — Resource Library hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "resource";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function normUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "rdemo1", title: "Seed Deck Template", category: "Template",
      description: "A 12-slide pitch deck template covering problem, solution, traction, and ask.",
      link: "example.com/deck-template", submittedBy: "Dana Ellis"
    },
    {
      id: "rdemo2", title: "Cold Outreach Prompt Pack", category: "AI Prompt",
      description: "A set of prompts for drafting cold intro emails to investors and customers.",
      link: "example.com/prompts", submittedBy: "Ava Chen"
    },
    {
      id: "rdemo3", title: "Startup Grant Database", category: "Grant Database",
      description: "A running list of non-dilutive grants for early-stage founders, sorted by industry.",
      link: "example.com/grants", submittedBy: "Priya Nair"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchResources(cb) {
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
     RESOURCE LIBRARY PAGE
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

    fetchResources(function (err, resources, isDemo) {
      all = resources || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample resources — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " resource" : " resources");
      }
      render();
    });

    function matches(r) {
      var cat = categorySelect && categorySelect.value;
      if (cat && r.category !== cat) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [r.title, r.category, r.description, r.submittedBy].join(" ").toLowerCase();
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
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
  }

  function cardHTML(r) {
    return (
      '<a class="pcard" href="' + esc(normUrl(r.link)) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(r.title).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(r.title) + "</h3>" +
            (r.submittedBy ? '<p class="pcard__biz">Shared by ' + esc(r.submittedBy) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (r.description ? '<p class="pcard__building">' + esc(r.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">Open resource →</span>' +
          '<div class="badges">' + (r.category ? '<span class="badge">' + esc(r.category) + "</span>" : "") + "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* =====================================================================
     ADD-RESOURCE FORM
     ===================================================================== */
  var form = document.getElementById("resourceForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.title || !data.link) {
        say("Please fill in the title and link.", "err");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Submitting…";

      if (!hasBackend) {
        setTimeout(function () {
          say("Demo mode — your resource looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Submit the resource";
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
        say("Something went wrong submitting your resource. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Submit the resource";
      });
    });

    function onSuccess() {
      form.reset();
      say("Your resource is live! Redirecting you to the library…", "ok");
      setTimeout(function () { window.location.href = "resources.html"; }, 1600);
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
