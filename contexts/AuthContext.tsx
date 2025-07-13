import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/utils/notifications';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await supabaseService.getCurrentUser();
      setUser(userProfile);
      
      // Register device token for push notifications
      if (userProfile) {
        await notificationService.registerDeviceToken(userProfile.id);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { user: authUser } = await supabaseService.signIn(email, password);
      
      if (authUser) {
        await loadUserProfile(authUser.id);
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await supabaseService.signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
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