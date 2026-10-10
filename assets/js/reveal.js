/* ==========================================================================
   Neat Narrative Co. — Reveal on scroll
   Adds a restrained fade-and-rise to marked elements as they enter view.
   Does nothing when the visitor prefers reduced motion or the browser has no
   IntersectionObserver — the content is visible either way.
   ========================================================================== */

(function () {
  "use strict";

  function prefersReducedMotion() {
    return (
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function revealAll(nodes) {
    nodes.forEach(function (node) {
      node.setAttribute("data-revealed", "true");
    });
  }

  function init() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

    if (!nodes.length || prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealAll(nodes);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
