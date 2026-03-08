# D:\ Command Center HUD

A sleek, local-first Next.js 15 dashboard for orchestrating, analyzing, and querying deep code on your `D:\` drive.

## Features Let's Go
- **Local SQLite Vector Database:** RAG embeddings generated via local `@xenova/transformers` and queried via lightning fast JSON-blob cosine similarity in `better-sqlite3`. No C++ compiling needed.
- **Deep Code Crawling:** Converts thousands of lines of code into tokenized, overlapping chunks injected into an OpenAI Context Window.
- **Conversational RAG AI:** Real-time streaming Chat UI floating directly on your dashboard.
- **Asynchronous Job Queue:** Run massive machine learning scripts or file copies without blocking the browser. Live tail logs via React polling intervals.
- **Webhook Bridge:** Safely trigger local `D:\` scripts from Make.com, n8n, or GitHub Actions.
- **Locked Down:** Completely secured by edge-runtime Next.js middleware, HttpOnly cookies, and strict JWT password hashes.

## Getting Started

### 1. Configure the Environment
Create a `.env` file in the root of the project:
```env
# Required for the login screen to unlock the dashboard
ADMIN_PASSWORD=your_super_secret_password

# Required for external services (Make.com, n8n) to trigger jobs
WEBHOOK_SECRET=your_webhook_secret

# Required for the GPT-4o-mini conversational Code RAG agent
OPENAI_API_KEY=sk-proj-...
```

### 2. Install & Run
```bash
npm install
npm run dev
```

## Opening to the Network

Once your `.env` is configured with an `ADMIN_PASSWORD` and `WEBHOOK_SECRET`, the dashboard is strictly locked down. You can safely expose it to the broader internet to run remote jobs against your computer.

Using **Ngrok**:
```bash
ngrok http 3000
```
*Navigate to your Ngrok URL from your phone, enter your Master Password, and you can now browse and query your local hard drive.*

Using **Cloudflare Tunnels**:
```bash
cloudflared tunnel --url http://localhost:3000
```
