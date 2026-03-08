# Admin Panel Multi-Tenancy Implementation

## Overview

Transform the admin panel from ADMIN-only to support both ADMIN and SELLER roles with appropriate UI, navigation, and feature access based on user role.

## Core Authentication & RBAC Updates

### 1. Update AuthGuard for Multi-Role Support

**File:** `e-commerce-admin/src/components/auth/auth-guard.tsx`

Replace line 40-42 (currently redirects non-admins):

```typescript
// OLD: else if (!isAdmin) { router.push('/auth/access-denied'); }

// NEW: Allow both ADMIN and SELLER
else if (!isAdmin && !isSeller) {
  // Only USER role gets access denied
  router.push('/auth/access-denied');
} else {
  // Admin or Seller is authenticated, allow access
  setIsChecking(false);
}
```

### 2. Add isSeller to useAuth Hook

**File:** `e-commerce-admin/src/hooks/use-auth.tsx`

Add isSeller check (line 29-30):

```typescript
const isAdmin = context.user?.role === 'ADMIN';
const isSeller = context.user?.role === 'SELLER';  // ADD THIS

return {
  ...context,
  isAdmin,
  isSeller,  // ADD THIS
  hasPermission,
};
```

Update interface (line 15):

```typescript
interface UseAuthReturn {
  // ... existing fields
  isAdmin: boolean;
  isSeller: boolean;  // ADD THIS
}
```

## Navigation & Sidebar Updates

### 3. Create Role-Based Sidebar Routes

**File:** `e-commerce-admin/src/components/Sidebar.tsx`

Replace the hardcoded routes array (lines 24-109) with role-based routes:

```typescript
import { useAuth } from "@/hooks/use-auth";
import { Store } from "lucide-react";

// Admin-only routes
const adminRoutes = [
  { label: "Dashboard", icon: Home, href: "/dashboard", color: "text-sky-500" },
  { label: "Users", icon: Users, href: "/users", color: "text-violet-500" },
  { label: "All Stores", icon: Store, href: "/stores", color: "text-cyan-500" },
  { label: "Brands", icon: Archive, href: "/brands", color: "text-indigo-500" },
  { label: "Categories", icon: Layers, href: "/categories", color: "text-blue-500" },
  { label: "Tags", icon: Tags, href: "/tags", color: "text-teal-500" },
  { label: "All Products", icon: Package, href: "/products", color: "text-pink-700" },
  { label: "All Orders", icon: ShoppingCart, href: "/orders", color: "text-orange-500" },
  { label: "Inventory", icon: Box, href: "/inventory", color: "text-emerald-500" },
  { label: "Deals", icon: Tag, href: "/deals", color: "text-rose-500" },
  { label: "Promo Banners", icon: ImageIcon, href: "/promo-banners", color: "text-fuchsia-500" },
  { label: "Reviews", icon: Star, href: "/reviews", color: "text-yellow-500" },
  { label: "Reports", icon: BarChart3, href: "/reports", color: "text-green-500" },
  { label: "Logs", icon: FileText, href: "/logs", color: "text-red-500" },
  { label: "Settings", icon: Settings, href: "/settings", color: "text-gray-500" },
];

// Seller-specific routes
const sellerRoutes = [
  { label: "Dashboard", icon: Home, href: "/dashboard", color: "text-sky-500" },
  { label: "My Store", icon: Store, href: "/seller/my-store", color: "text-cyan-500" },
  { label: "My Products", icon: Package, href: "/seller/products", color: "text-pink-700" },
  { label: "My Orders", icon: ShoppingCart, href: "/seller/orders", color: "text-orange-500" },
  { label: "My Inventory", icon: Box, href: "/seller/inventory", color: "text-emerald-500" },
  { label: "Reviews", icon: Star, href: "/reviews", color: "text-yellow-500" },
  { label: "Settings", icon: Settings, href: "/settings", color: "text-gray-500" },
];

export function Sidebar({ className, isMobile, isCollapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin, isSeller } = useAuth();  // ADD useAuth

  // Determine which routes to show based on role
  const routes = isAdmin ? adminRoutes : (isSeller ? sellerRoutes : []);
  
  // Update portal title
  const portalTitle = isAdmin ? "Admin Portal" : (isSeller ? "Seller Portal" : "Portal");

  return (
    <div className={cn(/* ... */)}>
      {!isCollapsed && (
        <span className="text-xl font-bold">{portalTitle}</span>
      )}
      {/* ... rest remains same */}
    </div>
  );
}
```

