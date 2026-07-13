/* ===== Founders & Builders — Mentor Network hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "mentor";

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
  function tags(str) {
    return String(str || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "mdemo1", name: "Dana Ellis", title: "Fractional CTO", company: "Ellis Consulting",
      industry: "DevTools / SaaS", expertise: "Engineering leadership, Architecture, Hiring",
      stages: "MVP, Pre-seed, Seed", experience: "15 years", availability: "3 hrs/month",
      officeHours: "Fridays 2-4pm ET",
      bio: "Former VP Eng at two Series B startups. I help technical founders hire their first engineers and avoid architecture mistakes that bite later.",
      email: "dana@example.com", linkedin: "linkedin.com/in/example", website: ""
    },
    {
      id: "mdemo2", name: "Marcus Reed", title: "Fundraising Advisor", company: "Reed Finance",
      industry: "Fintech", expertise: "Fundraising, Financial modeling, Investor relations",
      stages: "Pre-seed, Seed, Growth", experience: "20 years", availability: "2 hrs/month",
      officeHours: "Book via link",
      bio: "20 years in startup finance, ex-VC. Happy to review your deck and financial model before you go out to raise.",
      email: "marcus@example.com", linkedin: "", website: "example.com"
    },
    {
      id: "mdemo3", name: "Priya Nair", title: "Growth & Community Lead", company: "Craftly",
      industry: "E-commerce / Marketplaces", expertise: "Community building, Brand, Marketing",
      stages: "Idea, MVP, Growth", experience: "8 years", availability: "Ad hoc",
      officeHours: "",
      bio: "Designer-founder who's grown two community-driven marketplaces from zero. Ask me about brand and early growth loops.",
      email: "priya@example.com", linkedin: "linkedin.com/in/example", website: ""
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchMentors(cb) {
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
     MENTORS PAGE
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

    fetchMentors(function (err, mentors, isDemo) {
      all = mentors || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample mentors — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " mentor" : " mentors");
      }
      render();
    });

    function matches(m) {
      var stage = categorySelect && categorySelect.value;
      if (stage && tags(m.stages).indexOf(stage) === -1) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [m.name, m.title, m.company, m.industry, m.expertise, m.bio].join(" ").toLowerCase();
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
          var m = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (m) openModal(m);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
  }

  function badges(m) {
    var out = "";
    if (m.industry) out += '<span class="badge">' + esc(m.industry) + "</span>";
    tags(m.stages).forEach(function (s) {
      out += '<span class="badge badge--mentor">' + esc(s) + "</span>";
    });
    return out;
  }

  function cardHTML(m) {
    return (
      '<article class="pcard" data-id="' + esc(m.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(m.name).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(m.name) + "</h3>" +
            (m.title || m.company
              ? '<p class="pcard__biz">' + esc([m.title, m.company].filter(Boolean).join(" · ")) + "</p>"
              : "") +
          "</div>" +
        "</div>" +
        (m.bio ? '<p class="pcard__building">' + esc(m.bio) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' +
            (m.expertise ? esc(m.expertise) : "") +
          "</span>" +
          '<div class="badges">' + badges(m) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- mentor modal ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(m) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(m.name).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(m.name) + "</h2>" +
          (m.title || m.company
            ? '<p class="modal__biz">' + esc([m.title, m.company].filter(Boolean).join(" · ")) + "</p>"
            : "") +
          '<div class="badges">' + badges(m) + "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Bio", m.bio) +
      detailBlock("Expertise", m.expertise) +
      detailBlock("Experience", m.experience) +
      detailBlock("Availability", m.availability) +
      detailBlock("Office hours", m.officeHours) +
      (m.linkedin
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(m.linkedin)) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>'
        : "") +
      (m.website
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(m.website)) + '" target="_blank" rel="noopener noreferrer">Website</a>'
        : "") +
      (m.email
        ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(m.email) + "?subject=" + encodeURIComponent("Mentorship: intro from Founders & Builders") + '">Reach out</a>'
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
     BECOME-A-MENTOR FORM
     ===================================================================== */
  var form = document.getElementById("mentorForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.name || !data.email) {
        say("Please fill in your name and contact email.", "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        say("Please enter a valid email address.", "err");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Submitting…";

      if (!hasBackend) {
        setTimeout(function () {
          say("Demo mode — your mentor profile looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "List me as a mentor";
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
        say("Something went wrong sending your info. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "List me as a mentor";
      });
    });

    function onSuccess() {
      form.reset();
      say("You're listed! Redirecting you to the mentor network…", "ok");
      setTimeout(function () { window.location.href = "mentors.html"; }, 1600);
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
