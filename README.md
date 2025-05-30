# AI-Powered Interview Platform

An intelligent MERN-stack platform for conducting mock interviews, providing real-time feedback,
and generating personalized performance reports using Google Gemini AI and Firebase. Deployed on Render,
the platform offers a seamless experience from interview scheduling to feedback analysis.

---

## 📌 Problem Statement

Preparing for technical interviews often lacks structured feedback and realism.
Traditional methods like self-practice or generic interview question banks fail to simulate real-world scenarios and do not provide personalized growth insights.

---

## 💡 Approach & Solution

We designed an AI-Powered Interview Platform to simulate mock interviews, evaluate responses in real time,
and generate detailed feedback reports. The system leverages Google Gemini AI for dynamic question generation and answer evaluation,
Firebase for secure user management and data storage, and is fully built on the MERN stack for scalability and performance.

---

## 🚀 Features

- 👤 User Authentication & Secure Login (Firebase Auth)
- 📅 Interview Scheduling with Automated Email Confirmation
- 🤖 AI-Powered Question Generation (Gemini 1.5 Flash)
- 🗣️ Real-Time Answer Evaluation & Scoring
- 📊 Personalized Feedback and Improvement Tips
- 📄 Downloadable PDF Interview Reports (PDFKit)
- 📈 Dashboard with Interview History & Stats
- 🌐 Fully Responsive UI with React + Tailwind CSS

---

## 🧩 Tech Stack

| Layer         | Technology Used |
|---------------|------------------|
| **Frontend**  | React.js, Tailwind CSS |
| **Backend**   | Node.js, Express.js, pdfkit, connect-history-api-fallback |
| **Database**  | Firebase Firestore |
| **AI Model**  | Google Gemini AI (gemini-1.5-flash) |
| **Auth**      | Firebase Authentication |
| **Email API** | SendGrid |
| **Hosting**   | Render (Frontend + Backend) |
| **Version Control** | Git & GitHub |

---

## 🔍 Breakdown of "What Used Where"

### 1. Frontend (User Interface & Experience)
- **React.js**: SPA architecture, dynamic components for dashboard, interview interface, feedback, etc.
- **Tailwind CSS**: Utility-first styling framework for consistent and responsive UI.

### 2. Backend (API & Logic)
- **Node.js**: JavaScript runtime for server-side logic.
- **Express.js**: REST API development (`/api/schedule-interview`, `/api/interview/evaluate`).
- **connect-history-api-fallback**: Fix for routing issues in SPA deployments.
- **pdfkit**: Generates PDF reports of feedback for download.

### 3. Database (Data Storage)
- **Firebase Firestore**:
  - Stores interview data
  - Tracks user progress
  - Holds AI-generated content

### 4. AI Integration
- **Google Gemini AI**:
  - Question generation
  - Answer evaluation
  - Personalized feedback & study suggestions

### 5. Authentication
- **Firebase Auth**: Secure registration, login, and session management.

### 6. Email Communication
- **SendGrid**: Sends email confirmations post-interview scheduling.

### 7. Deployment
- **Render**:
  - Backend deployed as Web Service
  - Frontend served as Static Site
- **GitHub**: Source control and version tracking

---

## 📸 Screenshots

> _Add screenshots :_
- ### 🔐 Login Screen
![Login Screen](https://user-images.githubusercontent.com/12345678/abcdefg-login.png)

- ###📝 Signup Page
![Signup](https://github.com/user-attachments/assets/04f33724-ec56-4bbe-baf9-5b633adea158)

- Dashboard with Interview History
- Interview Interface (Question/Answer)
- Feedback Summary
- PDF Report Preview

---

## ⚙️ Run Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-interview-platform.git
cd ai-interview-platform
Set up frontend
cd client
npm install
npm run dev
setup Backend
cd server
npm install
npm run dev