## Store Management Pages

### 4. Create Store API Client

**File:** `e-commerce-admin/src/lib/api/stores-api.ts` (NEW)

```typescript
import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  sellerId: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';
  isOnVacation: boolean;
  vacationMessage?: string;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    products: number;
    orders: number;
  };
}

export interface CreateStoreDto {
  name: string;
  description?: string;
  logo?: string;
}

export interface UpdateStoreDto {
  name?: string;
  description?: string;
  logo?: string;
}

export interface UpdateStoreStatusDto {
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';
}

export interface ToggleVacationDto {
  isOnVacation: boolean;
  vacationMessage?: string;
}

export const storesApi = {
  // Get all stores (admin sees all, seller sees only theirs)
  getAll: async (): Promise<Store[]> => {
    const response = await axiosClient.get(ENDPOINTS.STORES.BASE);
    return response.data.data || response.data;
  },

  // Get single store
  getById: async (id: string): Promise<Store> => {
    const response = await axiosClient.get(ENDPOINTS.STORES.DETAIL(id));
    return response.data.data || response.data;
  },

  // Create store (seller only)
  create: async (data: CreateStoreDto): Promise<Store> => {
    const response = await axiosClient.post(ENDPOINTS.STORES.BASE, data);
    return response.data.data || response.data;
  },

  // Update store (seller for own, admin for all)
  update: async (id: string, data: UpdateStoreDto): Promise<Store> => {
    const response = await axiosClient.patch(ENDPOINTS.STORES.DETAIL(id), data);
    return response.data.data || response.data;
  },

  // Update store status (admin only)
  updateStatus: async (id: string, data: UpdateStoreStatusDto): Promise<Store> => {
    const response = await axiosClient.patch(ENDPOINTS.STORES.STATUS(id), data);
    return response.data.data || response.data;
  },

  // Toggle vacation mode (seller for own, admin for all)
  toggleVacation: async (id: string, data: ToggleVacationDto): Promise<Store> => {
    const response = await axiosClient.patch(ENDPOINTS.STORES.VACATION(id), data);
    return response.data.data || response.data;
  },

  // Delete store
  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.STORES.DETAIL(id));
  },
};
```

### 5. Add Store Endpoints

**File:** `e-commerce-admin/src/lib/api/endpoints.ts`

Add after USERS section (line 25):

```typescript
STORES: {
  BASE: '/stores',
  DETAIL: (id: string) => `/stores/${id}`,
  STATUS: (id: string) => `/stores/${id}/status`,
  VACATION: (id: string) => `/stores/${id}/vacation`,
},
```

### 6. Create Store Types

**File:** `e-commerce-admin/src/types/store.ts` (NEW)

```typescript
export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  sellerId: string;
  status: StoreStatus;
  isOnVacation: boolean;
  vacationMessage?: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: SellerInfo;
  _count?: {
    products: number;
    orders: number;
  };
}

export type StoreStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';

export interface SellerInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateStoreFormData {
  name: string;
  description?: string;
  logo?: string;
}

export interface UpdateStoreFormData {
  name?: string;
  description?: string;
  logo?: string;
}
```

## Seller Pages

### 7. Create Seller Store Management Page

**File:** `e-commerce-admin/src/app/seller/my-store/page.tsx` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { storesApi, Store } from '@/lib/api/stores-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';

