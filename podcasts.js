/* ===== Founders & Builders — Podcast Hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "podcast";

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
      id: "pdemo1", showName: "Founders, Unfiltered", host: "Ava Chen", format: "Interview",
      topics: "AI, Product, Solo founders", lookingFor: "Guests", city: "Remote",
      description: "Weekly conversations with early-stage founders about what's actually hard right now.",
      listenLink: "example.com/listen", email: "ava@example.com", linkedin: "linkedin.com/in/example"
    },
    {
      id: "pdemo2", showName: "The Fundraising Files", host: "Marcus Reed", format: "Solo",
      topics: "Fundraising, Finance, VC", lookingFor: "Sponsors", city: "Atlanta",
      description: "Short solo episodes breaking down one fundraising concept at a time.",
      listenLink: "", email: "marcus@example.com", linkedin: "linkedin.com/in/example"
    },
    {
      id: "pdemo3", showName: "Built Different", host: "Priya Nair", format: "Co-hosted",
      topics: "Marketplaces, Community, Design", lookingFor: "Co-host", city: "Boise",
      description: "Two co-hosts, one live studio audience, real questions from the local founder community.",
      listenLink: "example.com/listen", email: "priya@example.com", linkedin: ""
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchPodcasts(cb) {
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
     PODCAST HUB PAGE
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

    fetchPodcasts(function (err, podcasts, isDemo) {
      all = podcasts || [];
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample shows — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " show" : " shows");
      }
      render();
    });

    function matches(p) {
      var lf = categorySelect && categorySelect.value;
      if (lf && p.lookingFor !== lf) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [p.showName, p.host, p.topics, p.city, p.description].join(" ").toLowerCase();
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
    if (categorySelect) categorySelect.addEventListener("change", render);
  }

  function badges(p) {
    var out = "";
    if (p.format) out += '<span class="badge">' + esc(p.format) + "</span>";
    if (p.lookingFor && p.lookingFor !== "Not right now") out += '<span class="badge badge--investor">' + esc(p.lookingFor) + "</span>";
    tags(p.topics).forEach(function (t) {
      out += '<span class="badge badge--mentor">' + esc(t) + "</span>";
    });
    return out;
  }

  function cardHTML(p) {
    return (
      '<article class="pcard" data-id="' + esc(p.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(p.showName).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(p.showName) + "</h3>" +
            (p.host ? '<p class="pcard__biz">' + esc(p.host) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (p.description ? '<p class="pcard__building">' + esc(p.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' + (p.city ? esc(p.city) : "") + "</span>" +
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

  /* ---------- podcast modal ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(p) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(p.showName).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(p.showName) + "</h2>" +
          (p.host ? '<p class="modal__biz">' + esc(p.host) + "</p>" : "") +
          '<p class="modal__meta">' + (p.city ? esc(p.city) : "") + "</p>" +
          '<div class="badges">' + badges(p) + "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Description", p.description) +
      (p.listenLink
        ? '<a class="btn btn--lg modal__contact" href="' + esc(normUrl(p.listenLink)) + '" target="_blank" rel="noopener noreferrer">Listen</a>'
        : "") +
      (p.linkedin
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(p.linkedin)) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>'
        : "") +
      (p.email
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="mailto:' + esc(p.email) + "?subject=" + encodeURIComponent("Re: " + p.showName) + '">Get in touch</a>'
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
     ADD-PODCAST FORM
     ===================================================================== */
  var form = document.getElementById("podcastForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.showName || !data.email) {
        say("Please fill in your show name and contact email.", "err");
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
          say("Demo mode — your podcast listing looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "List your podcast";
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
        btn.textContent = "List your podcast";
      });
    });

    function onSuccess() {
      form.reset();
      say("Your show is listed! Redirecting you to the Podcast Hub…", "ok");
      setTimeout(function () { window.location.href = "podcasts.html"; }, 1600);
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
