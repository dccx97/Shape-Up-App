import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'auth_users_v1';
const STORAGE_KEY_ACTIVE = 'auth_active_user_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    const activeUserId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (activeUserId) {
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
      const foundUser = users.find(u => u.id === activeUserId);
      if (foundUser) {
        setUser(foundUser);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(STORAGE_KEY_ACTIVE, foundUser.id);
    setUser(foundUser);
  };

  const signUp = async (name: string, email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password // In a real app, never store plain text passwords. This is a local mock.
    };

    const newUsers = [...users, newUser];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
    localStorage.setItem(STORAGE_KEY_ACTIVE, newUser.id);
    
    setUser(newUser);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    
    if (!users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('No account found with this email address');
    }
    
    // In our mock, we just pretend an email was sent.
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, resetPassword, isLoading }}>
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
