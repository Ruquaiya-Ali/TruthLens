# 🔎 TruthLens

> AI-powered media analysis engine — detect bias, credibility, manipulation, and rhetoric in any news article.

![TruthLens](https://img.shields.io/badge/TruthLens-v1.0.0-22c55e?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-FastAPI-2aaefa?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-Vite-16a34a?style=for-the-badge&logo=react)
![Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-4ade80?style=for-the-badge)

---

## What It Does

TruthLens is a Chrome extension that analyzes news articles for:

- **⚖️ Political Bias** — Left to Right spectrum score with visual slider
- **🛡️ Credibility Score** — How likely the article is misinformation
- **⚠️ Manipulation Score** — Sensationalism and emotional manipulation detection
- **🎭 Rhetoric Score** — Identifies specific rhetorical devices and loaded language
- **📋 Key Claims** — Extracts the 5 main claims the article is making

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension UI | React + Vite + Tailwind CSS |
| Extension Shell | Chrome Manifest V3 |
| Backend API | Python + FastAPI |
| AI Engine | Anthropic Claude API |
| Deployment | Render (free tier) |

---

## Architecture

```
User pastes article text in popup
        ↓
Chrome Extension sends POST request
        ↓
FastAPI backend receives request
        ↓
Claude API analyzes article (prompt engineering)
        ↓
Structured JSON returned (scores + claims)
        ↓
Extension renders results in popup UI
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Anthropic API key (console.anthropic.com)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the backend folder:
```
ANTHROPIC_API_KEY=your_key_here
```

Run the server:
```bash
uvicorn main:app --reload
```

### Extension Setup

```bash
cd extension
npm install
npm run build
```

Load into Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `extension/dist` folder

---

## Deployment

Backend is deployed on Render. To deploy your own:

1. Push repo to GitHub
2. Create a new Web Service on render.com
3. Set Root Directory to `backend`
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add `ANTHROPIC_API_KEY` as an environment variable

Then update `API_URL` in `extension/src/App.jsx` to your Render URL and rebuild.

---

## Roadmap

- [ ] Author background lookup
- [ ] URL auto-fetch support
- [ ] Source credibility database comparison
- [ ] Export analysis as PDF report
- [ ] Firefox extension support

---

## What I Learned

- Prompt engineering structured JSON responses from LLMs
- Building and deploying REST APIs with FastAPI
- Chrome Extension architecture (Manifest V3)
- Connecting a browser extension to a live backend
- React state management for multi-view UIs

---

Built by [Ruquaiya](https://github.com/ruquaiya-ali) — BTech Automation Engineering Technology @ McMaster University
