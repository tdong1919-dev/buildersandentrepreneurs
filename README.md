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
profiles.css          # hub styling
config.js             # paste your Apps Script Web App URL here
apps-script/Code.gs   # Google Sheets backend (deploy on your sheet)
```

## 👤 Member Profiles hub — Google Sheets backend

Hub #1 is live. It uses a **Google Sheet as its datastore** via a **Google Apps Script
Web App** — no server or paid database required, and it works from GitHub Pages.

**One-time setup:**

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Delete any code, paste all of [`apps-script/Code.gs`](apps-script/Code.gs), and Save.
3. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Copy the **Web app URL** (ends in `/exec`).
5. Paste it into [`config.js`](config.js) as `PROFILES_API`, commit, and push.

That's it — the `Profiles` tab and its headers are created automatically on first use.
Until `config.js` is set, the directory shows sample profiles and the form runs in demo
mode (nothing is saved).

**How it works:** the directory **reads** profiles via JSONP (bypasses CORS), and the form
**writes** new profiles by POSTing to the same endpoint. A hidden honeypot field filters
basic spam bots.

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
- [ ] 🏢 Business Directory
- [ ] 🛍️ Products & Services Marketplace
- [ ] 💼 Jobs & Opportunities
- [ ] 🤝 Mentor Network · 🆘 Help board · 💰 Funding Hub · 📅 Calendar · 🤖 AI agents

Contributions and feedback welcome — **the door is open. Let's build this together.**
