"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, Store as StoreIcon, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { storesService } from "@/services/storesService";
import { Store } from "@/types/store";
import { StoreStatusBadge } from "@/components/ui/store-status-badge";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCsrf } from "@/contexts/CsrfContext";

export default function SellerStoresPage() {
  const { isSeller, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { withCsrfProtection } = useCsrf();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vacationMessage, setVacationMessage] = useState<{ [key: string]: string }>({});
  const [togglingVacation, setTogglingVacation] = useState<string | null>(null);

  // Redirect non-sellers
  useEffect(() => {
    if (isAuthenticated && !isSeller) {
      router.push('/stores');
    }
  }, [isSeller, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isSeller) {
      fetchStores();
    }
  }, [isAuthenticated, isSeller]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await storesService.getStores();
      
      if (result.success) {
        setStores(result.data);
        
        // Initialize vacation messages
        const messages: { [key: string]: string } = {};
        result.data.forEach(store => {
          messages[store.id] = store.vacationMessage || '';
        });
        setVacationMessage(messages);
      } else {
        setError(result.error || 'Failed to load stores');
        toast({
          title: "Error",
          description: result.error || "Failed to load stores",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching stores:", err);
      setError(err.message || "Failed to load stores");
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVacationToggle = async (storeId: string, isOnVacation: boolean) => {
    try {
      setTogglingVacation(storeId);
      
      await withCsrfProtection(async () => {
        const result = await storesService.toggleVacation(
          storeId,
          isOnVacation,
          isOnVacation ? vacationMessage[storeId] : undefined
        );
        
        if (result.success) {
          toast({
            title: "Success",
            description: result.message || "Vacation mode updated",
          });
          await fetchStores();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update vacation mode",
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error(`Error toggling vacation for store ${storeId}:`, error);
      toast({
        title: "Error",
        description: "Failed to update vacation mode",
        variant: "destructive",
      });
    } finally {
      setTogglingVacation(null);
    }
  };

  if (!isSeller) {
    return null; // Will redirect via useEffect
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Stores</h1>
          <div className="flex gap-2">
            <Button onClick={fetchStores} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/seller/stores/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Store
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* No Stores State */}
        {!loading && !error && stores.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Stores Yet</CardTitle>
              <CardDescription>Create your first store to start selling on AllMart</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/seller/stores/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Store
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stores List */}
        {!loading && !error && stores.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {stores.map((store) => (
              <Card key={store.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {store.logo && (
                        <img src={store.logo} alt={store.name} className="h-12 w-12 rounded object-cover" />
                      )}
                      <div>
                        <CardTitle className="text-xl">{store.name}</CardTitle>
                        <CardDescription className="mt-1">{store.slug}</CardDescription>
                      </div>
                    </div>
                    <StoreStatusBadge status={store.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {store.description && (
                    <p className="text-sm text-muted-foreground">{store.description}</p>
                  )}

                  {/* Store Statistics */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y">
                    <div>
                      <div className="text-2xl font-bold">{store._count?.products || 0}</div>
                      <div className="text-xs text-muted-foreground">Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{store._count?.orders || 0}</div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{store.commissionRate}%</div>
                      <div className="text-xs text-muted-foreground">Commission</div>
                    </div>
                  </div>

                  {/* Store Status Messages */}
                  {store.status === 'PENDING' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        Your store is pending approval. An admin will review it soon.
                      </div>
                    </div>
                  )}

                  {store.status === 'SUSPENDED' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        Your store has been suspended. Please contact support.
                      </div>
                    </div>
                  )}

                  {/* Vacation Mode (Only if approved) */}
                  {store.status === 'APPROVED' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={`vacation-${store.id}`} className="text-base">
                            Vacation Mode
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Hide your products from search when you're away
                          </p>
                        </div>
                        <Switch
                          id={`vacation-${store.id}`}
                          checked={store.isOnVacation}
                          onCheckedChange={(checked) => handleVacationToggle(store.id, checked)}
                          disabled={togglingVacation === store.id}
                        />
                      </div>

                      {store.isOnVacation && (
                        <div className="space-y-2">
                          <Label htmlFor={`vacation-message-${store.id}`}>
                            Vacation Message
                          </Label>
                          <Textarea
                            id={`vacation-message-${store.id}`}
                            value={vacationMessage[store.id] || ''}
                            onChange={(e) => setVacationMessage(prev => ({
                              ...prev,
                              [store.id]: e.target.value
                            }))}
                            placeholder="We'll be back soon! Returning on..."
                            className="resize-none"
                            rows={3}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVacationToggle(store.id, true)}
                            disabled={togglingVacation === store.id}
                          >
                            Update Message
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Link href={`/seller/stores/${store.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Edit Store
                      </Button>
                    </Link>
                    <Link href={`/stores/${store.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

