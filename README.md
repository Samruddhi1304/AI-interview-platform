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
- ### 🔐 Login Screen
![Login Screen](https://github.com/user-attachments/assets/f1c6bee9-e287-44ae-9edd-f99b1bb021c8)

- ###📝 Signup Page
![Signup](https://github.com/user-attachments/assets/04f33724-ec56-4bbe-baf9-5b633adea158)

-### ✅Home Screen
![Home](https://github.com/user-attachments/assets/23503879-7179-4a9b-a030-60a7ca61ed72)

-###✅ DashBoard
![Dashboard](https://github.com/user-attachments/assets/3077aef2-a667-49d3-9ba5-8210701c8c19)

-### ✅ Interview setup Screen
![Interviewsetup](https://github.com/user-attachments/assets/8130efc9-063b-405e-b3e0-c52dfb6bf552)

-### ✅ Interview Screen
![Interviewscreen](https://github.com/user-attachments/assets/25ab092e-eb5e-4a44-b84f-908389d705a7)

-### ✅ Interview results
![Interviewresults](https://github.com/user-attachments/assets/3a43b2c7-17d3-416e-bc24-37f2c5c1281a)

-### ✅ Detailed Question Explaination
![DetailedQuestionExp](https://github.com/user-attachments/assets/c3f12879-076b-4d8d-9ff0-3457df401f13)

-### ✅ Detailed Downloaded report
![Detailedreport](https://github.com/user-attachments/assets/58b7e106-6a36-4058-86f2-dc5724dd26ee)

-### ✅ Custom Interview Scheduling
![customSchedule](https://github.com/user-attachments/assets/7863cca6-2356-4c96-8223-037c9ebab731)

-### ✅ Interview Scheduling
![Interviewsch](https://github.com/user-attachments/assets/bf2f3b2a-2f47-44f0-9c10-a0320e679595)
![Interviewassign](https://github.com/user-attachments/assets/61e26654-a1d8-44cb-8167-1253eb48b23f)

-### ✅ Deployment link
## 🚀 Live Demo

[Click here to view the live app](https://ai-interview-platform-1-zqe0.onrender.com)
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

