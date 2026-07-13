/* ===== Founders & Builders — Jobs & Opportunities hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "job";

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
    return s === "yes" || s === "true" || s === "1" || s === "on" || s === "y";
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "jdemo1", title: "Founding Engineer", company: "Tinkerlab", category: "Full-time",
      location: "Boise, ID", remote: "Yes", compensation: "$110–140k + equity",
      description: "Join as the first engineering hire to build our AI copilot product.",
      applyLink: "example.com/apply", email: "jobs@tinkerlab.example"
    },
    {
      id: "jdemo2", title: "Fractional CMO", company: "Craftly", category: "Fractional",
      location: "Remote", remote: "Yes", compensation: "$3k/mo, 10hrs/wk",
      description: "Help a Series-seed marketplace startup build out growth marketing.",
      email: "hello@craftly.example"
    },
    {
      id: "jdemo3", title: "Technical Co-founder", company: "Stealth", category: "Co-founder",
      location: "Atlanta, GA", remote: "", compensation: "Equity",
      description: "Non-technical founder with domain expertise in fintech seeking a CTO.",
      email: "founder@stealth.example"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchJobs(cb) {
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
     JOBS PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var remoteChip = document.getElementById("remoteChip");
    var all = [];
    var remoteOnly = false;

    grid.innerHTML = skeletons(6);

    fetchJobs(function (err, jobs, isDemo) {
      all = jobs || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample openings — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " opportunity" : " opportunities");
      }
      render();
    });

    function matches(j) {
      if (remoteOnly && !truthy(j.remote)) return false;
      var cat = categorySelect && categorySelect.value;
      if (cat && j.category !== cat) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [j.title, j.company, j.location, j.category, j.description].join(" ").toLowerCase();
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
          var j = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (j) openModal(j);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
    if (remoteChip) remoteChip.addEventListener("click", function () {
      remoteOnly = !remoteOnly;
      remoteChip.classList.toggle("is-active", remoteOnly);
      render();
    });
  }

  function badges(j) {
    var out = "";
    if (j.category) out += '<span class="badge">' + esc(j.category) + "</span>";
    if (truthy(j.remote)) out += '<span class="badge badge--mentor">Remote</span>';
    return out;
  }

  function cardHTML(j) {
    return (
      '<article class="pcard" data-id="' + esc(j.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(j.company || j.title).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(j.title) + "</h3>" +
            (j.company ? '<p class="pcard__biz">' + esc(j.company) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (j.description ? '<p class="pcard__building">' + esc(j.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' +
            (j.location ? esc(j.location) : "") +
            (j.compensation ? (j.location ? " · " : "") + esc(j.compensation) : "") +
          "</span>" +
          '<div class="badges">' + badges(j) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- job modal ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(j) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(j.company || j.title).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(j.title) + "</h2>" +
          (j.company ? '<p class="modal__biz">' + esc(j.company) + "</p>" : "") +
          '<p class="modal__meta">' +
            (j.location ? esc(j.location) + "&nbsp;&nbsp;" : "") +
            (j.compensation ? esc(j.compensation) : "") +
          "</p>" +
          '<div class="badges">' + badges(j) + "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Description", j.description) +
      (j.applyLink
        ? '<a class="btn btn--lg modal__contact" href="' + esc(normUrl(j.applyLink)) + '" target="_blank" rel="noopener noreferrer">Apply now</a>'
        : "") +
      (j.email
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="mailto:' + esc(j.email) + "?subject=" + encodeURIComponent("Application: " + j.title) + '">Contact about this role</a>'
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
     ADD-JOB FORM
     ===================================================================== */
  var form = document.getElementById("jobForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.title || !data.email) {
        say("Please fill in the job title and contact email.", "err");
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
          say("Demo mode — your posting looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Publish opportunity";
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
        say("Something went wrong sending your posting. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Publish opportunity";
      });
    });

    function onSuccess() {
      form.reset();
      say("Your opportunity is live! Redirecting you to the jobs board…", "ok");
      setTimeout(function () { window.location.href = "jobs.html"; }, 1600);
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
