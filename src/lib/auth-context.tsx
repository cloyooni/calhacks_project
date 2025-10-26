import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateGoogleAuthUrl } from './google-oauth';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'email' | 'google';
}

interface StoredUser {
  email: string;
  password: string;
  name: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
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
        provider: 'email'
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
        name
      };
      
      storeUser(newUser);
      
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        provider: 'email'
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

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signInWithGoogle,
      signOut,
      signUp
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