# AI Finance Tracker - Presentation Flow

This document outlines the structure and content for the project presentation. It covers the core problem, the AI-driven solution, technical architecture (including Cloud & AI integrations), and the specialized University Grant Approval feature.

---

## 📊 Presentation Outline

### **Slide 1: Title Slide**
*   **Project Name:** FinanceGuard AI (or AI Finance Tracker)
*   **Subtitle:** Intelligent Personal Finance & Grant Management System
*   **Presented by:** [Your Name/Team Name]
*   **Context:** B.Tech Final Year Project

### **Slide 2: The Problem**
*   **Personal Finance:** Students and individuals struggle to track scattered expenses across multiple accounts and cash.
*   **Group Expenses:** Splitting bills with roommates or friends is messy and often leads to forgotten debts.
*   **Grant Management:** University students face tedious paperwork for grant approvals, involving manual receipt submission and verification.
*   **Lack of Insights:** Traditional apps record data but don't provide *actionable* advice.

### **Slide 3: The Solution - FinanceGuard AI**
*   **Overview:** A comprehensive financial ecosystem that combines manual tracking with AI-powered automation.
*   **Core Philosophy:** "Track, Analyze, Optimize."
*   **Key Differentiator:** Multi-Agent AI system that acts as a financial team (Analyst, Advisor, Risk Assessor).

### **Slide 4: Key Features (User Facing)**
*   **Interactive Dashboard:** Real-time visualization of spending vs. budget.
*   **Smart Expense Tracking:** Categorization and tagging.
*   **Group Splits:** "Splitwise-like" feature for managing shared expenses and settling debts.
*   **AI Chat Assistant:** Natural language interface to query finances (e.g., "How much did I spend on food last week?").
*   **Multi-Agent Insights:** Proactive advice from three specialized AI agents.

### **Slide 5: Feature Spotlight - University Grant Approval System**
*   **The Innovation:** Automating the reimbursement process for student grants/expenses.
*   **Workflow:**
    1.  **Capture:** User scans a physical receipt using the mobile/web interface.
    2.  **OCR Processing:** System extracts text (Merchant, Date, Amount, Items) using Optical Character Recognition.
    3.  **AI Verification:** AI analyzes the receipt content to verify legitimacy and categorize it against grant rules.
    4.  **Photo Scraping/Enrichment:** (Feature in progress) AI cross-references merchant data or scrapes additional context to validate the transaction.
    5.  **Approval:** Automatic generation of approval requests for university admin review.

### **Slide 6: Technical Architecture (The Stack)**
*   **Frontend:** React.js, Tailwind CSS, Shadcn/UI (Modern, Responsive, Glassmorphism design).
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB Atlas (Scalable NoSQL storage).
*   **AI Engine:** Google Gemini AI (for natural language processing and insights).
*   **Visualization:** Recharts / OGL (Aurora Effects).

### **Slide 7: Cloud Infrastructure & Deployment**
*   **Hosting:**
    *   **AWS EC2:** Hosts the core Node.js backend and React frontend (served via Nginx/Apache) for reliable, always-on availability.
*   **Serverless Computing:**
    *   **AWS Lambda:** Handles heavy computational tasks like OCR processing and Image Scraping triggers. This ensures the main server remains responsive even during heavy processing loads.
*   **Storage:**
    *   **AWS S3:** Secure storage for uploaded receipt images and generated reports.

### **Slide 8: System Architecture Diagram**
*(Placeholder for a diagram showing: User -> Frontend -> EC2 (Backend) -> MongoDB + Gemini AI + AWS Lambda (OCR))*

### **Slide 9: Live Demo / Screenshots**
*   Showcase the **Landing Page** (Aurora Effect).
*   Showcase the **Dashboard** (Graphs & Stats).
*   Showcase the **"My Groups"** Modal (Expense Splitting).
*   Showcase the **AI Chat** interaction.

### **Slide 10: Future Scope & Conclusion**
*   **Mobile App:** Native iOS/Android versions.
*   **Bank Integration:** Direct API connections (Plaid/Account Aggregators) for auto-debit tracking.
*   **Blockchain:** Immutable ledger for grant audits.
*   **Conclusion:** FinanceGuard AI bridges the gap between simple tracking and intelligent financial management.

---

## 📝 Notes for Speaker
*   Emphasize the **Multi-Agent** aspect as it's a trending topic in AI.
*   When discussing the **Grant Approval** system, highlight how it solves a specific real-world pain point for students, making the project highly relevant to the university context.
*   Mention **AWS Lambda** as a cost-optimization strategy (pay only for compute time used during OCR).
