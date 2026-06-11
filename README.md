```markdown
# 🏦 **SECUREBANK** – From Blank Slate to AI-Powered Banking

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.com/)
[![Docker](https://img.shields.io/badge/Docker-27.3-blue.svg)](https://www.docker.com/)
[![Oracle Cloud](https://img.shields.io/badge/Oracle%20Cloud-Infrastructure-red.svg)](https://cloud.oracle.com/)

> **A production-grade, full-stack banking platform with an integrated conversational AI agent.**  
> Built from absolute zero — a blank cloud server — into a fully functional, intelligent financial system.

---

## 📖 **The Story: What Does It Really Take to Build a Modern AI-Powered Bank?**

It starts with a single step: a **blank cloud instance**. No code. No database. No AI. Just raw compute.

This project chronicles the end-to-end journey of architecting and building a **production-ready AI banking system** from that empty slate. It's not just about writing code; it's about forging a resilient ecosystem where a web UI, secure APIs, an LLM, and a cloud database all learn to communicate in perfect harmony.

```text
🌱 EMPTY CLOUD SERVER
         │
         ▼ (Act 1: The Foundation)
🛡️ Hardened Infrastructure + Docker + Nginx
         │
         ▼ (Act 2: The Assembly Line)
⚙️ Zero-Touch CI/CD Pipeline (Auto-deploys in <1 min)
         │
         ▼ (Act 3: The Brain)
🧠 Google ADK + Gemini AI (Grounded, conversational agent)
         │
         ▼ (Act 4: The Connection)
🔗 Cross-layer debugging → Perfect System Harmony
         │
         ▼
🏆 FULLY FUNCTIONAL AI BANKING SYSTEM
```

---

## ✨ **System in Action: A Debugging Story**

The journey from "buggy to brilliant" reveals a core engineering truth:

> *"Problems almost never live in isolation."*

| Attempt | Result | Lesson |
| :--- | :--- | :--- |
| **v1.0** 🐛 | `Connection failed` | Frontend couldn't reach the backend. Network layer issue. |
| **v1.1** 🐞 | `Generic server error` | Systems are talking, but APIs aren't aligned. |
| **v2.0** ✅ | `Your balance is $1,250.00` | **Success!** Frontend ↔ Backend ↔ AI ↔ Database in perfect harmony. |

---

## 🚀 **Key Features**

### 💰 Core Banking
- **Secure Authentication** & JWT-based authorization
- **Interactive Dashboard** with real-time account balances
- **Transaction Management** (view, filter, transfer)
- **Responsive UI** built with React & TypeScript

### 🧠 AI Banking Assistant
- **Conversational Interface** powered by Google's Gemini & ADK
- **Grounded Responses** – AI only uses live data from your accounts
- **Action-Oriented** – Can check balances and initiate transfers *with explicit user confirmation*
- **MCP Tool Integration** for secure backend actions

### 🛠️ Engineering & DevOps
- **Zero-Touch CI/CD** – Auto-detects updates and deploys in **<1 minute**
- **Full Containerization** (Docker + Docker Compose)
- **Nginx Reverse Proxy** for security and load balancing
- **Oracle Cloud Infrastructure (OCI)** deployment
- **Automated Testing** pipeline

---

## 🏗️ **Architecture Overview**

```text
┌─────────────────────────────────────────────────────────────┐
│                      🌐 CLIENT BROWSER                       │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    🚪 NGINX REVERSE PROXY                    │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼ (API Calls)                 ▼ (Static Files)
┌──────────────────────────────┐  ┌──────────────────────────────┐
│     🐍 FASTAPI BACKEND       │  │     ⚛️ REACT FRONTEND         │
│  • Business Logic            │  │  • User Interface             │
│  • Auth & Sessions           │  │  • State Management           │
│  • API Routes                │  │  • Real-time Updates          │
└───────────────┬──────────────┘  └──────────────────────────────┘
                │
                ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  🧠 AI AGENT LAYER (ADK)     │  │  ☁️ ORACLE CLOUD              │
│  • Gemini LLM Integration    │◄─┤  • Autonomous Database        │
│  • MCP Tools                 │  │  • Persistent Storage         │
│  • Grounded Prompts          │  │  • High Availability          │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## 🛠️ **Technology Stack**

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, HTML5, CSS3 |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **AI & LLM** | Google ADK, Gemini, MCP (Model Context Protocol) |
| **Database** | Oracle Autonomous Database, SQL |
| **Infrastructure** | Docker, Docker Compose, Nginx, OCI Compute |
| **DevOps** | GitHub Actions, CI/CD, Automated Testing |
| **Security** | JWT, Environment Isolation, HTTPS, Input Validation |

