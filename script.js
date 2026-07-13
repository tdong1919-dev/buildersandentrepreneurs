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

  // Feature slider
  var featureTrack = document.getElementById("featureTrack");
  var featurePrev = document.getElementById("featurePrev");
  var featureNext = document.getElementById("featureNext");
  if (featureTrack && featurePrev && featureNext) {
    var scrollFeatures = function (dir) {
      var slide = featureTrack.querySelector(".feature-slide");
      var amount = slide ? slide.getBoundingClientRect().width + 20 : 300;
      featureTrack.scrollBy({ left: dir * amount, behavior: "smooth" });
    };
    featurePrev.addEventListener("click", function () { scrollFeatures(-1); });
    featureNext.addEventListener("click", function () { scrollFeatures(1); });
    var updateFeatureNav = function () {
      featurePrev.disabled = featureTrack.scrollLeft <= 4;
      featureNext.disabled = featureTrack.scrollLeft >= featureTrack.scrollWidth - featureTrack.clientWidth - 4;
    };
    featureTrack.addEventListener("scroll", updateFeatureNav, { passive: true });
    window.addEventListener("resize", updateFeatureNav, { passive: true });
    updateFeatureNav();
  }

  // Scroll reveal
  var revealTargets = document.querySelectorAll(
    ".card, .section__head, .feature-split__text, .feature-split__card, .city, .pill-cloud, .signup, .mission .lead, .preview-card, .mentor-panel, .activity-list, .accelerator__panel, .membership__panel"
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

  // Staggered reveal for hub cards (profiles, business, jobs, mentors, etc.)
  // Cards are injected by each hub's own script, so watch the grid instead of
  // touching every hub file individually.
  var profileGrid = document.getElementById("profileGrid");
  if (profileGrid) {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var staggerNew = function () {
      var cards = profileGrid.querySelectorAll(".pcard:not(.stagger-init)");
      cards.forEach(function (card, i) {
        card.classList.add("stagger-init");
        card.style.transitionDelay = reduceMotion ? "0ms" : (i % 12) * 40 + "ms";
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cards.forEach(function (card) { card.classList.add("in"); });
        });
      });
    };
    staggerNew();
    new MutationObserver(staggerNew).observe(profileGrid, { childList: true });
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
        msg.style.color = "#B0473F";
        msg.textContent = "Please enter a valid email address.";
        return;
      }
      try {
        var list = JSON.parse(localStorage.getItem("fb_waitlist") || "[]");
        if (list.indexOf(value) === -1) list.push(value);
        localStorage.setItem("fb_waitlist", JSON.stringify(list));
      } catch (err) { /* ignore storage errors */ }
      msg.style.color = "";
      msg.textContent = "You're on the list! We'll be in touch — thanks for building with us.";
      form.reset();
    });
  }
})();
