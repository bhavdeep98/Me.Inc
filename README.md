<p align="center">
  <h1 align="center">🚀 Me Inc.</h1>
  <p align="center">
    <strong>Your Job Hunt is a Startup. Run it Like One.</strong>
  </p>
  <p align="center">
    An AI-powered career acceleration platform that treats your job search as a high-velocity product company.
  </p>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-vision">Vision</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/python-3.11+-blue" alt="Python">
  <img src="https://img.shields.io/badge/next.js-15+-black" alt="Next.js">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

---

## 🎯 The Problem

**Most job seekers optimize for "being busy." Me Inc. optimizes for outcomes that compound.**

Traditional job hunting is broken:
- 📄 **Static resumes** that don't adapt to each opportunity
- 🎯 **Spray-and-pray applications** with <2% response rates  
- 🤝 **Ignored networks** that could provide warm introductions
- 📊 **No visibility** into what's working and what isn't
- 🧠 **Decision fatigue** from manually tracking hundreds of opportunities

## 💡 The Solution

Me Inc. creates a **self-reinforcing flywheel** where AI agents work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE ME INC. FLYWHEEL                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    📄 RESUME ENGINE          🔍 MARKET SCOUT                │
│    Optimizes your value  →   Finds where to                 │
│    proposition               insert that value              │
│           ↑                         ↓                       │
│           └──── 🤝 NETWORK ─────────┘                       │
│                  MATCHER                                     │
│           Connects you to the                               │
│           people who control                                │
│              the value                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🎯 Currently Implemented

#### Resume Coach (Agent B - DSPy)
- **📄 PDF Resume Parser** - Upload your resume, get it structured into editable JSON
- **🔍 STAR Analysis** - AI critiques each bullet point using Situation-Task-Action-Result methodology
- **💬 Interactive Refinement** - Answer targeted questions to improve weak bullets
- **✏️ Live Editing** - Click any text to edit directly in the preview
- **📚 Full Section Support** - Work experience, education, skills, publications, patents, awards, certifications, languages, volunteer work

#### Modern Tech Stack
- **Backend**: FastAPI + PostgreSQL + DSPy
- **Frontend**: Next.js 15 + Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4o for parsing, DSPy for structured reasoning

### 🚧 Coming Soon

#### Market Scout (Agent A - LangGraph)
- Job scraping from LinkedIn, Indeed, company sites
- Intelligent fit scoring based on your profile
- Automatic opportunity discovery (50+ jobs/day)
- Application deadline tracking

#### Network Matcher (Agent C)
- LinkedIn connection graph builder
- Pathfinding: "How do I reach Company X?"
- Warm introduction suggestions
- Relationship strength scoring

#### Decision Logger
- Full transparency into every AI decision
- Audit trail with reasoning
- User override capabilities
- Learn what's working

#### Orchestration Engine
- Strategy selection (resume-first, network-first, market-first)
- Workflow coordination between agents
- Progress tracking and metrics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATION SERVICE                      │
│            (Strategy selector, workflow engine)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│  Resume Engine  │ │Market Scout │ │ Network Matcher │
│     (DSPy)      │ │ (LangGraph) │ │   (Graph DB)    │
│                 │ │             │ │                 │
│ • PDF Parser    │ │ • Scraper   │ │ • Graph Builder │
│ • STAR Coach    │ │ • Fit Score │ │ • Pathfinding   │
│ • Tailoring     │ │ • Tracker   │ │ • Suggestions   │
└────────┬────────┘ └──────┬──────┘ └────────┬────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ↓
              ┌────────────────────────┐
              │    DECISION LOGGER     │
              │  (Full audit trail)    │
              └────────────────────────┘
                           ↓
              ┌────────────────────────┐
              │   PostgreSQL + JSONB   │
              └────────────────────────┘
