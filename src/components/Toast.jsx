import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({
  message,
  type = 'success',
  isVisible = false,
  onClose,
  duration = 4000,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "fixed z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border transform transition-all duration-300 ease-in-out max-w-sm";

    const positionStyles = {
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
      'top-center': 'top-6 left-1/2 transform -translate-x-1/2',
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
    };

    const typeStyles = {
      success: 'bg-green-50/95 border-green-200 text-green-800',
      error: 'bg-red-50/95 border-red-200 text-red-800',
      warning: 'bg-yellow-50/95 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50/95 border-blue-200 text-blue-800'
    };

    return `${baseStyles} ${positionStyles[position]} ${typeStyles[type]} ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[-100%] opacity-0 scale-95'
    }`;
  };

  return (
    <div className={getStyles()}>
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium leading-tight">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors duration-200 ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Hook for managing toast state
export const useToast = () => {
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success', duration = 4000) => {
    setToast({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const ToastComponent = () => (
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
      duration={toast.duration}
    />
  );

  return {
    showToast,
    hideToast,
    ToastComponent
  };
};

export default Toast;