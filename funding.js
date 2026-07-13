/* ===== Founders & Builders — Funding Hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);

  var RAISE_STAGES = ["Idea", "Pre-seed", "Seed", "Series A", "Series B+", "Bridge / Note"];
  var INVESTOR_TYPES = ["Angel", "VC Fund", "Family Office", "Syndicate", "Corporate VC", "Accelerator"];

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
  var SAMPLE_RAISE = [
    {
      id: "rdemo1", company: "Tinkerlab", founder: "Ava Chen", stage: "Seed", industry: "AI / SaaS",
      amountSeeking: "$750k", raisedSoFar: "$150k friends & family",
      useOfFunds: "Engineering hires, go-to-market",
      description: "An AI copilot for indie founders. 40 paying beta users, $3k MRR, growing 20% m/m.",
      email: "ava@example.com", website: "example.com", linkedin: "linkedin.com/in/example"
    },
    {
      id: "rdemo2", company: "Reed Finance", founder: "Marcus Reed", stage: "Pre-seed", industry: "Fintech",
      amountSeeking: "$250k", raisedSoFar: "$0",
      useOfFunds: "Founding engineer, compliance review",
      description: "Fractional CFO tooling for startups. Piloting with 5 agencies, building the self-serve product now.",
      email: "marcus@example.com", website: "", linkedin: "linkedin.com/in/example"
    }
  ];
  var SAMPLE_INVESTOR = [
    {
      id: "idemo1", name: "Priya Nair", firm: "Craftly Ventures", type: "Angel", checkSize: "$10k–25k",
      stages: "Idea, Pre-seed", industries: "E-commerce, Marketplaces, Consumer",
      thesis: "I back designer-founders building community-driven products. Warm intro or cold email both fine.",
      email: "priya@example.com", website: "", linkedin: "linkedin.com/in/example"
    },
    {
      id: "idemo2", name: "Dana Ellis", firm: "Ellis Capital", type: "VC Fund", checkSize: "$100k–500k",
      stages: "Seed, Series A", industries: "DevTools, SaaS, Infrastructure",
      thesis: "We lead or co-lead seed rounds for technical founding teams with early revenue.",
      email: "dana@example.com", website: "example.com", linkedin: ""
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchType(type, sample, cb) {
    if (!hasBackend) { cb(null, sample, true); return; }
    var cbName = "fbcb_" + Date.now() + "_" + type;
    var timer = setTimeout(function () {
      cleanup();
      cb(new Error("Request timed out"), sample, true);
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
      else cb(new Error(res && res.error || "Bad response"), sample, true);
    };
    var script = document.createElement("script");
    script.src = API + (API.indexOf("?") === -1 ? "?" : "&") + "type=" + type
      + "&callback=" + cbName + "&t=" + Date.now();
    script.onerror = function () { cleanup(); cb(new Error("Network error"), sample, true); };
    document.body.appendChild(script);
  }

  /* =====================================================================
     FUNDING HUB PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var emptyText = document.getElementById("emptyText");
    var emptyCta = document.getElementById("emptyCta");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var viewRaising = document.getElementById("viewRaising");
    var viewInvesting = document.getElementById("viewInvesting");

    var data = { raise: [], investor: [] };
    var isDemo = { raise: true, investor: true };
    var view = "raise";

    populateCategory();
    grid.innerHTML = skeletons(4);

    fetchType("raise", SAMPLE_RAISE, function (err, list, demo) {
      data.raise = list || [];
      isDemo.raise = demo;
      if (view === "raise") render();
    });
    fetchType("investor", SAMPLE_INVESTOR, function (err, list, demo) {
      data.investor = list || [];
      isDemo.investor = demo;
      if (view === "investor") render();
    });

    function populateCategory() {
      var opts = view === "raise" ? RAISE_STAGES : INVESTOR_TYPES;
      var label = view === "raise" ? "All stages" : "All types";
      categorySelect.innerHTML = '<option value="">' + label + "</option>"
        + opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("");
    }

    function matches(item) {
      var cat = categorySelect.value;
      if (view === "raise") {
        if (cat && item.stage !== cat) return false;
        var qh = [item.company, item.founder, item.industry, item.description].join(" ").toLowerCase();
        var q1 = (searchInput.value || "").trim().toLowerCase();
        return !q1 || qh.indexOf(q1) !== -1;
      }
      if (cat && item.type !== cat) return false;
      var hay = [item.name, item.firm, item.industries, item.thesis].join(" ").toLowerCase();
      var q = (searchInput.value || "").trim().toLowerCase();
      return !q || hay.indexOf(q) !== -1;
    }

    function render() {
      var list = data[view].filter(matches);
      if (meta) {
        var demoPrefix = isDemo[view] ? "Showing sample " + (view === "raise" ? "raises" : "investors") + " — connect your sheet to go live. " : "";
        meta.textContent = demoPrefix + list.length
          + (view === "raise"
            ? (list.length === 1 ? " company raising" : " companies raising")
            : (list.length === 1 ? " investor" : " investors"));
      }
      if (!list.length) {
        grid.innerHTML = "";
        if (empty) {
          empty.hidden = false;
          if (emptyText) emptyText.textContent = view === "raise"
            ? "No one matching that search is raising right now."
            : "No investors match that search yet.";
          if (emptyCta) {
            emptyCta.href = view === "raise" ? "add-raise.html" : "add-investor.html";
            emptyCta.textContent = view === "raise" ? "Be the first — post your raise" : "Be the first — list as an investor";
          }
        }
        return;
      }
      if (empty) empty.hidden = true;
      grid.innerHTML = list.map(view === "raise" ? raiseCardHTML : investorCardHTML).join("");
      Array.prototype.forEach.call(grid.querySelectorAll("[data-id]"), function (el) {
        el.addEventListener("click", function () {
          var item = data[view].filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (item) (view === "raise" ? openRaiseModal : openInvestorModal)(item);
        });
      });
    }

    function switchView(next) {
      if (view === next) return;
      view = next;
      viewRaising.classList.toggle("is-active", view === "raise");
      viewInvesting.classList.toggle("is-active", view === "investor");
      searchInput.value = "";
      populateCategory();
      grid.innerHTML = skeletons(4);
      render();
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
    if (viewRaising) viewRaising.addEventListener("click", function () { switchView("raise"); });
    if (viewInvesting) viewInvesting.addEventListener("click", function () { switchView("investor"); });
  }

  function raiseCardHTML(r) {
    return (
      '<article class="pcard" data-id="' + esc(r.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(r.company).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(r.company) + "</h3>" +
            (r.founder ? '<p class="pcard__biz">' + esc(r.founder) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (r.description ? '<p class="pcard__building">' + esc(r.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__price">' + (r.amountSeeking ? esc(r.amountSeeking) : "") + "</span>" +
          '<div class="badges">' +
            (r.stage ? '<span class="badge">' + esc(r.stage) + "</span>" : "") +
            (r.industry ? '<span class="badge badge--investor">' + esc(r.industry) + "</span>" : "") +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function investorCardHTML(inv) {
    return (
      '<article class="pcard" data-id="' + esc(inv.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(inv.name).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(inv.name) + "</h3>" +
            (inv.firm ? '<p class="pcard__biz">' + esc(inv.firm) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (inv.thesis ? '<p class="pcard__building">' + esc(inv.thesis) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__price">' + (inv.checkSize ? esc(inv.checkSize) : "") + "</span>" +
          '<div class="badges">' +
            (inv.type ? '<span class="badge">' + esc(inv.type) + "</span>" : "") +
            tags(inv.stages).map(function (s) { return '<span class="badge badge--mentor">' + esc(s) + "</span>"; }).join("") +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- modals ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openRaiseModal(r) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(r.company).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(r.company) + "</h2>" +
          (r.founder ? '<p class="modal__biz">' + esc(r.founder) + "</p>" : "") +
          '<div class="badges">' +
            (r.stage ? '<span class="badge">' + esc(r.stage) + "</span>" : "") +
            (r.industry ? '<span class="badge badge--investor">' + esc(r.industry) + "</span>" : "") +
          "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Description", r.description) +
      detailBlock("Amount seeking", r.amountSeeking) +
      detailBlock("Raised so far", r.raisedSoFar) +
      detailBlock("Use of funds", r.useOfFunds) +
      (r.website
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(r.website)) + '" target="_blank" rel="noopener noreferrer">Website</a>'
        : "") +
      (r.linkedin
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(r.linkedin)) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>'
        : "") +
      (r.email
        ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(r.email) + "?subject=" + encodeURIComponent("Re: " + r.company + "'s raise") + '">Get in touch</a>'
        : "");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function openInvestorModal(inv) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(inv.name).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(inv.name) + "</h2>" +
          (inv.firm ? '<p class="modal__biz">' + esc(inv.firm) + "</p>" : "") +
          '<div class="badges">' +
            (inv.type ? '<span class="badge">' + esc(inv.type) + "</span>" : "") +
            tags(inv.stages).map(function (s) { return '<span class="badge badge--mentor">' + esc(s) + "</span>"; }).join("") +
          "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Thesis", inv.thesis) +
      detailBlock("Typical check size", inv.checkSize) +
      detailBlock("Industries", inv.industries) +
      (inv.website
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(inv.website)) + '" target="_blank" rel="noopener noreferrer">Website</a>'
        : "") +
      (inv.linkedin
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="' + esc(normUrl(inv.linkedin)) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>'
        : "") +
      (inv.email
        ? '<a class="btn btn--lg modal__contact" href="mailto:' + esc(inv.email) + "?subject=" + encodeURIComponent("Introduction via Founders & Builders") + '">Get in touch</a>'
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
     FORMS — shared submit machinery
     ===================================================================== */
  function wireForm(formEl, type, requiredFields, redirectTo, labels) {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect(formEl);

      var missing = requiredFields.filter(function (f) { return !data[f]; });
      if (missing.length) {
        say(labels.missing, "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        say("Please enter a valid email address.", "err");
        return;
      }

      btn.disabled = true;
      btn.textContent = labels.submitting;

      if (!hasBackend) {
        setTimeout(function () {
          say(labels.demoOk, "ok");
          btn.disabled = false;
          btn.textContent = labels.submit;
        }, 600);
        return;
      }

      data.type = type;
      fetch(API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      }).then(function () {
        formEl.reset();
        say(labels.ok, "ok");
        setTimeout(function () { window.location.href = redirectTo; }, 1600);
      }).catch(function () {
        say(labels.err, "err");
        btn.disabled = false;
        btn.textContent = labels.submit;
      });
    });

    function collect(form) {
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

  var raiseForm = document.getElementById("raiseForm");
  if (raiseForm) {
    wireForm(raiseForm, "raise", ["company", "email"], "funding.html", {
      missing: "Please fill in your company name and contact email.",
      submitting: "Posting…",
      submit: "Post your raise",
      demoOk: "Demo mode — your raise looks great! Connect the Google Sheet backend to publish it for real.",
      ok: "Your raise is live! Redirecting you to the Funding Hub…",
      err: "Something went wrong posting your raise. Please try again."
    });
  }

  var investorForm = document.getElementById("investorForm");
  if (investorForm) {
    wireForm(investorForm, "investor", ["name", "email"], "funding.html", {
      missing: "Please fill in your name and contact email.",
      submitting: "Submitting…",
      submit: "List me as an investor",
      demoOk: "Demo mode — your investor profile looks great! Connect the Google Sheet backend to publish it for real.",
      ok: "You're listed! Redirecting you to the Funding Hub…",
      err: "Something went wrong sending your info. Please try again."
    });
  }
})();
