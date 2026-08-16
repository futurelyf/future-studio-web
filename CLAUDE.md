# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static personal portfolio website for **Future Studio** (personal site of Yifan Liang). Vanilla HTML/CSS/JS — no build tooling, no framework, no package manager, no dependencies. Served by OpenResty/nginx on `futurestudio.dev`.

## Development

There is no build/lint/test step. Open `index.html` in a browser, or run a simple static server from the repo root to test routes behaved as OpenResty does:

```bash
# in future-studio-web/
python3 -m http.server 8080
```

Because there's no bundler, edits to `style.css`, `script.js`, or any `.html` file take effect on reload. Clear the browser cache after editing images in `pic/` (see "Mac Cache" commit).

## Architecture

### Directory tree

```text
future-studio-web/
├── index.html            # Home page (hero)
├── not-found.html        # 404 page
├── script.js             # Shared JS (all pages)
├── style.css             # Shared stylesheet (all pages)
├── openresty.conf        # nginx server block (paste into OpenResty)
├── pic/
│   ├── Tree.svg                     # Logo + favicon
│   ├── Headshot.jpeg                # Avatar on home
│   ├── knocked-out_face_animated.png  # 404 emoji
│   └── waving_hand_animated_medium-light.png  # Contact wave
└── contact/
    └── index.html        # Contact page (iframe to external form)
```

Three shared assets are referenced by every page via **relative paths** (this is non-obvious and matters when adding pages):

- `style.css` — single stylesheet for the whole site, imported from the page's own directory. Pages in subfolders (e.g. `contact/index.html`) reference it as `../style.css`.
- `script.js` — single script for the whole site, referenced the same way (`../script.js` from subfolders).
- `pic/Tree.svg` — favicon, referenced as `pic/Tree.svg` at root and `../pic/` from subfolders.

### Pages

| Route | File | Notes |
|-------|------|-------|
| `/` | `index.html` | Hero with floating role tags + parallax |
| `/contact` | `contact/index.html` | Embeds external contact form iframe |
| 404 | `not-found.html` | Served at `/not-found`, not `404.html` |

### Theme system

Dark by default. Light theme is applied by setting `data-theme="light"` on `<html>`. The theme is persisted in `localStorage` under `theme` ("dark" or "light"). Every page has a small inline `<script>` in `<head>` that restores the theme **before** the body renders (avoids a flash of the wrong theme). All theme colors are CSS custom properties on `:root` vs `[data-theme="light"]` — never hardcode theme colors outside these blocks.

`script.js` handles: theme toggle button, mouse-parallax drift on the `.tag` elements (desktop hover devices only), auto-updating copyright year, and smooth-scroll for `#` anchor links.

### Server (OpenResty)

`openresty.conf` is a `server {}` block meant to be pasted into `/usr/local/openresty/nginx/conf/conf.d/` on the host. Key non-obvious behaviors:

- Listens on plain HTTP :80; TLS is terminated upstream by **1Panel**, which reverse-proxies to this port.
- `root` points at `/opt/1panel/1panel/www/sites/futurestudio.dev/index` (the repo's deploy location).
- `try_files $uri $uri.html $uri/index.html @notfound` resolves extensionless routes to `.html` files — this is why `/contact` maps to `contact/index.html`.
- Trailing slashes are 301-redirected off (to prevent `/contact/` vs `/contact` doubling). The redirect guard at the top skips root `/`.
- 404s are handled by a named `@notfound` location that 302-redirects to `/not-found`, which `not-found.html` handles directly (no redirect loop).

## Contact form

The `/contact` page embeds an external iframe (`https://form.futurestudio.dev/...`). The form itself lives elsewhere (a Formspree-style host); this repo only contains the iframe shell.

## Deployment

Push to `origin` (GitHub, `futurelyf/future-studio-web`). Deployment to the server is not part of this repo. The `root` path in `openresty.conf` is the on-server deploy location.