```

### Why This Stack?

| Choice | Reasoning |
|--------|-----------|
| **DSPy** | Declarative AI programming - define *what* not *how*. Self-optimizing prompts. |
| **LangGraph** | Stateful agent workflows with cycles. Perfect for multi-step job analysis. |
| **PostgreSQL + JSONB** | Flexible schemas for evolving data. Graph queries for network analysis. |
| **FastAPI** | Async Python, auto-generated docs, great for AI/ML backends. |
| **Next.js 15** | React Server Components, fast iteration, excellent DX. |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for development)
- OpenAI API key

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/bhavdeep98/Me.Inc.git
cd Me.Inc

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the backend
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Try It Out

1. Open http://localhost:3000
2. Upload your resume PDF
3. Click "✨ Critique" on any bullet point
4. Answer the AI's questions to improve your bullets

---

## 📊 The Me Inc. Operating System

This isn't just a tool—it's a **framework for running your job hunt like a startup**.

### Weekly Executive Summary
Track your progress with data, not feelings:
- **North Star Metrics**: Offers, interviews, callbacks
- **Leading Indicators**: Commits, outreach velocity, features shipped
- **Power Law Analysis**: Are you betting on the right things?

### Power Law RICE Prioritization
Not all tasks are equal. We use exponential scoring:

| Task | Reach | Impact | Confidence | Effort | Score | Verdict |
|------|-------|--------|------------|--------|-------|---------|
| Co-Founder Matcher | 1000 | 100 | 20% | 10 | 2,000 | 🎯 The Bet |
| Resume Agent | 100 | 10 | 80% | 5 | 1,600 | 💰 Cash Cow |
| LeetCode Grind | 1 | 1 | 100% | 14 | 7 | 📋 The Chore |

### The Compound Effect

```
Week 1: Ship Resume Agent → Generate 5 tailored resumes
Week 2: Ship Market Scout → Discover 200 opportunities
Week 3: Combine → Auto-match + tailor for top 20
Week 4: Ship Network Matcher → Find warm intros for 10
Week 5: Result → 10 warm applications vs. 0 cold
Week 6: Result → 5 first-round interviews
Week 7: Result → 2 final rounds
Week 8: Result → Multiple offers 🎉
```

---

## 🗺️ Roadmap

### Phase 1: Resume Engine ✅ (Current)
- [x] PDF parsing with LLM
- [x] STAR methodology coaching
- [x] Interactive bullet refinement
- [x] Full resume section support
- [ ] LaTeX export for professional formatting
- [ ] Resume version management

### Phase 2: Market Scout 🚧
- [ ] Job scraping infrastructure
- [ ] Fit scoring algorithm
- [ ] Opportunity ranking
- [ ] Application tracking

### Phase 3: Network Matcher 📋
- [ ] LinkedIn data import
- [ ] Graph construction
- [ ] Pathfinding algorithms
- [ ] Warm intro suggestions

### Phase 4: Full Integration 📋
- [ ] Orchestration engine
- [ ] Decision logging
- [ ] Dashboard & analytics
- [ ] Auto-apply capabilities

### Moonshots 🌙
- [ ] Co-Founder Vector Matcher
- [ ] Interview preparation agent
- [ ] Salary negotiation advisor
- [ ] Chrome extension for LinkedIn

---

## 🤝 Contributing

**We're building this in public because job hunting is a universal problem that deserves an open solution.**

### Ways to Contribute

#### 🐛 Report Bugs
Found something broken? [Open an issue](https://github.com/bhavdeep98/Me.Inc/issues/new) with:
- What you expected to happen
- What actually happened
- Steps to reproduce

#### 💡 Suggest Features
Have an idea? We'd love to hear it! Open an issue tagged `enhancement`.

#### 🔧 Submit Code
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

#### 📝 Improve Documentation
- Fix typos
- Add examples
- Clarify confusing sections
- Translate to other languages

### Priority Areas for Contribution

| Area | Difficulty | Impact | Good For |
|------|------------|--------|----------|
| Job scraper for new sources | Medium | High | Backend devs |
| Resume template designs | Easy | Medium | Designers |
| Unit tests | Easy | High | New contributors |
| Docker setup | Medium | High | DevOps folks |
| Mobile responsiveness | Medium | Medium | Frontend devs |
| Documentation | Easy | High | Everyone! |

### Development Guidelines

- **Code Style**: We use Black for Python, Prettier for TypeScript
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **PRs**: Include a description of what and why
- **Tests**: Add tests for new features

---

## 📖 Documentation

Detailed documentation lives in the `/initial commit` folder:

| Document | Description |
|----------|-------------|
| [me-inc-operating-system.md](initial%20commit/me-inc-operating-system.md) | The agile framework for running your job hunt |
| [job-agent-system-design.md](initial%20commit/job-agent-system-design.md) | Full technical architecture |
| [implementation-roadmap.md](initial%20commit/implementation-roadmap.md) | Week-by-week build plan |
| [guide_agent_lld.md](initial%20commit/guide_agent_lld.md) | DSPy agent low-level design |
| [resume_architecture.md](initial%20commit/resume_architecture.md) | Resume engine data structures |

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests (coming soon)
cd frontend
npm test
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [DSPy](https://github.com/stanfordnlp/dspy) - Stanford NLP's framework for programming LLMs
- [LangGraph](https://github.com/langchain-ai/langgraph) - Stateful agent workflows
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- Everyone who's ever been frustrated by job hunting 💪

---

## 📬 Contact

**Bhavdeep Singh Sachdeva**

- GitHub: [@bhavdeep98](https://github.com/bhavdeep98)

---

<p align="center">
  <strong>Your career is a startup. You are the CEO.</strong>
  <br>
  <em>Let's build the operating system together.</em>
</p>

<p align="center">
  ⭐ Star this repo if you believe job hunting should be smarter, not harder.
</p>
