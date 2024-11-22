import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const toastVariants = cva(
  'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:top-4 md:w-full md:max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-green-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface Toast extends VariantProps<typeof toastVariants> {
  id: string;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 md:top-0 md:bottom-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div className={toastVariants({ variant: toast.variant })}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{toast.title}</h3>
          {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
        </div>
        <button onClick={onClose} className="text-foreground/50 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Example usage
export const ToastExample: React.FC = () => {
  const { addToast } = useToast();

  return (
    <div className="space-y-2">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() =>
          addToast({ title: 'Default Toast', description: 'This is a default toast message' })
        }
      >
        Show Default Toast
      </button>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() =>
          addToast({
            title: 'Error Toast',
            description: 'This is an error message',
            variant: 'destructive',
          })
        }
      >
        Show Error Toast
      </button>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() =>
          addToast({
            title: 'Success Toast',
            description: 'This is a success message',
            variant: 'success',
          })
        }
      >
        Show Success Toast
      </button>
    </div>
  );
};

// Wrap your app with ToastProvider
export const toast: React.FC = () => {
  return (
    <ToastProvider>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Toast Example</h1>
        <ToastExample />
      </div>
    </ToastProvider>
  );
};

export default toast;