---

## ☁️ **Cloud Deployment & CI/CD**

The application runs on **Oracle Cloud Infrastructure** as Docker containers orchestrated by Docker Compose.

### Deployment Pipeline (Fully Automated)

```text
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  git push│────▶│  GitHub  │────▶│  Build   │────▶│  Docker  │────▶│  Oracle  │
│   to main│     │ Actions  │     │ + Test   │     │  Image   │     │  Cloud   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └─────┬────┘
                                                                            │
                                                                            ▼
                                                              ┌─────────────────────┐
                                                              │ docker-compose up   │
                                                              │ (Zero-touch deploy) │
                                                              └─────────────────────┘
```

- **Zero-Touch Dependency Management**: The pipeline automatically watches for updated libraries, rebuilds, and deploys in **<1 minute**. Manual work: **Zero**.

---

## 🤖 **The AI Agent: Grounded Intelligence**

Unlike a generic chatbot, this AI operates with strict, bank-grade rules:

1.  **Grounded**: Only answers based on **live data from the Oracle database**
2.  **Action-Oriented**: Performs tasks via secure MCP tools
3.  **Safety-First**: Requires explicit user confirmation before moving money
4.  **Conversational**: Understands natural language like *"What's my balance?"*

---

## 🔒 **Security & Best Practices**

- **Infrastructure as Code** (Docker Compose)
- **Secrets Management** (No hardcoded credentials)
- **Defense in Depth**: Nginx proxy, API validation, DB isolation
- **Automated Dependency Scanning** via CI pipeline

---

## 📂 **Project Structure**

```text
BANK/
├── frontend/           # React + TypeScript UI
│   ├── src/
│   └── public/
├── backend/            # FastAPI application
│   ├── routers/
│   ├── models/
│   └── services/
├── agents/             # Google ADK agents & MCP tools
├── database/           # SQL scripts & Oracle config
├── nginx/              # Reverse proxy configuration
├── docker/             # Dockerfiles & compose specs
├── .github/            # CI/CD workflows
└── docs/               # Documentation & screenshots
```

---

## 🚀 **Run Locally**

### Prerequisites
- Python 3.12+
- Docker & Docker Compose
- Oracle Database access
- Google AI API Key

### Clone & Start

```bash
git clone https://github.com/ihtali/BANK.git
cd BANK
docker-compose up --build
```

### Access Points

| Service | URL |
| :--- | :--- |
| **Frontend** | `http://localhost` |
| **Backend API** | `http://localhost/api` |
| **API Docs (Swagger)** | `http://localhost/docs` |

---

## 📸 **Screenshot**

![AI-Powered Banking Platform UI](docs/Bank..jpeg)

---

## 🎯 **Key Learning Outcomes**

This project demonstrates:

- ✅ **Full-Stack Ownership** – From blank cloud server to live application
- ✅ **Enterprise AI Integration** – Production use of Google ADK & Gemini
- ✅ **Cloud-Native DevOps** – Zero-touch CI/CD, Docker, OCI deployment
- ✅ **Cross-Layer Debugging** – System harmonization expertise
- ✅ **Security-First Mindset** – Authentication, isolation, safety protocols

---

## 👨‍💻 **My Contribution**

This project was independently designed and built end-to-end:

- Frontend development (React + TypeScript)
- Backend architecture (FastAPI)
- AI agent integration (Google ADK + Gemini)
- MCP tool implementation
- Database design (Oracle)
- Docker containerization
- Nginx configuration
- Cloud deployment (OCI)
- CI/CD automation (GitHub Actions)
- Testing and debugging

---

## 🔮 **Future Roadmap**

- [ ] Multi-agent workflows (fraud detection + customer service)
- [ ] Voice banking assistant
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced analytics dashboard with AI insights
- [ ] Role-based access control (Admin, Teller, Customer)

---

## 📬 **Connect With Me**

**Ihtasham Ali**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ihtasham-ali-7aa659240/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ihtali)

---

**⭐ If you found this project interesting, please star the repository!**

*Building systems that understand, trust, and communicate with each other is the future of engineering.*
```
