/* ==========================================================================
   Neat Narrative Co. — Gallery
   --------------------------------------------------------------------------
   Category filtering plus an accessible lightbox.

   Markup contract

   Filters:
     <button class="filter-chip" type="button"
             data-gallery-filter="carpet-cleaning" aria-pressed="false">…</button>
     The chip whose data-gallery-filter is "all" shows everything.

   Items:
     <figure class="gallery__item" data-gallery-item
             data-categories="carpet-cleaning deep-cleaning">
       <button class="gallery-card" type="button" data-gallery-open
               data-full="assets/images/…webp"
               data-caption="Carpet refresh — Frinton-on-Sea">
         <img class="gallery-card__image" src="…" alt="…" loading="lazy">
         …
       </button>
     </figure>

   Lightbox root (one per page):
     <div class="lightbox" data-lightbox data-open="false" aria-hidden="true" role="dialog"
          aria-modal="true" aria-label="Cleaning results gallery"> … </div>
   ========================================================================== */

(function () {
  "use strict";

  var ALL = "all";
  var lastFocused = null;
  var activeSet = [];
  var activeIndex = 0;

  function items() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-gallery-item]"));
  }

  function categoriesOf(item) {
    return (item.getAttribute("data-categories") || "").split(/\s+/).filter(Boolean);
  }

  function isVisible(item) {
    return !item.hasAttribute("hidden");
  }

  function visibleItems() {
    return items().filter(isVisible);
  }

  /* --- Filtering --------------------------------------------------------- */

  function applyFilter(value) {
    items().forEach(function (item) {
      var show = value === ALL || categoriesOf(item).indexOf(value) !== -1;
      if (show) {
        item.removeAttribute("hidden");
      } else {
        item.setAttribute("hidden", "");
      }
    });

    document.querySelectorAll("[data-gallery-filter]").forEach(function (chip) {
      chip.setAttribute(
        "aria-pressed",
        chip.getAttribute("data-gallery-filter") === value ? "true" : "false"
      );
    });
  }

  function initFilters() {
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-gallery-filter]"));
    if (!chips.length) {
      return;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        applyFilter(chip.getAttribute("data-gallery-filter") || ALL);
      });
    });
  }

  /* --- Lightbox --------------------------------------------------------- */

  function lightbox() {
    return document.querySelector("[data-lightbox]");
  }

  function render() {
    var panel = lightbox();
    var entry = activeSet[activeIndex];
    if (!panel || !entry) {
      return;
    }

    var image = panel.querySelector("[data-lightbox-image]");
    var caption = panel.querySelector("[data-lightbox-caption]");
    var counter = panel.querySelector("[data-lightbox-counter]");

    image.src = entry.full;
    image.alt = entry.caption;
    caption.textContent = entry.caption;
    counter.textContent = activeIndex + 1 + " / " + activeSet.length;

    var multiple = activeSet.length > 1;
    panel.querySelectorAll("[data-lightbox-prev], [data-lightbox-next]").forEach(function (button) {
      button.hidden = !multiple;
    });
  }

  function open(trigger) {
    var panel = lightbox();
    if (!panel) {
      return;
    }

    lastFocused = trigger;
    activeSet = visibleItems().map(function (item) {
      var button = item.querySelector("[data-gallery-open]");
      return {
        full: button.getAttribute("data-full"),
        caption: button.getAttribute("data-caption") || "",
      };
    });

    activeIndex = Math.max(
      0,
      visibleItems().indexOf(trigger.closest("[data-gallery-item]"))
    );

    render();
    panel.setAttribute("data-open", "true");
    panel.removeAttribute("aria-hidden");
    document.body.classList.add("is-locked");

    var close = panel.querySelector("[data-lightbox-close]");
    if (close) {
      close.focus();
    }
  }

  function close() {
    var panel = lightbox();
    if (!panel) {
      return;
    }

    panel.setAttribute("data-open", "false");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function isOpen() {
    var panel = lightbox();
    return !!panel && panel.getAttribute("data-open") === "true";
  }

  function step(delta) {
    if (!activeSet.length) {
      return;
    }
    activeIndex = (activeIndex + delta + activeSet.length) % activeSet.length;
    render();
  }

  function initLightbox() {
    var panel = lightbox();
    if (!panel) {
      return;
    }

    document.querySelectorAll("[data-gallery-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        open(button);
      });
    });

    panel.querySelector("[data-lightbox-close]").addEventListener("click", close);
    panel.querySelector("[data-lightbox-prev]").addEventListener("click", function () {
      step(-1);
    });
    panel.querySelector("[data-lightbox-next]").addEventListener("click", function () {
      step(1);
    });

    /* Clicking the dark backdrop closes, clicking the photograph does not. */
    panel.addEventListener("click", function (event) {
      if (event.target === panel || event.target.hasAttribute("data-lightbox-stage")) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!isOpen()) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "Tab") {
        keepFocusInside(panel, event);
      }
    });
  }

  function keepFocusInside(panel, event) {
    var focusable = Array.prototype.slice
      .call(panel.querySelectorAll("button:not([hidden]), a[href]"))
      .filter(function (node) {
        return node.offsetParent !== null;
      });

    if (!focusable.length) {
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function init() {
    initFilters();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