export default function MyStorePage() {
  const { user, isSeller } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vacationMessage, setVacationMessage] = useState('');

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const stores = await storesApi.getAll();
      setStore(stores[0] || null);
      setVacationMessage(stores[0]?.vacationMessage || '');
    } catch (error) {
      toast.error('Failed to load store');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVacationToggle = async (isOnVacation: boolean) => {
    if (!store) return;

    try {
      await storesApi.toggleVacation(store.id, {
        isOnVacation,
        vacationMessage: isOnVacation ? vacationMessage : undefined,
      });
      toast.success(isOnVacation ? 'Vacation mode enabled' : 'Vacation mode disabled');
      loadStore();
    } catch (error) {
      toast.error('Failed to update vacation mode');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Store Found</CardTitle>
            <CardDescription>Create your first store to start selling</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/seller/my-store/new">
              <Button>Create Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Store</h1>
        <Link href={`/seller/my-store/${store.id}/edit`}>
          <Button>Edit Store</Button>
        </Link>
      </div>

      {/* Store Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Store Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Status</Label>
            <Badge variant={store.status === 'APPROVED' ? 'default' : 'secondary'}>
              {store.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="vacation-mode">Vacation Mode</Label>
            <Switch
              id="vacation-mode"
              checked={store.isOnVacation}
              onCheckedChange={handleVacationToggle}
              disabled={store.status !== 'APPROVED'}
            />
          </div>

          {store.isOnVacation && (
            <div className="space-y-2">
              <Label htmlFor="vacation-message">Vacation Message</Label>
              <Textarea
                id="vacation-message"
                value={vacationMessage}
                onChange={(e) => setVacationMessage(e.target.value)}
                placeholder="We'll be back soon!"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Store Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{store._count?.products || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{store._count?.orders || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 8. Create Admin Stores Management Page

**File:** `e-commerce-admin/src/app/stores/page.tsx` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { storesApi, Store } from '@/lib/api/stores-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { StoreStatusBadge } from '@/components/ui/store-status-badge';

export default function AllStoresPage() {
  const { isAdmin } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const data = await storesApi.getAll();
      setStores(data);
    } catch (error) {
      toast.error('Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (storeId: string, newStatus: string) => {
    try {
      await storesApi.updateStatus(storeId, { 
        status: newStatus as 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED' 
      });
      toast.success('Store status updated');
      loadStores();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Stores</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vacation</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.seller?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Select
                      value={store.status}
                      onValueChange={(value) => handleStatusChange(store.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {store.isOnVacation ? (
                      <Badge variant="secondary">On Vacation</Badge>
                    ) : (
                      <span className="text-muted-foreground">Active</span>
                    )}
                  </TableCell>
                  <TableCell>{store._count?.products || 0}</TableCell>
                  <TableCell>{store._count?.orders || 0}</TableCell>
                  <TableCell>
                    <Link href={`/stores/${store.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 9. Create Seller Products Page

**File:** `e-commerce-admin/src/app/seller/products/page.tsx` (NEW)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SellerProductsPage() {
  const router = useRouter();

  // Reuse the existing products page
  // Backend will automatically filter by sellerId
  router.push('/products');
  
  return null;
}
```

Note: Products page already exists and backend automatically filters by seller context. No new page needed - just route redirect.

### 10. Create Seller Orders Page

**File:** `e-commerce-admin/src/app/seller/orders/page.tsx` (NEW)

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function SellerOrdersPage() {
  const router = useRouter();

  // Reuse the existing orders page
  // Backend will automatically filter by storeId
  router.push('/orders');
  
  return null;
}
```

Note: Orders page already exists and backend automatically filters by store context.

## API Integration Updates

### 11. Update Products API for Seller Context

**File:** `e-commerce-admin/src/lib/api/products-api.ts`

Products API already works via backend filtering - no changes needed. Backend automatically filters by sellerId for SELLER role.

### 12. Update Orders API for Seller Context

**File:** `e-commerce-admin/src/lib/api/orders-api.ts`

Orders API already works via backend filtering - backend will filter by storeId for SELLER role.

## UI Component Updates

### 13. Update Middleware for Seller Routes

**File:** `e-commerce-admin/middleware.ts`

No changes needed - authentication works for both roles.

### 14. Add Store Status Badge Component

**File:** `e-commerce-admin/src/components/ui/store-status-badge.tsx` (NEW)

```typescript
import { Badge } from './badge';

interface StoreStatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';
}

export function StoreStatusBadge({ status }: StoreStatusBadgeProps) {
  const variants = {
    PENDING: { variant: 'secondary', label: 'Pending' },
    APPROVED: { variant: 'default', label: 'Approved' },
    SUSPENDED: { variant: 'destructive', label: 'Suspended' },
    CLOSED: { variant: 'outline', label: 'Closed' },
  };

  const config = variants[status];
  
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
```

## Product Creation Updates

### 15. Update Product Form for Store Selection

**File:** `e-commerce-admin/src/app/products/new/page.tsx`

Add store selection field for sellers (load stores on component mount, show dropdown before category selection):

```typescript
// Add to component state
const [stores, setStores] = useState<Store[]>([]);
const { isSeller } = useAuth();

// Load stores for sellers
useEffect(() => {
  if (isSeller) {
    loadStores();
  }
}, [isSeller]);

const loadStores = async () => {
  try {
    const data = await storesApi.getAll();
    setStores(data.filter(s => s.status === 'APPROVED'));
  } catch (error) {
    toast.error('Failed to load stores');
  }
};

// Add in form (before category field)
{isSeller && (
  <FormField
    control={form.control}
    name="storeId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Store*</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder="Select store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

## Access Control

### 16. Create Protected Route Wrapper

**File:** `e-commerce-admin/src/components/auth/protected-route.tsx` (NEW)

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, hasPermission, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !allowedRoles.some(role => hasPermission(role))) {
      router.push('/auth/access-denied');
    }
  }, [user, isLoading, allowedRoles, hasPermission, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!allowedRoles.some(role => hasPermission(role))) {
    return null;
  }

  return <>{children}</>;
}
```

### 17. Protect Admin-Only Pages

Wrap admin-only pages (users, brands, categories, tags, logs) with ProtectedRoute.

Example for `e-commerce-admin/src/app/users/page.tsx`:

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {/* Existing page content */}
    </ProtectedRoute>
  );
}
```

Apply to:
- `/users/page.tsx`
- `/brands/page.tsx`
- `/categories/page.tsx`
- `/tags/page.tsx`
- `/logs/page.tsx`

## Summary

The plan implements multi-tenancy support in admin panel with:

- Role-based sidebar navigation (different menus for ADMIN vs SELLER)
- Seller-specific pages (My Store, My Products, My Orders)
- Admin pages for managing all stores
- Vacation mode toggle for sellers
- Store status management for admins
- Protected routes for role-based access
- Backward compatible with existing ADMIN functionality
- No breaking changes to existing features

All changes leverage existing RBAC foundation (isAdmin, hasPermission) and work seamlessly with the backend multi-tenancy implementation.

## Implementation Checklist

### Backend (see MULTI_TENANCY_IMPLEMENTATION_PLAN.md)
- [ ] Update Prisma schema with Store model
- [ ] Run migration
- [ ] Create SellerContext decorator and OwnershipGuard
- [ ] Update ProductsService and Controller
- [ ] Create StoresModule (DTOs, Service, Controller)
- [ ] Update OrdersService and SearchService

### Frontend (this document)
- [ ] Update AuthGuard for multi-role support
- [ ] Add isSeller to useAuth hook
- [ ] Update Sidebar with role-based routes
- [ ] Create stores API client
- [ ] Add STORES endpoints
- [ ] Create Store types
- [ ] Create seller/my-store page
- [ ] Create admin stores management page
- [ ] Create StoreStatusBadge component
- [ ] Create ProtectedRoute component
- [ ] Update product creation form for store selection
- [ ] Protect admin-only pages

## Notes

- Existing admin functionality remains unchanged
- Backend handles all data filtering automatically
- Frontend only needs UI/navigation updates
- Seller sees filtered data, Admin sees everything
- Vacation mode is seller-controlled
- Store status is admin-controlled

