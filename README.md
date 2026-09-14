# Cre8X-HUB — Websites That Convert

A marketing site for **Cre8X-HUB**, a web studio building conversion-focused websites.
Animated single-page experience with a starfield background, custom cursor glow,
scroll-driven timelines, and a dark purple visual identity.

## Structure

```
index.html              Pre-rendered page markup + app scripts
css/inline_styles.css   Compiled styles (Tailwind + custom)
js/why-timeline.js      Standalone scroll enhancements
static/js/bundle.js     Compiled React app bundle
fonts.googleapis.com/   Google Fonts stylesheet (Inter)
```

## Running locally

The site must be served over HTTP (not opened as a `file://` path), because the
app bundle loads via relative paths.

```bash
# from this directory
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Scroll enhancements

The compiled bundle ships some one-directional scroll animations. `js/why-timeline.js`
adds a small, dependency-free layer on top:

- **Why timeline** — the vertical connector fills slowly as you scroll and each icon
  node glows when the fill reaches it (un-glows when you scroll back up).
- **Hero** — pins the headline to full opacity so it no longer dims on scroll.
- **Process** — the horizontal connector draws once toward the four circles and
  stays lit when scrolling back up.

All enhancements re-apply automatically if React re-renders the section.

## Notes

This is an extracted client-side build. The React source is not included — only the
compiled bundle. Third-party platform/tracking assets from the original host have
been removed.