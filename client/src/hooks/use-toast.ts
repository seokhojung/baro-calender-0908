'use client';

import { toast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const showToast = ({ title, description, variant = 'default', duration }: ToastProps) => {
    if (variant === 'destructive') {
      toast.error(title || description || 'An error occurred', {
        description: title ? description : undefined,
        duration,
      });
    } else {
      toast.success(title || description || 'Success', {
        description: title ? description : undefined,
        duration,
      });
    }
  };

  return {
    toast: showToast,
    dismiss: () => toast.dismiss(),
  };
}

export { toast };