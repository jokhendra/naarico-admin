"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Eye, RefreshCw, Store as StoreIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { storesService } from "@/services/storesService";
import { Store, StoreStatus } from "@/types/store";
import { StoreStatusBadge } from "@/components/ui/store-status-badge";
import { useToast } from "@/components/ui/use-toast";

export default function AllStoresPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      router.push('/seller/stores');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await storesService.getStores();
      
      if (result.success) {
        setStores(result.data);
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

  const handleStatusChange = async (storeId: string, newStatus: StoreStatus) => {
    try {
      setUpdating(storeId);
      const result = await storesService.updateStoreStatus(storeId, newStatus);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Store status updated successfully",
        });
        await fetchStores();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update store status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`Error updating store ${storeId} status:`, error);
      toast({
        title: "Error",
        description: "Failed to update store status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  // Filter stores
  const filteredStores = storesService.filterStoresBySearch(
    storesService.filterStoresByStatus(stores, statusFilter),
    searchTerm
  );

  // Calculate stats
  const stats = storesService.calculateStoreStats(stores);

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">All Stores</h1>
          <Button onClick={fetchStores} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <StoreIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStores}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Badge variant="success">{stats.approvedStores}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedStores}</div>
              <p className="text-xs text-muted-foreground">Active stores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Badge variant="secondary">{stats.pendingStores}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingStores}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">On Vacation</CardTitle>
              <Badge variant="outline">{stats.vacationStores}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vacationStores}</div>
              <p className="text-xs text-muted-foreground">Temporarily closed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Store Management</CardTitle>
            <CardDescription>
              View and manage all seller stores in the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search stores by name or seller..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StoreStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Stores Table */}
            {!loading && !error && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vacation</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'No stores found matching your filters' 
                            : 'No stores available'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {store.logo && (
                                <img src={store.logo} alt={store.name} className="h-8 w-8 rounded object-cover" />
                              )}
                              <div>
                                <div>{store.name}</div>
                                <div className="text-xs text-muted-foreground">{store.slug}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {store.seller ? (
                              <div>
                                <div className="text-sm">
                                  {store.seller.firstName} {store.seller.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {store.seller.email}
                                </div>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={store.status}
                              onValueChange={(value) => handleStatusChange(store.id, value as StoreStatus)}
                              disabled={updating === store.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue>
                                  <StoreStatusBadge status={store.status} />
                                </SelectValue>
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
                              <span className="text-sm text-muted-foreground">Active</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{store._count?.products || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{store._count?.orders || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{store.commissionRate}%</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/stores/${store.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

