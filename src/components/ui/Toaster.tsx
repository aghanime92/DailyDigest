import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 right-0 p-4 z-50 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 }
};

const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />
};

const toastClasses = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50'
};

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <motion.div
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toastVariants}
      transition={{ duration: 0.2 }}
      className={`mb-3 rounded-lg border shadow-sm ${toastClasses[toast.variant || 'info']}`}
    >
      <div className="flex p-4">
        <div className="flex-shrink-0">
          {toastIcons[toast.variant || 'info']}
        </div>
        <div className="ml-3 flex-1">
          {toast.title && (
            <h3 className="text-sm font-medium text-gray-900">{toast.title}</h3>
          )}
          {toast.description && (
            <div className="mt-1 text-sm text-gray-600">{toast.description}</div>
          )}
        </div>
        <button
          type="button"
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={onRemove}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}