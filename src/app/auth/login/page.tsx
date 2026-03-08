"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCsrf } from "@/hooks/use-csrf";
import { CsrfProtectedForm } from "@/components/form/CsrfProtectedForm";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const { refreshCsrfToken } = useCsrf();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  console.log('Rendering admin login page');
  
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Check if redirected from successful registration
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Registration successful! Please sign in with your new account.");
    }
  }, [searchParams]);
  
  // Set error message if auth error exists
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Force refresh CSRF token when component mounts
  useEffect(() => {
    refreshCsrfToken(true).catch(err => {
      console.warn('Failed to refresh CSRF token on mount:', err);
    });
  }, [refreshCsrfToken]);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "", // Pre-fill with test admin email
      password: "",
    },
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Prevent default form submission as we're using React Hook Form
    e.preventDefault();
    
    // Get form values
    const values = form.getValues();
    
    setError(null);
    setSuccessMessage(null);
    try {
      setIsLoading(true);
      console.log('Logging in with:', values.email);
      
      // Force refresh CSRF token before login attempt
      try {
        await refreshCsrfToken(true);
        console.log('Refreshed CSRF token before login');
      } catch (csrfError) {
        console.warn('CSRF token refresh failed, continuing anyway:', csrfError);
      }
      
      // The CSRF token is already handled by CsrfProtectedForm
      await login(values.email, values.password);
      
      // Redirect is handled in the auth provider
    } catch (error: any) {
      console.error("Login failed:", error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError("Invalid credentials. Please check your email and password.");
      } else if (error.response?.status === 403) {
        setError("Access denied. You must be an admin or seller to log in.");
      } else {
        setError(error?.message || "An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-44 mb-4">
          <Image src="/images/logo/naarico-logo.jpeg" alt="Naarico" fill className="object-contain" priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Naarico
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Suits & Sarees
        </p>
        <h2 className="mt-6 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Sign In
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Admin & Seller Portal
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <Form {...form}>
        <CsrfProtectedForm onSubmit={onSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    disabled={isLoading || authLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    disabled={isLoading || authLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link 
                href="/auth/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || authLoading}
          >
            {isLoading || authLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CsrfProtectedForm>
      </Form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Naarico
        </h1>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Loading...
        </h2>
      </div>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
} 