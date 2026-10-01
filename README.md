# musawir-abrar.github.io

Personal site for Musawir Abrar, filmmaker, writer, and teacher.

Plain HTML, CSS, and JavaScript. No build step. Served by GitHub Pages from the `main` branch.

## Editing

- One page per section. `index.html` is both the front page and About: name,
  summary, and portrait, then the longer bio. The rest live in `films.html`,
  `teaching.html`, `work.html`, `record.html`, and `contact.html`. Edit the
  page you want to change.
- `about.html` is only a redirect to `/`, kept so links to the old address
  still work. There is nothing to edit in it.
- The header and footer are copied into every page. There is no build step, so a
  change to the nav or the footer has to be made in all six of them. The nav marks
  the current page with `aria-current="page"`.
- `css/style.css` holds the design. Colors and type are CSS variables at the top.
- `js/main.js` holds the small interactions. Each one is a short, named function.
- `assets/img/` holds images. Keep new stills at 4:3 or 16:9 and under 400 KB.

## Local preview

    python3 -m http.server 8000

then open http://localhost:8000.

## Analytics

PostHog, via the snippet near the top of every HTML file. The `phc_` key is
the public project key and is meant to be visible.

Everything is switched on: pageviews, autocapture, rage and dead clicks, heatmaps,
exception capture, web vitals, and session replay with console logs. Session replay
also has to be enabled once in the PostHog project settings under Session replay.

### Serving analytics from musawirabrar.com

Ad blockers drop requests to posthog.com. PostHog's managed reverse proxy is free and
fixes that. One-time setup:

Done: `z.musawirabrar.com` is a PostHog managed reverse proxy (CNAME at Porkbun), and
`api_host` in every HTML file points at it. If it ever needs recreating: Organization
settings, Managed reverse proxy, new proxy, then a CNAME record at Porkbun.
