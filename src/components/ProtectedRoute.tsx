// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // Make sure useLocation is imported!

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth(); // Corrected: isLoading to loading
  const location = useLocation(); // <--- This line is important for logging the path

  // >>> YOU MUST ADD THESE CONSOLE.LOG STATEMENTS <<<
  console.log(`ProtectedRoute Render for path: ${location.pathname}`);
  console.log(`  - loading: ${loading}`); // Corrected: isLoading to loading
  console.log(`  - isAuthenticated: ${isAuthenticated}`);
  // >>> END OF LOGS TO ADD <<<

  if (loading) {
    // You can render a loading spinner or skeleton here
    return <div>Loading authentication...</div>; // Keep this loading indicator!
  }

  // If not authenticated and not loading, redirect to login
  if (!isAuthenticated) {
    console.log(`ProtectedRoute: Redirecting to /login from ${location.pathname} because not authenticated.`); // Add this specific log too
    return <Navigate to="/login" replace state={{ from: location }} />; // Added state for better redirect handling
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;