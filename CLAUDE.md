# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static personal site for **Future Studio** (Yifan Liang, Financial Engineer, Hong Kong). Pure HTML/CSS/JS — no build step, no package manager, no framework, no linter, no tests. Pages are served as-is from the repo root.

- **Repo / deployment**: `https://github.com/futurelyf/future-studio-web` (branch: `main`).
- **Contact form**: the contact page embeds a third-party iframe hosted at `form.futurestudio.dev` — the form itself is not part of this repo. Don't try to "fix" or "improve" the form by editing the iframe `src`; the receiver lives on a different host.

## Pages

All three pages share the same `<header>` (`.navbar` + brand + theme toggle) and `<footer>` (`.site-footer`), and both link the same `style.css` and `script.js`. When editing shared chrome, change it in every file.

- [index.html](index.html) — Hero landing page with floating role tags, avatar, and "Let's connect" CTA. The only page with `.tag` parallax elements. Lives at the repo root.
- [contact/index.html](contact/index.html) — Wraps the third-party contact form iframe in `.contact__frame` (glass card). Lives one level deeper so `web.com/contact` resolves without a `.html` suffix; all relative asset paths in this file are prefixed with `../`.
- [not-found.html](not-found.html) — Error page. The `Contact` link is intentionally absent from the navbar here (only `Home` is shown). Served by the server when no route matches; the URL bar keeps the original bad URL.

## Architecture

### Theme system (the only piece of non-obvious behavior)

The site ships dark by default and lets the user toggle to light. To avoid a flash of wrong theme on load, each page's `<head>` contains a small **inline blocking script** that reads `localStorage.getItem("theme")` and sets `data-theme="light"` on `<html>` _before_ the stylesheet parses. This script is duplicated verbatim in all three pages — keep them in sync.

- Dark is `:root`; light is `[data-theme="light"]`. All colors live as CSS custom properties in [style.css:4-62](style.css#L4-L62) — do not hardcode colors in component rules.
- Per-chip tints (`.chip--name`, `.chip--role`, `.chip--place`) use a `var(--chip-tint)` indirection so the glass effect works in both themes; the actual `R, G, B` triplets differ per theme.
- Toggle logic + persistence lives in [script.js:1-13](script.js#L1-L13). The button uses `?.` optional chaining, so it silently no-ops on pages that omit `#theme-toggle` (currently none, but keep this if you split the toggle out).

### Tag parallax

Only [index.html](index.html) has `.tag` elements. The mousemove handler in [script.js:16-30](script.js#L16-L30) is gated on `(hover: hover) and (pointer: fine)` so it never runs on touch devices. Each tag's resting rotation is stored in `data-rot` (degrees, signed) and is _added_ to the per-frame translate — keep the sign convention consistent when adding new tags.

### Other JS behaviors (script.js)

- **Copyright year** ([script.js:33-38](script.js#L33-L38)): writes `new Date().getFullYear()` into every `.year` element on `DOMContentLoaded`. The placeholder is `<span class="year"></span>` in the footer of each page.
- **Smooth in-page anchors** ([script.js:41-49](script.js#L41-L49)): only matches `a[href^="#"]`. External links (e.g. `/contact`) are left alone. The current site has no in-page anchors, so this is dormant.

### Styling conventions

- BEM-ish naming: block (`navbar`), element (`navbar__inner`), modifier (`chip--name`). Stick to it.
- Glass surfaces (navbar, footer box, contact frame) all use the same recipe: `background: var(--card); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius);` — add new glass surfaces by reusing this, not by inventing a new look.
- Three keyframe animations: `float` (gentle bob, used by avatar and tags), `dropIn` (navbar), `rise` (page content). All defined at [style.css:713-741](style.css#L713-L741).
- Responsive breakpoints: `640px` (mobile→tablet), `1025px` (tablet→desktop), `1400px` (wide desktop), plus a `max-height: 560px` short-viewport tweak for tag positions. Hero/contact/404 each declare their own padding/sizing at the `640px` breakpoint — check all three sections if changing a breakpoint.

## Common operations

Since there's no build tooling, "develop" = edit files and reload the browser. To preview locally without a server, opening `index.html` directly in a browser works for the home page, but the contact page (`contact/index.html`) also works this way since the asset paths are relative.

If you want a local server with the correct origin for the contact iframe to behave normally:

```sh
# any of these work; the contact iframe requires HTTPS to allow clipboard-write
python3 -m http.server 8000
# or
npx serve .
```

## URL structure & OpenResty deployment

The site is structured so that URLs never carry a `.html` suffix:

- `/` → served from `index.html` at repo root.
- `/contact` → served from `contact/index.html`.
- Anything else → `error_page 404 /not-found.html;` returns the 404 page (the browser address bar keeps the original bad URL).

The full, ready-to-deploy server block lives in [openresty.conf](openresty.conf) at the repo root — copy its `server { ... }` into your OpenResty config and replace the placeholder `root` path with your real value. SSL is handled by 1Panel upstream, so this block only listens on plain HTTP (port 80). The key pieces it implements:

1. **`rewrite ^/(.+)/$ /$1 permanent;`** — strips trailing slashes (so `/contact/` 301-redirects to `/contact`). Must come before the `location` block.
2. **`try_files $uri $uri/ $uri.html =404;`** — maps clean URLs to the `folder/index.html` layout, with a `.html` fallback for legacy links during a transition window. Drop the `$uri.html` clause once no external `.html` links remain.
3. **`error_page 404 /not-found.html;`** — internal redirect, so the browser bar keeps the original bad URL.

The OpenResty config is the source of truth for routing; this section is just a map of _why_ each line exists.

## Assets

All images live in `pic/` (one level deep from the contact page, at root for the other two pages):

- `pic/Tree.svg` — logo and favicon (referenced in every page's `<link rel="icon">` and in the navbar/footer brand).
- `pic/Headshot.jpeg` — hero avatar on the home page only.
- `pic/waving_hand_animated_medium-light.png` — self-animating APNG used on the contact page title. No CSS animation needed; the file does the work.
- `pic/knocked-out_face_animated.png` — self-animating APNG used on the 404 page.

Both APNGs are large (~1.4 MB and ~2.8 MB). They load eagerly on each page; if size ever matters, add `loading="lazy"` and/or swap to a smaller format, but do not strip the animation.
