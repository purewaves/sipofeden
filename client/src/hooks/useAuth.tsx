import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface Admin {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isValidating: boolean;
  login: (admin: Admin) => void;
  logout: () => void;
  validateSession: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

// Create context with default values to avoid undefined checks
const AuthContext = createContext<AuthContextType>({
  admin: null,
  isAuthenticated: false,
  isValidating: false,
  login: () => {},
  logout: () => {},
  validateSession: async () => false,
  refreshSession: async () => {}
});

// Enhanced Auth Provider with robust session management
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from localStorage
  const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('admin') : null;
  const initialAdmin = storedAdmin ? JSON.parse(storedAdmin) : null;
  
  // State management
  const [admin, setAdmin] = useState<Admin | null>(initialAdmin);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialAdmin);
  const [isValidating, setIsValidating] = useState(false);
  
  // Keep a last checked timestamp to prevent excessive validation
  const lastValidatedRef = useRef<number>(0);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Enhanced login function
  const login = useCallback((adminData: Admin) => {
    // Store admin data in localStorage for persistence across page refreshes
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAuthenticated(true);
    lastValidatedRef.current = Date.now();
    
    // Set up session refresh
    scheduleSessionRefresh();
  }, []);

  // Function to schedule periodic session refresh
  const scheduleSessionRefresh = useCallback(() => {
    // Clear any existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Set up new timeout - refresh every 5 minutes
    sessionTimeoutRef.current = setTimeout(() => {
      refreshSession();
    }, 5 * 60 * 1000); // 5 minutes
  }, []);

  // Robust logout function
  const logout = useCallback(async () => {
    try {
      // Clear any session refresh timer
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      // Make API request to clear server-side session
      await apiRequest('POST', '/api/admin/logout', {});
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local state even if API fails
      localStorage.removeItem('admin');
      setAdmin(null);
      setIsAuthenticated(false);
      navigate('/admin');
    }
  }, [navigate]);

  // Silent session refresh function
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!admin) return;
    
    try {
      // Make a lightweight request to keep session alive
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Session-Refresh': 'true'
        }
      });
      
      if (response.ok) {
        // Session is still valid, update last validated time
        lastValidatedRef.current = Date.now();
        
        // Schedule next refresh
        scheduleSessionRefresh();
      } else if (response.status === 440 || response.status === 401) {
        // Session expired, logout
        console.warn('Session expired during refresh');
        
        // Show toast notification
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive"
        });
        
        // Clear state
        localStorage.removeItem('admin');
        setAdmin(null);
        setIsAuthenticated(false);
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // Don't logout automatically on network errors
    }
  }, [admin, navigate, toast, scheduleSessionRefresh]);

  // Enhanced session validation with specific error handling
  const validateSession = useCallback(async (): Promise<boolean> => {
    // If no admin, session is invalid
    if (!admin) return false;
    
    // If recently validated (within 10 seconds), don't revalidate
    // This prevents excessive validation requests during rapid navigation
    const now = Date.now();
    if (now - lastValidatedRef.current < 10000) {
      return true;
    }
    
    setIsValidating(true);
    
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Session-Validate': 'true'
        }
      });
      
      setIsValidating(false);
      
      if (response.ok) {
        // Session is valid
        lastValidatedRef.current = now;
        scheduleSessionRefresh();
        return true;
      } else if (response.status === 440) {
        // Special case: session expired
        console.warn('Session expired during validation');
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        
        // Clear auth state
        localStorage.removeItem('admin');
        setAdmin(null);
        setIsAuthenticated(false);
        navigate('/admin');
        return false;
      } else if (response.status === 401) {
        // Authentication failed
        console.log('Authentication failed during validation');
        localStorage.removeItem('admin');
        setAdmin(null);
        setIsAuthenticated(false);
        return false;
      }
      
      // Other error
      console.log('Session validation failed with status:', response.status);
      return false;
    } catch (error) {
      console.error('Error validating session:', error);
      setIsValidating(false);
      // Don't reset auth state on network errors
      return false;
    }
  }, [admin, navigate, toast, scheduleSessionRefresh]);

  // Effect to validate session and set up refresh on mount
  useEffect(() => {
    if (admin) {
      // Initial validation on mount
      validateSession().then(isValid => {
        if (isValid) {
          scheduleSessionRefresh();
        }
      });
      
      // Cleanup function to clear timeout
      return () => {
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
      };
    }
  }, [admin, validateSession, scheduleSessionRefresh]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        isValidating,
        login,
        logout,
        validateSession,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);
