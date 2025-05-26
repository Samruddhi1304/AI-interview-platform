// frontend/src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgC7oXFYOvaW27MqlU1dtqMMOppNEwxKw",
  authDomain: "ai-interview-bf496.firebaseapp.com",
  projectId: "ai-interview-bf496",
  storageBucket: "ai-interview-bf496.firebasestorage.app",
  messagingSenderId: "225820613828",
  appId: "1:225820613828:web:e08da140d0fac595313d91",
  // Removed measurementId as it's for Analytics which we're not using here
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Get Firebase Authentication service
const auth = getAuth(app);

// Connect to Firebase Auth Emulator during local development
if (process.env.NODE_ENV === 'development') {
    console.log("Connecting to Firebase Auth Emulator...");
    connectAuthEmulator(auth, "http://127.0.0.1:9099"); // Ensure this matches your emulator's Auth port
}

// Export the initialized Firebase app and auth instance
export { app, auth };