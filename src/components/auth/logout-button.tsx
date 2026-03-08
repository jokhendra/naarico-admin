"use client";

import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { logout } = useAuth();

  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        logout();
      }}
      className="flex w-full items-center text-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
    >
      <LogOut className="h-4 w-4 mr-2" />
      <span>Sign out</span>
    </button>
  );
} 