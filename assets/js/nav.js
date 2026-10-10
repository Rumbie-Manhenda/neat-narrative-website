/* ==========================================================================
   Neat Narrative Co. — Navigation
   Header scroll state, the mobile drawer, the sticky mobile contact bar
   and the footer copyright year.
   ========================================================================== */

(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 1080px)";
  var BAR_REVEAL_AFTER = 320;
  var lastFocused = null;

  function header() {
    return document.querySelector("[data-header]");
  }

  function drawer() {
    return document.querySelector("[data-nav-drawer]");
  }

  function toggles() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-nav-toggle]"));
  }

  /* --- Header background on scroll ------------------------------------- */

  function initHeaderScroll() {
    var el = header();
    if (!el) {
      return;
    }

    var ticking = false;

    function apply() {
      el.setAttribute("data-scrolled", window.scrollY > 12 ? "true" : "false");
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) {
          return;
        }
        ticking = true;
        window.requestAnimationFrame(apply);
      },
      { passive: true }
    );

    apply();
  }

  /* --- Mobile drawer ---------------------------------------------------- */

  function focusable(container) {
    return Array.prototype.slice
      .call(
        container.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (node) {
        return node.offsetParent !== null;
      });
  }

  function openDrawer(trigger) {
    var panel = drawer();
    if (!panel) {
      return;
    }
    lastFocused = trigger || document.activeElement;
    panel.setAttribute("data-open", "true");
    panel.removeAttribute("aria-hidden");
    document.body.classList.add("is-locked");
    toggles().forEach(function (button) {
      button.setAttribute("aria-expanded", "true");
    });

    var first = panel.querySelector("[data-nav-close]");
    if (first) {
      first.focus();
    }
  }

  function closeDrawer() {
    var panel = drawer();
    if (!panel) {
      return;
    }
    panel.setAttribute("data-open", "false");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    toggles().forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function isDrawerOpen() {
    var panel = drawer();
    return !!panel && panel.getAttribute("data-open") === "true";
  }

  function initDrawer() {
    var panel = drawer();
    if (!panel) {
      return;
    }

    toggles().forEach(function (button) {
      button.addEventListener("click", function () {
        if (isDrawerOpen()) {
          closeDrawer();
        } else {
          openDrawer(button);
        }
      });
    });

    panel.querySelectorAll("[data-nav-close]").forEach(function (button) {
      button.addEventListener("click", closeDrawer);
    });

    panel.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function () {
        closeDrawer();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!isDrawerOpen()) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      var items = focusable(panel);
      if (!items.length) {
        return;
      }

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    var desktop = window.matchMedia(DESKTOP_QUERY);
    var onChange = function (event) {
      if (event.matches && isDrawerOpen()) {
        closeDrawer();
      }
    };

    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", onChange);
    } else if (typeof desktop.addListener === "function") {
      desktop.addListener(onChange);
    }
  }

  /* --- Sticky mobile contact bar --------------------------------------- */

  function initMobileBar() {
    var bar = document.querySelector("[data-mobile-bar]");
    if (!bar) {
      return;
    }

    var ticking = false;

    function apply() {
      var short = document.documentElement.scrollHeight <= window.innerHeight + BAR_REVEAL_AFTER;
      var passed = window.scrollY > BAR_REVEAL_AFTER;
      bar.setAttribute("data-visible", short || passed ? "true" : "false");
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) {
          return;
        }
        ticking = true;
        window.requestAnimationFrame(apply);
      },
      { passive: true }
    );

    window.addEventListener("resize", apply, { passive: true });
    apply();
  }

  /* --- Footer year ------------------------------------------------------ */

  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach(function (node) {
      node.textContent = year;
    });
  }

  /* --- Service pre-selection from the URL ------------------------------- */

  /*
    Lets a link like  contact.html?service=deep-cleaning  pre-select the
    service dropdown so a visitor arriving from a service card lands on a
    form that is already filled in for them.
  */
  function initServicePreselect() {
    var select = document.getElementById("service");
    if (!select) {
      return;
    }

    var match = /[?&]service=([^&#]+)/.exec(window.location.search);
    if (!match) {
      return;
    }

    var wanted = decodeURIComponent(match[1]);
    var option = Array.prototype.slice.call(select.options).find(function (item) {
      return item.value === wanted;
    });

    if (option) {
      select.value = wanted;
    }
  }

  function init() {
    initHeaderScroll();
    initDrawer();
    initMobileBar();
    initYear();
    initServicePreselect();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
