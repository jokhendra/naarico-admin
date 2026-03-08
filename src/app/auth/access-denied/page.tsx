"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function AccessDeniedPage() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">
          Access Denied
        </h1>
        
        <div className="my-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            You do not have permission to access the admin panel.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            This area is restricted to administrative users only.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Button 
            variant="outline" 
            onClick={logout}
          >
            Sign Out
          </Button>
          
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 