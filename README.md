# Neat Narrative Co. — website

Static website for Neat Narrative Co., a residential and commercial cleaning
company based in Frinton-on-Sea, North East Essex.

There is no build step and no framework. Every page is a plain HTML file that
loads a shared set of stylesheets and a handful of small scripts. You can edit
the files directly, upload the folder to any host, and the site works.

- Phone: 01255 724005
- Email: hello@neatnarrative.co.uk
- Instagram: [@neatnarrativeco](https://www.instagram.com/neatnarrativeco/)
- Canonical domain: https://neatnarrative.co.uk

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

On Windows, `_serve.bat` used to do the same thing while the site was being
built. It has been removed — the one-line command above is all you need, and
`Ctrl + C` stops it.

## 2. Putting it online

Upload the whole folder to your host, keeping the directory structure as it is.
Nothing needs compiling.

If you use Netlify, Cloudflare Pages, GitHub Pages or similar, point it at this
folder with no build command and no publish directory (or publish the root).

Two things to check on the live domain:

1. `https://neatnarrative.co.uk/` loads over HTTPS.
2. The canonical links in each page `<head>` point at `neatnarrative.co.uk`.
   They are already set that way; change them only if the domain changes.

Every asset link, the web manifest and the stylesheets are relative, so the
site works whether you publish this folder as the domain root or drop it in a
subfolder. One exception: the form carries `action="/api/enquiries"`, the path
used if JavaScript is off. That is absolute. If you serve the site from a
subfolder and the API sits inside it, update that one attribute in
`contact.html` so the two agree.

## 3. Business details live in one file

`assets/js/site-config.js` holds the phone number, email address, Instagram
handle and the enquiry endpoint. It is loaded before every other script on
every page, and the header, footer, mobile bar and contact page are built from
it.

If a number or address changes, it is worth also checking the static copies in
the markup — phone links in the header, footer and mobile contact bar are
written into each page's HTML (`tel:+441255724005`) so they work with
JavaScript switched off. Use find-and-replace across `*.html` for those.

## 4. The enquiry form

`contact.html` is a real HTML form: it has an `action` and a `method`, so it
submits and reaches you even if JavaScript fails. `assets/js/enquiry-form.js`
layers on top of that:

- it validates the fields as the visitor types and again on submit;
- it reads up to four photographs or PDFs (3 MB each) and sends them with the
  enquiry as base64;
- it shows a success panel on `thank-you.html` once the enquiry is accepted.

### Where the form sends data

This website is a set of static files, so it has no server of its own. Set
`enquiry.endpoint` in `assets/js/site-config.js` to the API that should receive
the enquiries:

| Setting | What happens |
| --- | --- |
| `""` (empty) | Posts to `/api/enquiries` on the same domain. Use this if the site and its API are served from one address. |
| `"https://…"` | Posts to that absolute URL. Use this if the API runs elsewhere. The API must allow this website's origin in its CORS headers. |

The API is expected to answer `200`/`201` with JSON, optionally including a
`reference`, and `400` with an `errors` object keyed by field name (those
messages are shown under the matching fields). `429` is treated as rate
limiting.

**No API is included in this project.** `backend/` contains four empty folders
(`routes`, `services`, `storage`, `tests`) left over from planning; there is no
Python code in them, and nothing in the site depends on them.

### If there is no API, the enquiry is not lost

`enquiry.fallbackToEmail` (on by default) covers the case where the API is
missing, down, or blocked. Instead of a dead end, the visitor sees:

> Nothing has been lost — your answers are still on the form. Send them to us
> by email instead and your own email app will open with everything filled in.

and a **Send by email instead** button that opens a pre-filled message to
`hello@neatnarrative.co.uk` containing every answer they gave. The message is
sent from their own account; the website itself transmits nothing. This is the
route that works today, before any API exists.

To disable it and show a plain failure message instead, set
`fallbackToEmail: false`.

## 5. File structure

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

## 6. Editing content

Each page is self-contained: the header, footer and mobile bar are repeated in
every file, so a change to the navigation has to be made in each of the ten
pages. The sections within a page are clearly commented, for example:

```html
<!-- ============================= CTA ============================ -->
```

Two things worth knowing:

- **Service anchors.** The six services on `services.html` carry ids
  (`#regular-cleaning`, `#deep-cleaning`, `#end-of-tenancy`, `#one-off`,
  `#commercial`, `#holiday-lets`). The footer and the home page link to them, so
  renaming an id means updating those links.
- **Service pre-selection.** Each "Quote this service" button on
  `services.html` links to `contact.html?service=…`, and `nav.js` reads that and
  pre-selects the matching option in the form's service dropdown. The values
  must match the `<option value="…">` values in `contact.html`.

The copy deliberately avoids inventing specifics — there is no founding year,
no staff count, and no named customers. If you want to state any of those, add
them where they belong rather than leaving a claim implied.

## 7. Type, colour and images

- **Type** is self-hosted, so no request goes to Google Fonts: Barlow Condensed
  for headings and UI, Cormorant Garamond for the italic accents, Inter for body
  text. The files are in `assets/fonts` and declared in `assets/css/fonts.css`.
- **Colour** is defined once, as custom properties in `assets/css/tokens.css`
  (navy surfaces, gold accents, ivory light sections, text colours). Change a
  token there and it propagates.
- **Images** are WebP. Most have a `@800` variant for narrow screens; the
  `<img>` elements pair `srcset` with `sizes` so phones fetch the smaller file.
  Large photographs should keep that pattern — add the width variant and
  reference both.
- **Icons** come from one sprite: `<svg class="icon"><use href="assets/icons/sprite.svg#icon-name"></use></svg>`.
  Copy an id from `sprite.svg` rather than pasting raw SVG into a page.

## 8. Accessibility and behaviour

- Every interactive control is reachable and operable by keyboard, with a
  visible focus ring.
- The mobile menu, the gallery lightbox and the accordion all manage focus, and
  the lightbox responds to `Escape`, `ArrowLeft` and `ArrowRight`.
- Content is never hidden behind an animation: the reveal effect is only
  switched on when JavaScript runs, so the pages read normally without it.
- `prefers-reduced-motion` is respected.
- The design is responsive down to a 390 px phone, where the desktop header
  button collapses to the menu and a sticky Call / Get a quote bar appears.

## 9. Developer scripts

`tools/` holds two helpers used while the site was built. Neither is needed to
run it:

- `vendor_fonts.py` downloads the webfonts and writes `assets/css/fonts.css`,
  so the type is served from your own domain.
- `optimise_images.py` converts and resizes source photography into the WebP
  files under `assets/images`.

They expect images and fonts to be placed alongside them as they were when they
last ran; adjust the paths at the top of each file if you rearrange anything.

## 10. Things to know

- **`backend/` and `docs/`** are empty folders. Nothing here uses them.
- **Three files are left over from an earlier draft** and no page refers to
  them: `LICENSE`, `assets/images/aboutUs.jpg` and
  `assets/images/brandAmbassadors.jpg`. They are safe to delete if you do not
  want them.
- **No cookies, no analytics, no third-party requests.** The privacy notice
  reflects that: the only data the site handles is what a visitor types into the
  enquiry form, and only once they submit it.

## 11. What was checked

- Every page was opened in a browser at desktop width and at a 390 px phone
  width, and the header, footer, mobile bar and menu drawer were exercised.
- The gallery was filtered and the lightbox opened, stepped and closed.
- The enquiry form was submitted with empty fields (validation shows per-field
  messages), filled in, and submitted with no API present — the email fallback
  appeared with its pre-filled link.
- `?service=deep-cleaning` pre-selects the service and scrolls to the form.
- The FAQ accordion opens and closes; the jump-nav and footer service links
  land on the right sections; every contents link in `privacy.html` and
  `terms.html` resolves to a real heading.
- All six scripts parse cleanly, and every icon id referenced in the markup
  exists in `assets/icons/sprite.svg`.
