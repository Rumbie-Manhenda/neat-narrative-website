/* ==========================================================================
   Neat Narrative Co. — Site configuration
   --------------------------------------------------------------------------
   THIS IS THE FILE TO EDIT when business details or integrations change.
   It is loaded before every other script on every page.
   ========================================================================== */

window.NEAT_NARRATIVE = {
  business: {
    name: "Neat Narrative Co.",
    legalName: "Neat Narrative Co Ltd",
    slogan: "Cleaning with a fresh perspective.",
    phoneDisplay: "01255 724005",
    phoneLink: "tel:+441255724005",
    email: "hello@neatnarrative.co.uk",
    emailLink: "mailto:hello@neatnarrative.co.uk",
    website: "https://neatnarrative.co.uk",
    instagramHandle: "@neatnarrativeco",
    instagramUrl: "https://www.instagram.com/neatnarrativeco/",
    facebookUrl: "",
    serviceArea: "Frinton-on-Sea and surrounding areas in North East Essex",
  },

  enquiry: {
    /*
      Where the quote form sends its data.

      This website is a set of static files: it has no server of its own, so
      the form needs an endpoint you control.

      "" (empty)  -> POST to /api/enquiries on this same domain. Use this when
                     you host the website and its API together on one address,
                     so that the relative path resolves.

      "https://…" -> POST to that absolute URL instead. Use this when the API
                     runs on a different host (for example Render or Railway)
                     and the website is on Netlify, Cloudflare Pages or similar.
                     A cross-origin API must send CORS headers allowing this
                     website's origin.

      If no endpoint answers, the form does not lose the enquiry: the visitor
      is offered the same answers as a pre-filled email instead, and can send
      it from their own account. See fallbackToEmail below.
    */
    endpoint: "",

    /* How long to wait for the API before showing a failure message. */
    timeoutMs: 20000,

    /* Graceful fallback: if the API cannot be reached, the visitor is offered
       these routes instead of being left at a dead end. */
    fallbackToEmail: true,
  },
};
