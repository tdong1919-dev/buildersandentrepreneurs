/* ===== Founders & Builders — interactions ===== */
(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Nav shadow on scroll
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal
  var revealTargets = document.querySelectorAll(
    ".card, .section__head, .feature-split__text, .feature-split__card, .book__text, .book__art, .city, .pill-cloud, .signup, .mission .lead, .preview-card, .mentor-panel, .activity-list"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content permanently invisible if the observer
    // misses an element (e.g. an instant scroll-to-anchor on load).
    setTimeout(function () {
      revealTargets.forEach(function (el) { el.classList.add("in"); });
    }, 2000);
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  // Philosophical topic generator
  var questions = [
    "What would society look like if failure carried no stigma?",
    "Is authenticity possible if everyone is building a personal brand?",
    "Would you rather build something meaningful that nobody sees, or something popular that changes very little?",
    "If a company solves a real problem but no one profits, did it succeed?",
    "Does ambition require an audience, or can it live entirely in private?",
    "Is it braver to start something new or to walk away from something that isn't working?",
    "Would you trade certainty of a small win for the possibility of a large one?",
    "Can you truly collaborate with someone whose definition of success differs from yours?",
    "Is a mentor more valuable for their answers or for their better questions?",
    "If your work were erased tomorrow, what part of it would you rebuild first?"
  ];
  var quoteEl = document.querySelector("#quote blockquote");
  var nextBtn = document.getElementById("nextQuote");
  var lastIdx = 0;
  if (quoteEl && nextBtn) {
    nextBtn.addEventListener("click", function () {
      var idx;
      do { idx = Math.floor(Math.random() * questions.length); }
      while (idx === lastIdx && questions.length > 1);
      lastIdx = idx;
      quoteEl.style.opacity = "0";
      setTimeout(function () {
        quoteEl.textContent = "“" + questions[idx] + "”";
        quoteEl.style.opacity = "1";
      }, 220);
    });
  }

  // Waitlist form (front-end only for now — stores locally, no backend)
  var form = document.getElementById("signupForm");
  var msg = document.getElementById("signupMsg");
  if (form && msg) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email");
      var value = (email && email.value || "").trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!valid) {
        msg.style.color = "#ff8fa3";
        msg.textContent = "Please enter a valid email address.";
        return;
      }
      try {
        var list = JSON.parse(localStorage.getItem("fb_waitlist") || "[]");
        if (list.indexOf(value) === -1) list.push(value);
        localStorage.setItem("fb_waitlist", JSON.stringify(list));
      } catch (err) { /* ignore storage errors */ }
      msg.style.color = "";
      msg.textContent = "🎉 You're on the list! We'll be in touch — thanks for building with us.";
      form.reset();
    });
  }
})();
