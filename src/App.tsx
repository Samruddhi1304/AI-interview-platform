// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recommendations from './pages/Recommendations';
import Schedule from './pages/Schedule';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession'; // This is the component for active interviews
import Results from './pages/Results'; // This is the component for completed interview results
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
              {/* CORRECTED ROUTE: This path should match what the Dashboard is linking to for "Resume" */}
              {/* It was previously '/interview/session/:id' which is correct. */}
              {/* The issue was the Dashboard was linking to '/interview/:id' */}
              {/* So, we keep this route as is, and the Dashboard link was fixed to match this. */}
              <Route path="/interview/session/:id" element={<InterviewSession />} />
              {/* This route is for displaying results of COMPLETED interviews */}
              <Route path="/results/:id" element={<Results />} />
              {/* Other protected routes */}
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/schedule" element={<Schedule />} />
            </Route>

            {/* Fallback for any unmatched routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;