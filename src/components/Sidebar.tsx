"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Box,
  Gift,
  Home,
  Layers,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Users,
  FileText,
  Archive,
  Tags,
  Image as ImageIcon,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

// Admin-only routes - Full access to all features
const adminRoutes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/users",
    color: "text-violet-500",
  },
  {
    label: "All Stores",
    icon: Store,
    href: "/stores",
    color: "text-cyan-500",
  },
  {
    label: "Brands",
    icon: Archive,
    href: "/brands",
    color: "text-indigo-500",
  },
  {
    label: "Categories",
    icon: Layers,
    href: "/categories",
    color: "text-blue-500",
  },
  {
    label: "Tags",
    icon: Tags,
    href: "/tags",
    color: "text-teal-500",
  },
  {
    label: "All Products",
    icon: Package,
    href: "/products",
    color: "text-pink-700",
  },
  {
    label: "All Orders",
    icon: ShoppingCart,
    href: "/orders",
    color: "text-orange-500",
  },
  {
    label: "Inventory",
    icon: Box,
    href: "/inventory",
    color: "text-emerald-500",
  },
  {
    label: "Deals",
    icon: Tag,
    href: "/deals",
    color: "text-rose-500",
  },
  {
    label: "Promo Banners",
    icon: ImageIcon,
    href: "/promo-banners",
    color: "text-fuchsia-500",
  },
  {
    label: "Reviews",
    icon: Star,
    href: "/reviews",
    color: "text-yellow-500",
  },
  {
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
    color: "text-green-500",
  },
  {
    label: "Logs",
    icon: FileText,
    href: "/logs",
    color: "text-red-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
  },
];

// Seller-specific routes - Limited to seller's own resources
const sellerRoutes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "My Stores",
    icon: Store,
    href: "/seller/stores",
    color: "text-cyan-500",
  },
  {
    label: "My Products",
    icon: Package,
    href: "/products",
    color: "text-pink-700",
  },
  {
    label: "My Orders",
    icon: ShoppingCart,
    href: "/orders",
    color: "text-orange-500",
  },
  {
    label: "My Inventory",
    icon: Box,
    href: "/inventory",
    color: "text-emerald-500",
  },
  {
    label: "Reviews",
    icon: Star,
    href: "/reviews",
    color: "text-yellow-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  className,
  isMobile = false,
  isCollapsed = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, isSeller } = useAuth();

  // Determine which routes to show based on role
  const routes = isAdmin ? adminRoutes : (isSeller ? sellerRoutes : []);
  
  // Update portal title based on role
  const portalTitle = isAdmin ? "Admin Portal" : (isSeller ? "Seller Portal" : "Portal");

  return (
    <div className={cn(
      "flex h-full w-full flex-col overflow-y-auto border-r bg-background",
      isCollapsed ? "items-center" : "w-60 p-4",
      className
    )}>
      <div className={cn(
        "flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <span className="text-xl font-bold">{portalTitle}</span>
        )}
        {isMobile && !isCollapsed && (
          <button onClick={onClose} className="p-2">
            <span className="sr-only">Close sidebar</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-8 flex flex-1 flex-col gap-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={isMobile ? onClose : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <route.icon className={cn("h-5 w-5", route.color)} />
            {!isCollapsed && <span>{route.label}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
} 