// frontend/src/context/AuthContext.ts
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser, // Alias User type from Firebase
} from 'firebase/auth';
import { app } from '../services/firebase'; // Ensure 'app' is exported from firebase.ts

interface AppUser {
  id: string;
  name?: string | null; // Name might be optional from Firebase initially
  email: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Set to true initially while checking auth state
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth(app); // Get the Firebase Auth instance

  // Effect to listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName, // Display name might not be set during initial registration
          email: firebaseUser.email || '',
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false); // Auth state checked, stop loading
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // user state will be updated by onAuthStateChanged listener
    } catch (err: any) {
      console.error('Firebase Login Error:', err.code, err.message);
      setError(err.message || 'Login failed. Please check your credentials.');
      setUser(null); // Ensure user is null on login failure
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Optionally update user profile with name if desired
      // await updateProfile(userCredential.user, { displayName: name });
      // user state will be updated by onAuthStateChanged listener
      // For now, let's manually set it with name after creation,
      // as display name isn't automatically populated
      setUser({
        id: userCredential.user.uid,
        name: name,
        email: userCredential.user.email || '',
      });

    } catch (err: any) {
      console.error('Firebase Register Error:', err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed.');
      }
      setUser(null); // Ensure user is null on registration failure
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      // user state will be updated by onAuthStateChanged listener
    } catch (err: any) {
      console.error('Firebase Logout Error:', err.message);
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
    error,
  };

  // Only render children when authentication state has been checked
  if (loading) {
      return <div>Loading authentication...</div>; // Or a proper loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};