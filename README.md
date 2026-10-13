# Neat Narrative Co. - website

Static website for Neat Narrative Co., a residential and commercial cleaning
company based in Frinton-on-Sea, North East Essex.

There is no build step and no framework. Every page is a plain HTML file that
loads a shared set of stylesheets and a handful of small scripts. 

- Phone: 01255 724005
- Email: hello@neatnarrative.co.uk
- Instagram: [@neatnarrativeco](https://www.instagram.com/neatnarrativeco/)

---

## 1. Preview it locally

Serve the folder over HTTP rather than opening the files from disk. Opening
`index.html` directly with `file://` blocks the icon sprite and the web app
manifest, and the enquiry form has nothing to post to.

From this folder:

```
python -m http.server 8090 --bind 127.0.0.1
```

Then visit <http://127.0.0.1:8090/>.


** I have not yet implemented API  in this project.** `backend/` contains four empty folders
(`routes`, `services`, `storage`, `tests`) left over from planning; there is no
Python code in them, and nothing in the site depends on them.

##mechanisim for the  enquiry to  not be lost

`enquiry.fallbackToEmail` (on by default) covers the case where the API is
missing, down, or blocked. Instead of a dead end, the visitor sees:

> Nothing has been lost - your answers are still on the form. Send them to us
> by email instead and your own email app will open with everything filled in.

and a **Send by email instead** button that opens a pre-filled message to
`hello@neatnarrative.co.uk` containing every answer they gave. The message is
sent from their own account; the website itself transmits nothing. This is the
route that works today, before i encoporate API .

To disable it and show a plain failure message instead, set
`fallbackToEmail: false`.

## File structure

```
index.html            Home
services.html         The six services, pricing approach, FAQ
gallery.html          Filterable photo gallery with a lightbox
about.html            The story, values, local section
areas.html            Coverage: place list, postcode prompt, contact rows
contact.html          Quote enquiry form
thank-you.html        Shown after a successful enquiry
privacy.html          Privacy notice with a linked contents list
terms.html            Terms of service with a linked contents list
404.html              Not-found page

favicon.ico           Browser tab icon
favicon.svg           Modern icon (also used at larger sizes)
robots.txt            Crawling rules; points at the sitemap
sitemap.xml           One entry per indexable page
site.webmanifest      Name, colours and icons when added to a phone home screen

assets/css/
  fonts.css           @font-face rules for the self-hosted fonts
  tokens.css          Colours, type scale, spacing, radii, z-index (edit here first)
  base.css            Resets, base typography, focus styles, reduced motion
  layout.css          Containers, sections, header, drawer, footer, mobile bar
  components.css      Buttons, cards, forms, accordion, lightbox, status messages
  pages.css           Page-specific layout (heroes, splits, gallery grid, contact)

assets/js/
  site-config.js      Business details and the enquiry endpoint (see section 3)
  nav.js              Header state, mobile drawer, mobile contact bar, footer year,
                      and ?service= pre-selection on the contact form
  reveal.js           Fade-and-rise reveals as sections scroll into view
  gallery.js          Gallery filtering and the lightbox
  enquiry-form.js     Enquiry validation, attachments, submission, email fallback

assets/fonts/         Self-hosted woff2 (Barlow Condensed, Cormorant Garamond, Inter)
assets/icons/
  sprite.svg          One <symbol> per icon, referenced as sprite.svg#icon-name
  brand-mark.svg      The N mark
assets/images/
  brand/              Photography of the team and properties
  services/           One photograph per service
  _originals/         The untouched source images
  icon-*.png          App icons, plus the social sharing image og-neat-narrative.jpg

tools/                Development scripts, not part of the site (see section 9)
```

## Editing content

Each page is self-contained: the header, footer and mobile bar are repeated in
every file, so a change to the navigation has to be made in each of the ten
pages. The sections within a page are clearly commented, for example:

```html
<!-- ============================= CTA ============================ -->
```



## Accessibility and behaviour

- Every interactive control is reachable and operable by keyboard, with a
  visible focus ring.
- The mobile menu, the gallery lightbox and the accordion all manage focus, and
  the lightbox responds to `Escape`, `ArrowLeft` and `ArrowRight`.
- Content is never hidden behind an animation: the reveal effect is only
  switched on when JavaScript runs, so the pages read normally without it.
- `prefers-reduced-motion` is respected.
- The design is responsive down to a 390 px phone, where the desktop header
  button collapses to the menu and a sticky Call / Get a quote bar appears.



