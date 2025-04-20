import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Function to validate the session with the backend
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!admin) return false;
    
    setIsValidating(true);
    try {
      // Try to fetch admin profile to validate the session
      const response = await fetch('/api/admin/profile', {
        credentials: 'include' // Important for cookies/session
      });
      
      if (response.ok) {
        // Session is valid
        const profileData = await response.json();
        
        // Update admin data with latest from server
        setAdmin(profileData);
        setIsAuthenticated(true);
        localStorage.setItem('admin', JSON.stringify(profileData));
        return true;
      } else if (response.status === 440 || response.status === 401) {
        // Session expired or unauthorized
        console.log('Session expired or unauthorized, logging out');
        // Clear authentication state
        setAdmin(null);
        setIsAuthenticated(false);
        localStorage.removeItem('admin');
        
        // Only show toast if this was an active session
        if (isAuthenticated) {
          toast({
            title: "Session expired",
            description: "Please log in again",
            variant: "destructive"
          });
          
          // Redirect to login page
          navigate('/admin');
        }
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [admin, isAuthenticated, toast, navigate]);
  
  // Function to handle API errors related to authentication
  const handleApiError = useCallback((error: any) => {
    // Check if the error is a session expiration (440) or unauthorized (401)
    if (error?.message?.includes('440:') || error?.message?.includes('401:')) {
      console.log('Authentication error detected:', error.message);
      
      // Force logout and redirection
      setAdmin(null);
      setIsAuthenticated(false);
      localStorage.removeItem('admin');
      
      toast({
        title: "Session expired",
        description: "Please log in again",
        variant: "destructive"
      });
      
      navigate('/admin');
      return true;
    }
    return false;
  }, [toast, navigate]);

  // Check for saved auth on mount and validate session
  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    if (savedAdmin) {
      try {
        const parsedAdmin = JSON.parse(savedAdmin);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
        
        // Validate the session immediately to ensure it's still valid
        validateSession().catch(console.error);
      } catch (error) {
        // If parsing fails, clear the localStorage
        localStorage.removeItem('admin');
      }
    }
    
    // Set up global error handler for fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      try {
        const response = await originalFetch(input, init);
        
        // Check for authentication errors
        if (response.status === 440 || 
           (response.status === 401 && String(input).includes('/api/admin'))) {
          
          // Don't handle errors for the login endpoint itself
          if (!String(input).includes('/api/admin/login')) {
            setAdmin(null);
            setIsAuthenticated(false);
            localStorage.removeItem('admin');
            
            toast({
              title: "Session expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive"
            });
            
            navigate('/admin');
          }
        }
        
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    };
    
    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [validateSession, handleApiError, toast, navigate]);

  // Log in function
  const login = (adminData: Admin) => {
    setAdmin(adminData);
    setIsAuthenticated(true);
    // Save to localStorage for persistence
    localStorage.setItem('admin', JSON.stringify(adminData));
  };

  // Log out function - now also clears the session on the server
  const logout = async () => {
    // First try to logout on the server to clear the session
    try {
      await apiRequest('POST', '/api/admin/logout', {});
    } catch (error) {
      console.error('Error logging out on server:', error);
      // Continue with client-side logout even if server logout fails
    }
    
    // Clear client state
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin');
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
