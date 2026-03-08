"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store as StoreIcon, Package, ShoppingCart, Calendar, Mail, User } from "lucide-react";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storesService } from "@/services/storesService";
import { Store } from "@/types/store";
import { StoreStatusBadge } from "@/components/ui/store-status-badge";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isSeller } = useAuth();
  
  // Unwrap params promise
  const { id } = use(params);
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreDetails();
  }, [id]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await storesService.getStoreById(id);
      
      if (result.success && result.data) {
        setStore(result.data);
      } else {
        setError(result.error || 'Failed to load store');
        toast({
          title: "Error",
          description: result.error || "Failed to load store details",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching store details:", err);
      setError(err.message || "Failed to load store");
      toast({
        title: "Error",
        description: "Failed to load store details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !store) {
    return (
      <MainLayout>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Link href={isAdmin ? "/stores" : "/seller/stores"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Store Details</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {error || "Store not found"}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const formattedDate = new Date(store.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Link href={isAdmin ? "/stores" : "/seller/stores"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Store Details</h1>
        </div>

        {/* Store Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {store.logo && (
                  <img src={store.logo} alt={store.name} className="h-16 w-16 rounded-lg object-cover border" />
                )}
                <div>
                  <CardTitle className="text-2xl">{store.name}</CardTitle>
                  <CardDescription className="mt-1">{store.slug}</CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StoreStatusBadge status={store.status} />
                {store.isOnVacation && (
                  <Badge variant="secondary">On Vacation</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {store.description && (
              <p className="text-sm text-muted-foreground">{store.description}</p>
            )}
            
            {store.isOnVacation && store.vacationMessage && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 px-4 py-3 rounded">
                <p className="text-sm font-medium">Vacation Message:</p>
                <p className="text-sm mt-1">{store.vacationMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store._count?.products || 0}</div>
              <p className="text-xs text-muted-foreground">Listed products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store._count?.orders || 0}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
              <StoreIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.commissionRate}%</div>
              <p className="text-xs text-muted-foreground">Per sale</p>
            </CardContent>
          </Card>
        </div>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Seller
                </div>
                <div className="text-sm text-muted-foreground">
                  {store.seller ? (
                    <div>
                      <div>{store.seller.firstName} {store.seller.lastName}</div>
                      <div className="text-xs">{store.seller.email}</div>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Created
                </div>
                <div className="text-sm text-muted-foreground">{formattedDate}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Status</div>
                <StoreStatusBadge status={store.status} />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Active</div>
                <div className="text-sm text-muted-foreground">
                  {store.isActive ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isSeller && (
          <div className="flex gap-3">
            <Link href={`/seller/stores/${store.id}/edit`} className="flex-1">
              <Button variant="default" className="w-full">
                Edit Store Details
              </Button>
            </Link>
            <Link href="/seller/stores" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to My Stores
              </Button>
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-3">
            <Link href="/stores" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to All Stores
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

