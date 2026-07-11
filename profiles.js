/* ===== Founders & Builders — Member Profiles hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function truthy(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    return s === "yes" || s === "true" || s === "1" || s === "on" || s === "y";
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "" ) + ((parts[1] || "")[0] || "");
  }
  function tags(str) {
    return String(str || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function normUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var SAMPLE = [
    {
      id: "demo1", name: "Ava Chen", building: "An AI copilot for indie founders",
      business: "Tinkerlab", stage: "MVP / Beta", industry: "AI / SaaS", location: "Boise, ID",
      skills: "Product, Machine Learning, Growth", canHelp: "Happy to review AI product ideas and pricing.",
      lookingFor: "A technical co-founder and first 10 beta users.", bio: "Ex-product lead, now building solo.",
      website: "example.com", linkedin: "linkedin.com/in/example", mentor: "Yes", speaker: "Yes"
    },
    {
      id: "demo2", name: "Marcus Reed", building: "Fractional CFO services for startups",
      business: "Reed Finance", stage: "Early revenue", industry: "Fintech", location: "Atlanta, GA",
      skills: "Finance, Fundraising, Operations", canHelp: "Financial modeling and fundraising prep.",
      lookingFor: "Referrals to seed-stage founders.", bio: "20 years in startup finance.",
      website: "example.com", investor: "Yes", mentor: "Yes"
    },
    {
      id: "demo3", name: "Priya Nair", building: "A marketplace for local makers",
      business: "Craftly", stage: "Growth", industry: "E-commerce", location: "Remote",
      skills: "Design, Marketing, Community", canHelp: "Brand and community-building advice.",
      lookingFor: "A senior engineer and marketing partner.", bio: "Designer-founder, community nerd.",
      website: "example.com", podcast: "Yes", speaker: "Yes"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchProfiles(cb) {
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
      if (res && res.ok && Array.isArray(res.profiles)) cb(null, res.profiles, false);
      else cb(new Error(res && res.error || "Bad response"), SAMPLE, true);
    };
    var script = document.createElement("script");
    script.src = API + (API.indexOf("?") === -1 ? "?" : "&") + "callback=" + cbName + "&t=" + Date.now();
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
    var filterEls = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var all = [];
    var activeFilter = "all";

    grid.innerHTML = skeletons(6);

    fetchProfiles(function (err, profiles, isDemo) {
      all = profiles || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample profiles — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " member" : " members");
      }
      render();
    });

    function matches(p) {
      if (activeFilter !== "all" && !truthy(p[activeFilter])) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [p.name, p.building, p.business, p.industry, p.location, p.skills, p.lookingFor, p.canHelp]
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
          var p = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (p) openModal(p);
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    filterEls.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterEls.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        activeFilter = btn.getAttribute("data-filter");
        render();
      });
    });
  }

  function badges(p) {
    var out = "";
    if (truthy(p.mentor)) out += '<span class="badge badge--mentor">🤝 Mentor</span>';
    if (truthy(p.investor)) out += '<span class="badge badge--investor">💰 Investor</span>';
    if (truthy(p.speaker)) out += '<span class="badge badge--speaker">🎤 Speaker</span>';
    if (truthy(p.podcast)) out += '<span class="badge badge--podcast">🎙️ Podcast</span>';
    return out;
  }

  function cardHTML(p) {
    var skillTags = tags(p.skills).slice(0, 4).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
    return (
      '<article class="pcard" data-id="' + esc(p.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(p.name).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(p.name) + "</h3>" +
            (p.business ? '<p class="pcard__biz">' + esc(p.business) + (p.stage ? " · " + esc(p.stage) : "") + "</p>" : "") +
          "</div>" +
        "</div>" +
        (p.building ? '<p class="pcard__building">' + esc(p.building) + "</p>" : "") +
        (skillTags ? '<div class="tags">' + skillTags + "</div>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' + (p.location ? "📍 " + esc(p.location) : "") + "</span>" +
          '<div class="badges">' + badges(p) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- profile modal ---------- */
  function linkRow(p) {
    var links = [
      ["Website", normUrl(p.website)],
      ["Portfolio", normUrl(p.portfolio)],
      ["LinkedIn", normUrl(p.linkedin)],
      ["GitHub", normUrl(p.github)],
      ["X", normUrl(p.x)]
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

  function openModal(p) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    var skillTags = tags(p.skills).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(p.name).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(p.name) + "</h2>" +
          (p.business ? '<p class="modal__biz">' + esc(p.business) + (p.stage ? " · " + esc(p.stage) : "") + "</p>" : "") +
          '<p class="modal__meta">' +
            (p.industry ? "🏭 " + esc(p.industry) + "&nbsp;&nbsp;" : "") +
            (p.location ? "📍 " + esc(p.location) : "") +
          "</p>" +
          '<div class="badges">' + badges(p) + (truthy(p.volunteer) ? '<span class="badge">🙌 Volunteer</span>' : "") + "</div>" +
        "</div>" +
      "</div>" +
      (p.building ? '<p class="modal__building">' + esc(p.building) + "</p>" : "") +
      (skillTags ? '<div class="tags">' + skillTags + "</div>" : "") +
      detailBlock("Bio", p.bio) +
      detailBlock("Current goals", p.goals) +
      detailBlock("What they're looking for", p.lookingFor) +
      detailBlock("How they can help", p.canHelp) +
      detailBlock("Products &amp; services", p.products) +
      linkRow(p) +
      (p.email ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(p.email) + '">✉️ Get in touch</a>' : "");
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
     CREATE-PROFILE FORM
     ===================================================================== */
  var form = document.getElementById("profileForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.name || !data.email) {
        say("Please fill in your name and email.", "err");
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
          say("✅ Demo mode — your profile looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Publish my profile";
        }, 600);
        return;
      }

      // Apps Script web apps can't return readable CORS responses to a POST,
      // so we fire-and-forget with no-cors and confirm optimistically.
      fetch(API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      }).then(function () {
        onSuccess();
      }).catch(function () {
        // no-cors resolves opaque; a catch here is a genuine network failure
        say("Something went wrong sending your profile. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Publish my profile";
      });
    });

    function onSuccess() {
      form.reset();
      say("🎉 Your profile is live! Redirecting you to the directory…", "ok");
      setTimeout(function () { window.location.href = "profiles.html"; }, 1600);
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
