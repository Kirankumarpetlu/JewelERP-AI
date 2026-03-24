# JewelVault ERP & AI Insights Dashboard 💎

An AI-powered Enterprise Resource Planning (ERP) platform designed specifically for Jewellery retail businesses. This system offers real-time POS billing, inventory management, customer analytics, and an integrated Intelligent Assistant powered by LangChain and Groq LLMs.

![Dashboard Preview](https://img.shields.io/badge/Status-Operational-brightgreen)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![AI](https://img.shields.io/badge/AI-Groq%20%2B%20LangChain-f59e0b)

## 🚀 Features

*   **Intelligent AI Assistant:** Ask questions about your business data, trends in jewelry, or get restock recommendations using a LangChain agent hooked up to the Groq API.
*   **AI Business Insights:** Rule-based analytics combined with ML demand-prediction that tells you **when to restock**, what styles are trending, and anticipates seasonal demand.
*   **POS Billing System:** Create invoices instantly. Automatically fetch the live market metal prices and configure custom making charges along with automated GST parsing.
*   **Comprehensive Dashboards:** Visualize monthly revenue trends, top-selling categories, and customer loyalty brackets utilizing beautiful, glassmorphic UI components.
*   **Synthetic/Mock Data Enabled:** Easily test the application instantly out of the box — the backend seamlessly switches to an in-memory Mock MongoDB that automatically populates over 1,000+ synthetic transactions without complicated local database installations!

## 🛠️ Technology Stack

**Frontend:**
*   React 18 + TypeScript
*   Vite (Build Tool)
*   Tailwind CSS (Styling & Glassmorphism)
*   Recharts (Data Visualization)
*   Lucide React (Iconography)

**Backend:**
*   Python 3.10+
*   FastAPI (RESTful API & Web Server)
*   Motor & MongoMock (Asynchronous MongoDB Interactions)
*   LangChain & LangGraph (AI Agent Orchestration)
*   Groq API (Fast LLM Inferences)
*   Scikit-Learn (Predictive ML Models)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16.0 or higher)
*   [Python](https://www.python.org/downloads/) (v3.9 or higher)
*   *(Optional)* MongoDB Local Server or Atlas URI

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kirankumarpetlu/JewelERP-AI.git
   cd JewelERP-AI
   ```

2. **Configure Environment Variables**
   Navigate to the `backend/` directory and create a `.env` file containing your specific keys:
   ```env
   # backend/.env

   # 1. MongoDB URI (Optional: If omitted or connection fails, the app uses an in-memory mock DB automatically!)
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=jewellery_erp

   # 2. Add your Groq LLM API Key for the Assistant
   GROQ_API_KEY=gsk_your_groq_api_key_here

   # 3. Add your Metal Price API Key for live Gold/Silver Rates
   METAL_PRICE_API_KEY=your_metal_price_api_key_here
   ```

3. **Install Backend Dependencies & Run**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Start the FastAPI server (Runs on port 8000)
   python main.py
   ```

4. **Install Frontend Dependencies & Run**
   Open a new terminal window:
   ```bash
   cd gleam-dashboard-main/gleam-dashboard-main
   npm install
   
   # Start the Vite development server
   npm run dev
   ```

## 🌐 Application Architecture

The system is organized into a modular monorepo:
*   `/backend/routes/`: REST endpoints for everything from Inventory manipulation to Sales Analytics.
*   `/backend/agents/`: Hosts the LangChain custom `create_react_agent` logic connected to specific mathematical and descriptive tools built to read internal MongoDB data natively.
*   `/backend/ml/`: Predictive demand modeling to calculate and suggest restocks automatically via sci-kit learn.
*   `/gleam-dashboard-main/src/pages/`: React views featuring robust routing (Dashboard, Analytics, Customers, AI Insights).
*   `/gleam-dashboard-main/src/lib/api.ts`: Centralized `fetch` wrapper standardizing asynchronous communication with the FastAPI application.

## 🤝 Contribution

Feel free to fork the repository, open a pull request, or submit any issues you may find while testing the platform.
