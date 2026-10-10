/* ==========================================================================
   Neat Narrative Co. — Before / after comparison slider
   --------------------------------------------------------------------------
   Markup contract:

     <div class="compare" data-compare>
       <div class="compare__layer"><img src="before.jpg" alt="…"></div>
       <div class="compare__layer compare__layer--after"><img src="after.jpg" alt="…"></div>
       <span class="compare__tag compare__tag--before">Before</span>
       <span class="compare__tag compare__tag--after">After</span>
       <input class="compare__range" type="range" min="0" max="100" value="50"
              aria-label="Drag to compare the before and after photographs">
       <div class="compare__handle" aria-hidden="true">
         <span class="compare__grip">…</span>
       </div>
     </div>

   Dragging works with mouse, touch, pen and the keyboard arrow keys, because
   the control is a native range input. With JavaScript disabled the after
   layer stays clipped at the default position, so both images are still
   present in the page for search engines and screen readers.
   ========================================================================== */

(function () {
  "use strict";

  var MIN = 0;
  var MAX = 100;

  function apply(container, value) {
    var clamped = Math.min(MAX, Math.max(MIN, Number(value)));
    container.style.setProperty("--compare-position", clamped + "%");
  }

  function initOne(container) {
    var range = container.querySelector(".compare__range");
    if (!range) {
      return;
    }

    apply(container, range.value);

    range.addEventListener("input", function () {
      apply(container, range.value);
    });

    /* Keep the handle in step when the slider is reset by the browser. */
    range.addEventListener("change", function () {
      apply(container, range.value);
    });
  }

  function init() {
    document.querySelectorAll("[data-compare]").forEach(initOne);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
