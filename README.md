# Ripple

> **🏆 1st Place — Disaster Response Track, Muslim Tech Collaborative Hackathon 2026**

**Every humanitarian decision creates ripples. See where yours land.**

[![Demo Video](https://img.shields.io/badge/Watch_Demo-YouTube-red?style=for-the-badge&logo=youtube)](YOUR_YOUTUBE_LINK_HERE)
[![Built With](https://img.shields.io/badge/Built_With-React_+_TypeScript_+_Vite-blue?style=for-the-badge&logo=react)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## The Problem

In any crisis, the hardest part is rarely the absence of need. It's turning scattered signals into action.

A family in Gaza has 2G connectivity and 30% battery. A field coordinator in Khartoum is managing 40 incoming requests with no clear sense of what's critical. A community org in Karachi has volunteers ready but no visibility into where they're needed.

People in crisis don't need another form or another hotline that never picks up. They need one place where a single tap from a phone in the dark can ripple all the way to the person who can actually help.

---

## What is Ripple?

Ripple is a two-sided humanitarian triage platform — purpose-built for the gap between crisis reports and coordinated response.

**One signal. Two sides. Designed to save time when time is the only thing that matters.**

### Resident Side — *Send a Ripple*
A mobile-first reporting interface stripped to its absolute minimum. No login. No lengthy forms. Just six icons, three urgency levels, and a number. The entire interface loads **under 30KB** — designed to work on 2G in degraded network conditions.

A resident in Al-Rimal can report a medical emergency in under 15 seconds.

### Responder Dashboard — *See Where It Lands*
A real-time triage command center for emergency coordinators, NGO partners, and field teams. Incoming reports are automatically prioritized by urgency, clustered by geography, and routed to the right team — all over a live map built on real OpenStreetMap facility data.

A coordinator sees not just *what* is needed, but *where* it's most critical and *why* it was flagged first.

---

## Demo

> 📺 **[Watch the full product walkthrough →](YOUR_YOUTUBE_LINK_HERE)**

---

## Features

### 🌍 Globe Entry Point
An interactive 3D globe surfaces all five active crisis cities at a glance, each with a live badge showing active request counts and highest urgency level. Clicking a city drops you directly into that city's triage dashboard.

### 📋 Triage Queue
Incoming reports are sorted by urgency (Emergency → Today → Stable) and timestamped. When multiple reports cluster from the same neighborhood, they auto-group into a single incident card with a count. Each report can be assigned to a field team in one click, then moved to Assigned or Resolved tabs.

### 🗺️ Live Map
A Leaflet.js map centered on the active city, rendering real hospital, clinic, school, and community center locations pulled live from the OpenStreetMap Overpass API. Report pins drop with a concentric ripple animation — the product's signature interaction moment.

### 📊 Humanitarian Readiness Index
A computed 0–100 score reflecting the operational state of each city across four dimensions: medical access, shelter capacity, corridor viability, and supply chain days. Color-coded by threshold: **CRITICAL / AT RISK / ADEQUATE / RESILIENT**.

### 🌐 Multilingual Support
Full UI translation for English, Arabic (RTL), Urdu (RTL), and Turkish — including the resident form, dashboard labels, briefing copy, and error states.

### 📱 Field Mode
A one-tap toggle that strips the dashboard to a single scrollable column optimized for low-bandwidth field use. No map renders. No animations. Pure information.

### 🤖 AI Note Enrichment *(Progressive Enhancement)*
Free-text notes submitted by residents are optionally enriched by the Groq API, which extracts location hints, additional needs, and urgency signals as structured JSON. If the API is unavailable, reports submit and display normally — **AI is never in the critical path.**

### 📄 Incident Briefing Export
A role-aware briefing panel (Emergency Manager / Hospital / Community Org / Resident View) auto-generates a structured 4-bullet summary of the city's current state. One-click copy to clipboard.

---

## Cities Covered

| City | Country | Crisis Type | Language |
|------|---------|-------------|----------|
| Gaza City | Palestine 🇵🇸 | Active Conflict | Arabic |
| Khartoum | Sudan 🇸🇩 | Conflict + Displacement | Arabic |
| Istanbul | Türkiye 🇹🇷 | Earthquake Risk | Turkish |
| Karachi | Pakistan 🇵🇰 | Flood + Seismic | Urdu |
| Cairo | Egypt 🇪🇬 | Flood + Heat | Arabic |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Mapping | Leaflet.js + OpenStreetMap tiles |
| Facility Data | OpenStreetMap Overpass API |
| AI Enrichment | Groq API (free tier, optional) |
| Internationalization | i18next |
| Styling | Custom glassmorphism design system |
| Linting | ESLint + TypeScript strict mode |

---

## Data Sources & Transparency

Ripple is a hackathon prototype. Data is handled responsibly and labeled clearly:

- **Facility pins** (hospitals, clinics, shelters) — live from OpenStreetMap contributors via Overpass API
- **Incident reports** — synthetic illustrative data, clearly labeled in the UI
- **Readiness scores** — computed from synthetic field report data, labeled "illustrative"

Every data freshness state is surfaced in the dashboard footer. Every failure mode has a graceful fallback.

> *Ripple is a proof-of-concept. Real deployment would require integration with verified humanitarian data partners and compliance with OCHA data-sharing protocols.*

---

## Design Principles

**1. The form never breaks.**
The resident report form has zero external dependencies in the critical submission path. It works if Groq is down, if OpenStreetMap is slow, if the JS bundle is partially loaded. A report always gets through.

**2. Every state is a designed state.**
Empty queues, API failures, offline conditions, RTL layout — each has an intentional UI response, not a blank screen or a raw error code.

**3. Clarity over completeness.**
A responder under pressure shouldn't have to read to understand. Color, hierarchy, and motion carry the urgency signal before text does.

**4. Designed for the worst connection.**
The resident form loads in under 3 seconds on 2G. Gaza has been legally restricted to 2G infrastructure since the Oslo Accords. This was not an afterthought.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/ripple.git
cd ripple

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file in the root:

```env
# Optional — AI note enrichment. App works without this.
VITE_GROQ_API_KEY=your_groq_api_key_here
```

The app runs fully without any API keys. Groq enrichment activates automatically if the key is present.

---

## ESLint Configuration

For production use, enable type-aware lint rules in `eslint.config.js`:

```js
import tseslint from 'typescript-eslint'

export default tseslint.config({
  extends: [tseslint.configs.recommendedTypeChecked],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

---

## The Ripple Moment

Every time a new report comes in — whether from a real submission or the live simulation engine — a concentric ring animation expands outward from the map pin. It's a small thing. But it's the product's heartbeat.

One tap. One ripple. All the way to the person who can help.

---

## Team

Built in one day at the Muslim Tech Collaborative Hackathon 2026.

---

*Synthetic field data — illustrative only. Ripple is a hackathon prototype, not an operational emergency tool.*
