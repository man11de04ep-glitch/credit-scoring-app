# Welcome to project
🚀 Smart Credit Scoring System
An AI-powered alternative credit scoring platform designed to promote financial inclusion. This system evaluates creditworthiness using alternative data points like savings patterns, expense ratios (FOIR), and utility consistency, making it ideal for users with no traditional credit history (CIBIL).

✨ Key Features
Alternative Scoring Logic: Uses a weighted-average model based on FOIR, savings-to-income ratio, and financial discipline.

What-if Simulator: Interactive sliders to see how changes in income or expenses affect the credit score in real-time.

Smart Credit Assistant: A multilingual (English/Hindi/Punjabi) chatbot that provides financial advice and explains score factors.

Privacy-First Architecture: All data is processed and stored locally using browser localStorage. No sensitive data is sent to external servers.

Report Generation: Export your credit assessment report directly as a PDF.

Optimized for Performance: Built to run smoothly on low-end devices with as little as 4GB RAM.

🛠️ Tech Stack
Frontend: React.js, TypeScript, Vite

Styling: Tailwind CSS, Lucide Icons

Logic Engine: Custom Rule-based Engine (TypeScript)

Database: Browser LocalStorage (JSON-based persistence)

Deployment: Optimized for local-first execution

📊 Scoring Methodology
The system calculates the final score (out of 900) based on the following weights:

Savings Ratio (35%): Analysis of monthly surplus income.

FOIR (25%): Fixed Obligation to Income Ratio (Repayment capacity).

Stability (20%): Work experience and income consistency.

Financial Buffers (20%): Emergency fund availability and bill payment history.

🚀 Getting Started
To run this project locally, follow these steps:

Clone the repository:

Bash
git clone  https://github.com/man11de04ep-glitch/credit-scoring-app.git
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run dev
Open in browser: Navigate to http://localhost:8080

🛡️ Privacy & Security
This project follows a Zero-Server approach. All financial parameters entered into the dashboard stay within the user's local environment. The "Save & Publish" feature has been intentionally decommissioned to ensure a 100% local-only demonstration, adhering to strict data privacy standards.

🎓 Academic Context
Developed as a Final Year Project for the Master of Computer Applications (MCA) degree .

TODO: Document your project here
