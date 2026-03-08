"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useUIStore } from "@/store/ui-store";
import { AuthGuard } from "@/components/AuthGuard";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isSidebarOpen, isCollapsed, toggleSidebar, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    const appName = "All Mart Admin";
    if (!pathname || pathname === "/") return `${appName} | Dashboard`;

    const format = (segment: string) =>
      segment
        .replace(/\[.*?\]/g, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const parts = pathname.split("/").filter(Boolean);
    // Map known sections for nicer titles
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      brands: "Brands",
      categories: "Categories",
      coupons: "Coupons",
      deals: "Deals",
      inventory: "Inventory",
      logs: "Logs",
      orders: "Orders",
      products: "Products",
      reports: "Reports",
      reviews: "Reviews",
      settings: "Settings",
      tags: "Tags",
      users: "Users",
      profile: "Profile",
      auth: "Authentication",
      new: "New",
      view: "View",
      templates: "Templates",
      subcategories: "Subcategories",
      variants: "Variants",
    };

    const readable = parts.map((p) => map[p] || format(p));

    // Prefer first two parts for conciseness, e.g., "Products - New"
    const primary = readable[0] || "Dashboard";
    const secondary = readable[1] && readable[1] !== primary ? ` - ${readable[1]}` : "";
    return `${appName} | ${primary}${secondary}`;
  }, [pathname]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = pageTitle;
    }
  }, [pageTitle]);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className={`hidden md:block ${isCollapsed ? "w-16" : "w-60"}`}>
          <Sidebar isCollapsed={isCollapsed} />
        </div>

        {/* Mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
            <div className="absolute inset-y-0 left-0 h-full w-3/4 max-w-xs">
              <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
} 