# 🚀 Founders & Builders

The home base for builders and entrepreneurs — a practical, community-built ecosystem
where founders, developers, designers, marketers, operators, investors, students, and
creators find opportunities, connect with the right people, and help each other build
successful companies.

> We are not trying to build another social network. We're building a practical,
> collaborative ecosystem that helps builders spend less time searching across fragmented
> platforms and more time building meaningful relationships and successful companies.

This repository currently holds the **marketing landing site** that presents the platform
vision and gathers early community feedback.

## The vision at a glance

- 👤 **Member Profiles** — what you're building, skills, stage, and what you're looking for
- 🏢 **Business Directory** — searchable listings for startups, agencies, nonprofits & freelancers
- 🛍️ **Products & Services Marketplace** — promote and support each other's work
- 💼 **Jobs & Opportunities** — a community job board, incl. co-founder & advisory roles
- 🤝 **Mentor Network** — request a mentor or become one
- 🆘 **HAAALLLPPPPP!** — a help board for exactly what you need right now
- 🎤 **Co-Host & Collaborate** — events, workshops, AMAs, cross-promotion
- 🎙️ **Podcast Hub** — find guests, hosts, and local shows
- 💰 **Funding Hub** — founder ↔ investor matching (AI-assisted)
- 📅 **Community Calendar** — launching in **Boise** and **Atlanta**
- 💕 **Founder Diagnostic** — JIDOKA-powered bottleneck assessment for post-MVP founders
- 📚 **Resource Library** — templates, playbooks, prompts, grant & accelerator databases
- 📖 **Philosophical Topic Generator** — *"Do Not Open If You Want Peace"*
- 🤖 **Future AI Agents** — matchmaking, recommendations & a community concierge

## Tech

Plain, dependency-free **HTML / CSS / JavaScript** — no build step, no framework.

```
index.html            # landing page
styles.css            # design system & landing layout
script.js             # nav, scroll reveals, topic generator, waitlist form

profiles.html         # 👤 Member Directory (hub #1)
create-profile.html   # profile creation form
profiles.js           # directory + form logic (reads/writes the sheet)

business.html         # 🏢 Business Directory (hub #2)
add-business.html     # business listing form
business.js           # directory + form logic (reads/writes the sheet)

marketplace.html      # 🛍️ Marketplace (hub #3)
add-listing.html      # product/service listing form
marketplace.js        # directory + form logic (reads/writes the sheet)

jobs.html              # 💼 Jobs & Opportunities (hub #4)
add-job.html           # job/opportunity posting form
jobs.js                # directory + form logic (reads/writes the sheet)

mentors.html           # 🤝 Mentor Network (hub #5)
become-mentor.html     # mentor signup form
mentors.js             # directory + form logic (reads/writes the sheet)

help.html              # 🆘 Help Board (hub #6)
add-help.html          # post-a-need form
help.js                # directory + form logic (reads/writes the sheet)

funding.html           # 💰 Funding Hub — raising + investing boards (hub #7)
add-raise.html         # founder raise intake form
add-investor.html      # investor intake form
funding.js             # both directories + both forms (reads/writes the sheet)

calendar.html          # 📅 Community Calendar (hub #8)
add-event.html         # event posting form
calendar.js            # directory + form logic (reads/writes the sheet)

profiles.css          # shared hub styling (cards, modal, forms, toolbar)
config.js             # paste your Apps Script Web App URL here (shared by all hubs)
apps-script/Code.gs   # Google Sheets backend — one Web App serves every hub
```

## Google Sheets backend

Every hub uses the **same Google Sheet** as its datastore via **one Google Apps Script
Web App** — no server or paid database required, and it works from GitHub Pages. Each hub
gets its own tab (`Profiles`, `Businesses`, …), routed by a `type` param, so you only
deploy once no matter how many hubs get added.

**One-time setup:**

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Delete any code, paste all of [`apps-script/Code.gs`](apps-script/Code.gs), and Save.
3. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Copy the **Web app URL** (ends in `/exec`).
5. Paste it into [`config.js`](config.js) as `PROFILES_API`, commit, and push.

**When `apps-script/Code.gs` changes** (e.g. a new hub is added), update the existing
deployment rather than creating a new one — the URL in `config.js` stays valid:
**Deploy → Manage deployments → Edit (pencil) → Version: New → Deploy**.

Each sheet tab and its headers are created automatically on first use. Until
`config.js` is set, every hub shows sample data and forms run in demo mode (nothing is
saved).

**How it works:** each directory **reads** via JSONP (bypasses CORS, `?type=<hub>`), and
each form **writes** by POSTing `{ type: "<hub>", ... }` to the same endpoint. A hidden
honeypot field on every form filters basic spam bots.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (GitHub Pages)

1. Push to `main`.
2. In the repo: **Settings → Pages → Build from a branch → `main` / `root`**.
3. Your site goes live at `https://<user>.github.io/buildersandentrepreneurs/`.

## Roadmap

- [x] Landing site presenting the vision
- [x] **👤 Member Profiles** — directory + create form, Google Sheets backend
- [x] **🏢 Business Directory** — directory + listing form, Google Sheets backend
- [x] **🛍️ Products & Services Marketplace** — listings + "book a consultation", Google Sheets backend
- [x] **💼 Jobs & Opportunities** — job board with apply/contact CTAs, Google Sheets backend
- [x] **🤝 Mentor Network** — mentor directory + signup form, Google Sheets backend
- [x] **🆘 Help Board** — post-a-need board with category/urgency filters, Google Sheets backend
- [x] **💰 Funding Hub** — raising + investing boards, Google Sheets backend (AI-assisted matching is a future upgrade)
- [x] **📅 Community Calendar** — event listings for Boise & Atlanta + virtual, Google Sheets backend
- [ ] 🤖 AI agents

Contributions and feedback welcome — **the door is open. Let's build this together.**
