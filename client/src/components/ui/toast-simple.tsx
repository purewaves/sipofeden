import React from 'react';

// A simplified toast container component without circular dependencies
export function ToastContainer({ 
  children 
}: { 
  children?: React.ReactNode 
}) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 max-w-md">
      {children}
    </div>
  );
}

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  onClose?: () => void;
}

export function SimpleToast({ 
  title, 
  description, 
  variant = 'default', 
  onClose 
}: ToastProps) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const variantClasses = {
    default: 'bg-white text-gray-800 border-gray-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  return (
    <div className={`rounded-md shadow-md p-4 border animate-in slide-in-from-right-full ${variantClasses[variant]}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      {description && <div className="text-sm opacity-90">{description}</div>}
      <button 
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

// A simplified context and hook for toast management
type ToastContextType = {
  addToast: (toast: Omit<ToastProps, 'onClose'>) => string;
  removeToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, onClose: () => removeToast(id) }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <SimpleToast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useSimpleToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useSimpleToast must be used within a ToastProvider');
  }
  return context;
}

// Simple component that can be used as drop-in replacement for the original Toaster
export function SimpleToaster() {
  return null; // The actual toasts are rendered by the ToastProvider
} 