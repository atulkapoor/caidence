# C(AI)DENCE | AI Marketing Intelligence Suite

A comprehensive AI-powered marketing intelligence platform that combines autonomous campaign management, content generation, influencer discovery, and analytics in a single unified interface.

![C(AI)DENCE Dashboard](https://img.shields.io/badge/Version-1.0.0-blue) ![Python](https://img.shields.io/badge/Python-3.11+-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### Core Modules
- **AI Agent** — Autonomous marketing campaign execution with goal-based planning
- **AI Chat** — Conversational assistant powered by local LLMs (Ollama)
- **Content Studio** — AI-generated marketing copy, social posts, and articles
- **Design Studio** — AI image generation and brand asset management
- **Presentation Studio** — Automated slide deck creation with AI

### Marketing Intelligence
- **Campaign Planner** — Multi-step wizard with audience overlap analysis and tie-breaker comparisons
- **Advanced Discovery Engine** — AI-powered influencer search with vibe matching, voice analysis, and image recognition
- **CRM & Relationships** — Track influencer partnerships, ROI, and generate X-Ray reports
- **Analytics Suite** — Real-time performance dashboards with social listening capabilities
- **Marcom Hub** — Unified communications management

### Advanced Features (KlugKlug Parity)
- ✅ Audience Overlap Calculator (Venn Diagram visualization)
- ✅ Tie-Breaker Comparator (side-by-side campaign plans)
- ✅ Influencer Credibility Score & Fake Follower Detection
- ✅ Competitor Tracker with sentiment analysis
- ✅ AI-powered search by content style, image recognition, and voice analysis

---

## 📁 Project Structure

```
C(AI)DENCE/
├── backend/                 # FastAPI Python Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/   # REST API endpoints
│   │   │       ├── agent.py
│   │   │       ├── analytics.py
│   │   │       ├── campaigns.py
│   │   │       ├── chat.py
│   │   │       ├── communications.py
│   │   │       ├── content.py
│   │   │       ├── crm.py
│   │   │       ├── dashboard.py
│   │   │       ├── design.py
│   │   │       ├── discovery.py
│   │   │       ├── presentation.py
│   │   │       ├── projects.py
│   │   │       └── workflow.py
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # AI service layer (Ollama integration)
│   │   └── main.py          # FastAPI app entrypoint
│   └── requirements.txt
│
├── frontend/                # Next.js 16 React Frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── ai-agent/
│   │   │   ├── ai-chat/
│   │   │   ├── analytics/
│   │   │   ├── campaigns/
│   │   │   ├── content-studio/
│   │   │   ├── crm/
│   │   │   ├── design-studio/
│   │   │   ├── discovery/
│   │   │   ├── marcom/
│   │   │   ├── presentation-studio/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── workflow/
│   │   ├── components/      # Reusable React components
│   │   └── lib/             # API client and utilities
│   └── package.json
│
└── docker-compose.yml       # PostgreSQL database
```

---

## 🛠️ Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Ollama** (for local LLM inference) — [Install Ollama](https://ollama.ai)
- **Docker** (optional, for PostgreSQL)

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/cadence-ai.git
cd cadence-ai
```

### 2. Start the Backend
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python3 -m uvicorn app.main:app --reload --port 8080
```
Backend will be available at: **http://localhost:8080**

API Docs (Swagger): **http://localhost:8080/docs**

### 3. Start the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be available at: **http://localhost:3000**

### 4. (Optional) Start PostgreSQL with Docker
```bash
docker-compose up -d
```

### 5. (Optional) Start Ollama for AI Features
```bash
# Install Ollama if not already installed
brew install ollama  # macOS

# Pull required models
ollama pull llama3.2
ollama pull llava  # For image analysis

# Start Ollama server
ollama serve
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434` |
| `DATABASE_URL` | PostgreSQL connection string | SQLite (default) |

---

## 📚 API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Dashboard | `GET /api/v1/dashboard/stats` | Dashboard KPIs |
| Chat | `POST /api/v1/chat/message` | AI chat with Ollama |
| Content | `POST /api/v1/content/generate` | Generate marketing copy |
| Design | `POST /api/v1/design/generate` | Generate images |
| Campaigns | `POST /api/v1/campaigns/wizard` | Campaign planning wizard |
| Discovery | `POST /api/v1/discovery/search` | Influencer search |
| CRM | `GET /api/v1/crm/relationships` | Influencer relationships |
| Analytics | `GET /api/v1/analytics/competitor-analysis` | Competitor tracking |
| Workflow | `POST /api/v1/workflow/execute` | Execute automation workflows |

Full API documentation available at `/docs` when the backend is running.

---

## 🎨 Tech Stack

### Backend
- **FastAPI** — High-performance Python web framework
- **SQLAlchemy** — ORM for database operations
- **Pydantic** — Data validation
- **Ollama** — Local LLM inference

### Frontend
- **Next.js 16** — React framework with App Router
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Data visualization
- **Lucide React** — Icon library

---

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Linting
```bash
# Backend
ruff check .

# Frontend
npm run lint
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ by the C(AI)DENCE Team**
