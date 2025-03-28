'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const toastVariants = cva(
  'fixed z-50 shadow-lg rounded-lg p-4 transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default:
          'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
        destructive: 'bg-red-600 text-white border border-red-700',
        success: 'bg-green-600 text-white border border-green-700',
      },
      position: {
        topRight: 'top-4 right-4',
        bottomRight: 'bottom-4 right-4',
        bottomLeft: 'bottom-4 left-4',
        topLeft: 'top-4 left-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'topRight',
    },
  },
);

export interface Toast extends VariantProps<typeof toastVariants> {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  position?: 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft';
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

  // Group toasts by position
  const groupedToasts = toasts.reduce<Record<string, Toast[]>>((acc, toast) => {
    const position = toast.position || 'topRight';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-50 flex flex-col gap-2 max-w-sm w-full ${
            position === 'topRight'
              ? 'top-4 right-4 items-end'
              : position === 'bottomRight'
                ? 'bottom-4 right-4 items-end'
                : position === 'bottomLeft'
                  ? 'bottom-4 left-4 items-start'
                  : 'top-4 left-4 items-start'
          }`}
        >
          {positionToasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      ))}
    </>
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
    <div
      className={toastVariants({ variant: toast.variant })}
      style={{ width: '100%', maxWidth: '380px' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-2">
          <h3 className="font-semibold text-sm">{toast.title}</h3>
          {toast.description && <p className="text-sm mt-1 opacity-90">{toast.description}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Utility function for easier toast creation
export const toast = {
  default: (props: Omit<Toast, 'id' | 'variant'>) => {
    const { addToast } = useToast();
    addToast({ ...props, variant: 'default' });
  },
  success: (props: Omit<Toast, 'id' | 'variant'>) => {
    const { addToast } = useToast();
    addToast({ ...props, variant: 'success' });
  },
  error: (props: Omit<Toast, 'id' | 'variant'>) => {
    const { addToast } = useToast();
    addToast({ ...props, variant: 'destructive' });
  },
};
