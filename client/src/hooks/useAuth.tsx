import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

// Create context with default values to avoid undefined checks
const AuthContext = createContext<AuthContextType>({
  admin: null,
  isAuthenticated: false,
  isValidating: false,
  login: () => {},
  logout: () => {},
  validateSession: async () => false
});

// Create a simple Auth Provider without complex validation logic
export function AuthProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const storedAdmin = localStorage.getItem('admin');
  const initialAdmin = storedAdmin ? JSON.parse(storedAdmin) : null;
  
  // Basic state management
  const [admin, setAdmin] = useState<Admin | null>(initialAdmin);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialAdmin);
  const [isValidating, setIsValidating] = useState(false);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Simple login function
  const login = (adminData: Admin) => {
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAuthenticated(true);
  };

  // Simple logout function
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout', {});
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    localStorage.removeItem('admin');
    setAdmin(null);
    setIsAuthenticated(false);
    navigate('/admin');
  };

  // Simplified session validation
  const validateSession = async (): Promise<boolean> => {
    if (!admin) return false;
    
    setIsValidating(true);
    
    try {
      const response = await fetch('/api/admin/profile', {
        credentials: 'include'
      });
      
      setIsValidating(false);
      
      if (!response.ok) {
        console.log('Session validation failed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      setIsValidating(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        isValidating,
        login,
        logout,
        validateSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Simple hook to use the auth context
export const useAuth = () => useContext(AuthContext);
