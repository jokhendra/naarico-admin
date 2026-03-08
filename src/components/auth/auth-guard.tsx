"use client";

import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

// This is a placeholder authentication check
// In a real application, this would validate user session from cookies/localStorage
// or make an API call to validate the user session
const isAuthenticated = () => {
  // For now, just check if we have a user item in localStorage
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("user");
  }
  return false;
};

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isSeller, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check on auth pages
    if (pathname.startsWith("/auth/")) {
      setIsChecking(false);
      return;
    }

    // Only redirect after auth state is loaded
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      } else if (!isAdmin && !isSeller) {
        // Authenticated but not an admin or seller (only USER role), show access denied
        router.push('/auth/access-denied');
      } else {
        // Admin or Seller is authenticated, allow access
        setIsChecking(false);
      }
    }
  }, [pathname, router, isAuthenticated, isAdmin, isSeller, isLoading]);

  // Show loading state while checking authentication
  if ((isChecking || isLoading) && !pathname.startsWith("/auth/")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Render children only if user is authenticated and admin, or on auth pages
  return <>{children}</>;
} 