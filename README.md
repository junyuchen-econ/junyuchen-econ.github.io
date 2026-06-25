# junyuchen-econ.github.io

Personal academic website built with [al-folio](https://github.com/alshedivat/al-folio) v1.0.

Live at: **https://junyuchen-econ.github.io**

---

## Quick-start: what to edit

| What you want to change | File to edit |
|---|---|
| Name, email, institution, links | `_config.yml` — Section 1 (IDENTITY) |
| Social media / academic profile IDs | `_config.yml` — Section 2 (SOCIAL & ACADEMIC IDs) |
| Homepage bio and profile photo | `_pages/about.md` + `assets/img/prof_pic.jpg` |
| Papers and working papers | `_bibliography/papers.bib` |
| CV PDF download | drop `cv.pdf` in `assets/pdf/` |
| Projects | add/edit `.md` files in `_projects/` |
| News / announcements | add `.md` files to `_news/` |
| Links (advisors, genealogy) | `_pages/links.md` |

---

## GitHub setup (do this before pushing)

1. **Push this code** to `main`:
   ```sh
   git add .
   git commit -m "Initial site setup"
   git push
   ```

2. **Wait for the deploy workflow** (~4 minutes)
   - Repo → **Actions** tab → watch the "Deploy site" workflow finish

3. **Configure GitHub Pages**
   - Repo → **Settings** → **Pages** → **Build and deployment**
   - Set **Source** to **Deploy from a branch**
   - Set **Branch** to `gh-pages` (NOT `main`)
   - Click **Save**

4. Your site will be live at `https://junyuchen-econ.github.io` within ~1 minute.

---

## Navbar pages

| Page | URL | Visible |
|---|---|---|
| About (homepage) | `/` | always |
| Research | `/research/` | yes |
| Projects | `/projects/` | yes |
| Links | `/links/` | yes |
| News | `/news/` | yes |

---

## Adding papers

Open `_bibliography/papers.bib` and add a BibTeX entry per paper:

```bibtex
@article{chen2024mytitle,
  title    = {Your Paper Title},
  author   = {Chen, Junyu},
  journal  = {Working Paper},
  year     = {2024},
  abstract = {Abstract text here.},
  pdf      = {/assets/pdf/chen2024mytitle.pdf},
  selected = {true},
  abbr     = {WP},
}
```

PDFs placed in `assets/pdf/` are served automatically.

---

## Developing locally (optional)

Requires Ruby and Bundler.

```sh
bundle install
bundle exec jekyll serve
```

Open http://localhost:4000 in your browser. Changes are reflected in real time.

---

## Theme

Built on [al-folio](https://github.com/alshedivat/al-folio) v1.0.
For full documentation see the [al-folio docs](https://github.com/alshedivat/al-folio/blob/main/docs/README.md).
