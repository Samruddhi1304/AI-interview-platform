// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // <--- Import Navigate here

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute'; // <--- Import ProtectedRoute

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import Results from './pages/Results';
import NotFound from './pages/NotFound';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes - These will only render if isAuthenticated is true and not loading */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/interview/setup" element={<InterviewSetup />} />
              <Route path="/interview/session/:id" element={<InterviewSession />} /> {/* Note: Ensure this matches your backend's interviewId parameter */}
              <Route path="/results/:id" element={<Results />} />
            </Route>

            {/* Fallback for any unmatched routes - Redirect to dashboard if logged in, otherwise login */}
            {/* This should probably come after all other routes */}
            <Route path="*" element={<NotFound />} /> {/* Or redirect to dashboard if authenticated */}
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;