/* ===== Founders & Builders — Community Calendar hub ===== */
(function () {
  "use strict";

  var API = (window.FB_CONFIG && window.FB_CONFIG.PROFILES_API || "").trim();
  var hasBackend = /^https?:\/\//.test(API);
  var TYPE = "event";

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
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function isPast(dateStr) {
    return !!dateStr && dateStr < todayISO();
  }
  function formatDate(dateStr) {
    if (!dateStr) return "";
    var parts = String(dateStr).split("-");
    if (parts.length !== 3) return dateStr;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  /* ---------- sample data (used when no backend is configured) ---------- */
  var today = new Date();
  function inDays(n) {
    var d = new Date(today.getTime() + n * 86400000);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var SAMPLE = [
    {
      id: "edemo1", title: "Founder Demo Night", host: "Founders & Builders", category: "Demo Day",
      city: "Boise, ID", date: inDays(9), time: "6:00 PM MT", location: "Trailhead Boise",
      description: "Five founders, five minutes each, real feedback from the room.",
      rsvpLink: "example.com/rsvp", email: "events@example.com"
    },
    {
      id: "edemo2", title: "AMA: Raising a Pre-Seed Round", host: "Marcus Reed", category: "AMA",
      city: "Virtual", date: inDays(3), time: "12:00 PM ET", location: "Zoom link on RSVP",
      description: "Bring your questions about fundraising, term sheets, and investor outreach.",
      rsvpLink: "example.com/rsvp", email: "marcus@example.com"
    },
    {
      id: "edemo3", title: "Builders Hack Night", host: "Atlanta Founders", category: "Hack Night",
      city: "Atlanta, GA", date: inDays(16), time: "6:30 PM ET", location: "Atlanta Tech Village",
      description: "Bring a laptop and a problem. Ship something small by the end of the night.",
      rsvpLink: "", email: "hello@example.com"
    },
    {
      id: "edemo4", title: "DC Founders Meetup", host: "Founders & Builders DC", category: "Meetup",
      city: "Washington, DC", date: inDays(23), time: "6:00 PM ET", location: "Arlington, VA",
      description: "Monthly meetup for the DC-area chapter — come meet other local founders and builders.",
      rsvpLink: "example.com/rsvp", email: "dc@example.com"
    },
    {
      id: "edemo5", title: "Madison Founders Coffee", host: "Founders & Builders AL", category: "Meetup",
      city: "Madison, AL", date: inDays(12), time: "8:30 AM CT", location: "Rocket City Coffee",
      description: "Casual monthly coffee meetup for the Madison-area founder community.",
      rsvpLink: "example.com/rsvp", email: "al@example.com"
    }
  ];

  /* ---------- JSONP fetch (bypasses CORS for reads) ---------- */
  function fetchEvents(cb) {
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
     CALENDAR PAGE
     ===================================================================== */
  var grid = document.getElementById("profileGrid");
  if (grid) initDirectory();

  function initDirectory() {
    var meta = document.getElementById("resultsMeta");
    var empty = document.getElementById("emptyState");
    var searchInput = document.getElementById("searchInput");
    var categorySelect = document.getElementById("categorySelect");
    var citySelect = document.getElementById("citySelect");
    var viewList = document.getElementById("viewList");
    var viewCalendar = document.getElementById("viewCalendar");
    var calendarView = document.getElementById("calendarView");
    var calendarGrid = document.getElementById("calendarGrid");
    var calMonthLabel = document.getElementById("calMonthLabel");
    var calPrev = document.getElementById("calPrev");
    var calNext = document.getElementById("calNext");
    var all = [];
    var view = "list";
    var now = new Date();
    var calMonth = now.getMonth();
    var calYear = now.getFullYear();

    grid.innerHTML = skeletons(6);

    fetchEvents(function (err, events, isDemo) {
      all = (events || []).slice().sort(function (a, b) {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      });
      if (meta) {
        meta.textContent = (isDemo ? "Showing sample events — connect your sheet to go live. " : "")
          + all.length + (all.length === 1 ? " event" : " events");
      }
      render();
    });

    function matches(e) {
      var cat = categorySelect && categorySelect.value;
      if (cat && e.category !== cat) return false;
      var city = citySelect && citySelect.value;
      if (city && e.city !== city) return false;
      var q = (searchInput && searchInput.value || "").trim().toLowerCase();
      if (!q) return true;
      var hay = [e.title, e.host, e.location, e.category, e.description].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    }

    function render() {
      var list = all.filter(matches);
      if (view === "calendar") {
        if (empty) empty.hidden = true;
        grid.innerHTML = "";
        if (calendarView) calendarView.hidden = false;
        renderCalendar(list);
        return;
      }
      if (calendarView) calendarView.hidden = true;
      if (!list.length) {
        grid.innerHTML = "";
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;
      grid.innerHTML = list.map(cardHTML).join("");
      Array.prototype.forEach.call(grid.querySelectorAll("[data-id]"), function (el) {
        el.addEventListener("click", function () {
          var e = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (e) openModal(e);
        });
      });
    }

    function renderCalendar(list) {
      if (!calendarGrid) return;
      var dateMap = {};
      list.forEach(function (e) {
        if (!e.date) return;
        (dateMap[e.date] = dateMap[e.date] || []).push(e);
      });

      var first = new Date(calYear, calMonth, 1);
      var startDow = first.getDay();
      var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      var daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
      var todayStr = todayISO();

      if (calMonthLabel) {
        calMonthLabel.textContent = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }

      var weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var html = weekdayNames.map(function (d) { return '<div class="calendar-grid__weekday">' + d + "</div>"; }).join("");

      for (var i = 0; i < startDow; i++) {
        html += '<div class="calendar-day calendar-day--other-month"><span class="calendar-day__num">' + (daysInPrevMonth - startDow + i + 1) + "</span></div>";
      }
      for (var day = 1; day <= daysInMonth; day++) {
        var dateStr = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
        var dayEvents = dateMap[dateStr] || [];
        html += '<div class="calendar-day' + (dateStr === todayStr ? " calendar-day--today" : "") + '"><span class="calendar-day__num">' + day + "</span>"
          + dayEvents.slice(0, 2).map(function (e) {
            return '<button type="button" class="calendar-day__event" data-id="' + esc(e.id) + '">' + esc(e.title) + "</button>";
          }).join("")
          + (dayEvents.length > 2 ? '<span class="calendar-day__more">+' + (dayEvents.length - 2) + " more</span>" : "")
          + "</div>";
      }
      var trailing = (7 - ((startDow + daysInMonth) % 7)) % 7;
      for (var t = 1; t <= trailing; t++) {
        html += '<div class="calendar-day calendar-day--other-month"><span class="calendar-day__num">' + t + "</span></div>";
      }

      calendarGrid.innerHTML = html;
      Array.prototype.forEach.call(calendarGrid.querySelectorAll("[data-id]"), function (el) {
        el.addEventListener("click", function () {
          var e = all.filter(function (x) { return String(x.id) === el.getAttribute("data-id"); })[0];
          if (e) openModal(e);
        });
      });
    }

    function switchView(v) {
      if (view === v) return;
      view = v;
      if (viewList) viewList.classList.toggle("is-active", view === "list");
      if (viewCalendar) viewCalendar.classList.toggle("is-active", view === "calendar");
      render();
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (categorySelect) categorySelect.addEventListener("change", render);
    if (citySelect) citySelect.addEventListener("change", render);
    if (viewList) viewList.addEventListener("click", function () { switchView("list"); });
    if (viewCalendar) viewCalendar.addEventListener("click", function () { switchView("calendar"); });
    if (calPrev) calPrev.addEventListener("click", function () {
      calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
      render();
    });
    if (calNext) calNext.addEventListener("click", function () {
      calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
      render();
    });
  }

  function badges(e) {
    var out = "";
    if (e.category) out += '<span class="badge">' + esc(e.category) + "</span>";
    if (e.city) out += '<span class="badge badge--mentor">' + esc(e.city) + "</span>";
    if (isPast(e.date)) out += '<span class="badge badge--podcast">Past</span>';
    return out;
  }

  function cardHTML(e) {
    return (
      '<article class="pcard" data-id="' + esc(e.id) + '" tabindex="0" role="button">' +
        '<div class="pcard__top">' +
          '<div class="avatar">' + esc(initials(e.host || e.title).toUpperCase()) + "</div>" +
          '<div>' +
            '<h3 class="pcard__name">' + esc(e.title) + "</h3>" +
            (e.host ? '<p class="pcard__biz">' + esc(e.host) + "</p>" : "") +
          "</div>" +
        "</div>" +
        (e.description ? '<p class="pcard__building">' + esc(e.description) + "</p>" : "") +
        '<div class="pcard__foot">' +
          '<span class="pcard__loc">' +
            (e.date ? esc(formatDate(e.date)) : "") +
            (e.time ? (e.date ? " · " : "") + esc(e.time) : "") +
          "</span>" +
          '<div class="badges">' + badges(e) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function skeletons(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="pcard pcard--skeleton"><div class="sk sk--top"></div><div class="sk sk--line"></div><div class="sk sk--line short"></div></div>';
    return s;
  }

  /* ---------- event modal ---------- */
  function detailBlock(label, val) {
    if (!val) return "";
    return '<div class="modal__block"><h4>' + label + "</h4><p>" + esc(val) + "</p></div>";
  }

  function openModal(e) {
    var modal = document.getElementById("profileModal");
    var body = document.getElementById("modalBody");
    if (!modal || !body) return;
    body.innerHTML =
      '<div class="modal__head">' +
        '<div class="avatar avatar--lg">' + esc(initials(e.host || e.title).toUpperCase()) + "</div>" +
        "<div>" +
          '<h2 id="modalName" class="modal__name">' + esc(e.title) + "</h2>" +
          (e.host ? '<p class="modal__biz">' + esc(e.host) + "</p>" : "") +
          '<p class="modal__meta">' +
            (e.date ? esc(formatDate(e.date)) + "&nbsp;&nbsp;" : "") +
            (e.time ? esc(e.time) : "") +
          "</p>" +
          '<div class="badges">' + badges(e) + "</div>" +
        "</div>" +
      "</div>" +
      detailBlock("Description", e.description) +
      detailBlock("Location", e.location) +
      (e.rsvpLink
        ? '<a class="btn btn--lg modal__contact" href="' + esc(normUrl(e.rsvpLink)) + '" target="_blank" rel="noopener noreferrer">RSVP</a>'
        : "") +
      (e.email
        ? '<a class="btn btn--lg btn--ghost modal__contact" href="mailto:' + esc(e.email) + "?subject=" + encodeURIComponent("Re: " + e.title) + '">Contact the host</a>'
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
     ADD-EVENT FORM
     ===================================================================== */
  var form = document.getElementById("eventForm");
  if (form) initForm();

  function initForm() {
    var status = document.getElementById("formStatus");
    var btn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect();

      if (!data.title || !data.email) {
        say("Please fill in the event title and contact email.", "err");
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
          say("Demo mode — your event looks great! Connect the Google Sheet backend to publish it for real.", "ok");
          btn.disabled = false;
          btn.textContent = "Post the event";
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
        say("Something went wrong posting your event. Please try again.", "err");
        btn.disabled = false;
        btn.textContent = "Post the event";
      });
    });

    function onSuccess() {
      form.reset();
      say("Your event is live! Redirecting you to the calendar…", "ok");
      setTimeout(function () { window.location.href = "calendar.html"; }, 1600);
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
