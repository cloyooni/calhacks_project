import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { generateGoogleAuthUrl } from './google-oauth';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'email' | 'google';
  role?: 'clinician' | 'patient';
  hasCompletedOnboarding?: boolean;
}

interface StoredUser {
  email: string;
  password: string;
  name: string;
  id: string;
  role?: 'clinician' | 'patient';
  hasCompletedOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  setUserRole: (role: 'clinician' | 'patient') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = localStorage.getItem('trialflow_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('trialflow_user');
      }
    }
    setIsLoading(false);
  }, []);

  const getStoredUsers = (): StoredUser[] => {
    const stored = localStorage.getItem('trialflow_users');
    return stored ? JSON.parse(stored) : [];
  };

  const storeUser = (userData: StoredUser) => {
    const users = getStoredUsers();
    const existingIndex = users.findIndex(u => u.email === userData.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = userData;
    } else {
      users.push(userData);
    }
    
    localStorage.setItem('trialflow_users', JSON.stringify(users));
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Validate credentials against stored users
      const users = getStoredUsers();
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      const user: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        provider: 'email',
        role: foundUser.role,
        hasCompletedOnboarding: foundUser.hasCompletedOnboarding
      };
      
      setUser(user);
      localStorage.setItem('trialflow_user', JSON.stringify(user));
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Generate Google OAuth URL and redirect
      const googleAuthUrl = generateGoogleAuthUrl();
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Check if user already exists
      const users = getStoredUsers();
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }
      
      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Create new user
      const newUser: StoredUser = {
        id: Date.now().toString(),
        email,
        password,
        name,
        hasCompletedOnboarding: false
      };
      
      storeUser(newUser);
      
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        provider: 'email',
        hasCompletedOnboarding: false
      };
      
      setUser(user);
      localStorage.setItem('trialflow_user', JSON.stringify(user));
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('trialflow_user');
  };

  const setUserRole = (role: 'clinician' | 'patient') => {
    if (user) {
      console.log('Setting user role:', role);
      const updatedUser = { ...user, role, hasCompletedOnboarding: true };
      setUser(updatedUser);
      localStorage.setItem('trialflow_user', JSON.stringify(updatedUser));
      console.log('User role updated:', updatedUser);
    } else {
      console.error('Cannot set user role: no user logged in');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      setUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}