'use client';

import { ReactNode, FormEvent, useState, useEffect, useRef } from 'react';
import { useCsrf } from '@/contexts/CsrfContext';
import { AlertCircle } from 'lucide-react';

interface CsrfProtectedFormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  className?: string;
}

/**
 * A wrapper component for forms that need CSRF protection.
 * Automatically refreshes the CSRF token before submitting the form.
 */
export function CsrfProtectedForm({
  children,
  onSubmit,
  className = '',
}: CsrfProtectedFormProps) {
  const { withCsrfProtection, error: csrfError } = useCsrf();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Prevent default form submission to avoid double submissions
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    
    const preventDefaultSubmit = (e: Event) => {
      e.preventDefault();
    };
    
    form.addEventListener('submit', preventDefaultSubmit);
    
    return () => {
      form.removeEventListener('submit', preventDefaultSubmit);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Use withCsrfProtection to ensure we have a fresh CSRF token
      await withCsrfProtection(async () => {
        await onSubmit(e);
      });
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className}>
      {csrfError && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-2 rounded bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">CSRF token error: {csrfError}</p>
        </div>
      )}
      {children}
    </form>
  );
} 