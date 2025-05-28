// frontend/src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  User as FirebaseUser, // Alias User as FirebaseUser to avoid confusion if you have another 'User' type
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
} from 'firebase/auth';

import { auth } from '../services/firebase'; 


interface AppUser {
  id: string;
  name?: string | null; 
  email: string;
}


interface AuthContextType {
  user: AppUser | null; // Your app's simplified user object
  firebaseUser: FirebaseUser | null; // The full Firebase User object for more details if needed
  isAuthenticated: boolean; // Convenience flag to check if a user is logged in
  loading: boolean; // To indicate if authentication state is still being determined
  login: (email: string, password: string) => Promise<void>; // Function to handle user login
  logout: () => Promise<void>; // Function to handle user logout
  register: (email: string, password: string) => Promise<void>; // <--- New function for user registration
}

// Create the AuthContext
// It's initialized with 'undefined' and a check in useAuth ensures it's used within a Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode; // ReactNode allows any valid React child (elements, components, etc.)
}

// The AuthProvider component that wraps your application
// It manages the authentication state and provides it to its children
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null); // Stores your simplified app user
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null); // Stores the raw Firebase User object
  const [loading, setLoading] = useState(true); // Tracks if the initial authentication state is being loaded

  // useEffect to listen for Firebase authentication state changes
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function that should be called on cleanup
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // If a user is signed in (fbUser is not null)
        setFirebaseUser(fbUser); // Store the full Firebase User object
        setUser({ // Create your simplified AppUser object
          id: fbUser.uid,
          name: fbUser.displayName, // displayName might be null initially for new registrations
          email: fbUser.email || '', // email should always be available if authenticated via email/password
        });
      } else {
        // If no user is signed in (fbUser is null)
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false); // Authentication state has been determined
    });

    // Cleanup function: unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs only once on mount

  // Function to handle user login
  const login = async (email: string, password: string) => {
    setLoading(true); // Set loading state while login is in progress
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will automatically update the user state upon successful login
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error; // Re-throw the error so calling components can handle specific error messages
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Function to handle user logout
  const logout = async () => {
    setLoading(true); // Set loading state while logout is in progress
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will automatically update the user state upon successful logout
    } catch (error) {
      console.error('AuthContext: Logout failed:', error);
      throw error; // Re-throw the error
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Function to handle new user registration
  const register = async (email: string, password: string) => {
    setLoading(true); // Set loading state while registration is in progress
    try {
      // createUserWithEmailAndPassword returns a UserCredential, but we just need the side effect
      // that it registers the user and automatically logs them in.
      await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle updating the user state as they are now logged in
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      throw error; // Re-throw the error for specific handling in the UI (e.g., "email already in use")
    } finally {
      setLoading(false); // Reset loading state
    }
  };


  // The value object that will be provided to consumers of the context
  const value = {
    user,
    firebaseUser,
    isAuthenticated: !!user, // true if user is not null, false otherwise
    loading,
    login,
    logout,
    register, // <--- Make the new register function available
  };

  // While loading, you might want to show a global loading indicator
  if (loading) {
    return <div>Loading application...</div>;
  }

  // Render the children components, providing the auth context value
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Ensure the hook is used within an AuthProvider to prevent 'undefined' context
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};