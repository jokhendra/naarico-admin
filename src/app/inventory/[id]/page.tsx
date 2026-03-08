"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryApi, InventoryItem, InventoryLog } from "@/lib/api/inventory-api";
import { ArrowLeft, Save, History, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [reservedQuantity, setReservedQuantity] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [restockNote, setRestockNote] = useState<string>("");
  const [restocking, setRestocking] = useState(false);

  const id = params.id as string;

  // Fetch inventory item details
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await inventoryApi.getProductInventory(id);
        
        setInventory(data);
        setStockQuantity(data.stockQuantity);
        setReservedQuantity(data.reservedQuantity);
        setThreshold(data.threshold);
      } catch (err: any) {
        console.error("Error fetching inventory:", err);
        setError(err.message || "Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInventory();
    }
  }, [id]);

  // Fetch inventory logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        
        const data = await inventoryApi.getInventoryLogs(id);
        setLogs(data);
      } catch (err) {
        console.error("Error fetching inventory logs:", err);
      } finally {
        setLogsLoading(false);
      }
    };

    if (id) {
      fetchLogs();
    }
  }, [id]);

  // Handle form submission
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (updating) return;
    
    try {
      setUpdating(true);
      
      await inventoryApi.updateProductInventory(id, {
        stockQuantity,
        reservedQuantity,
        threshold
      });
      
      // Refresh inventory data
      const updatedInventory = await inventoryApi.getProductInventory(id);
      setInventory(updatedInventory);
      
      alert("Inventory updated successfully");
    } catch (err: any) {
      console.error("Error updating inventory:", err);
      alert(`Failed to update inventory: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Handle restock
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (restocking || restockQuantity <= 0) return;
    
    try {
      setRestocking(true);
      
      await inventoryApi.restockProduct(id, {
        quantity: restockQuantity,
        note: restockNote || undefined
      });
      
      // Refresh inventory data
      const updatedInventory = await inventoryApi.getProductInventory(id);
      setInventory(updatedInventory);
      
      // Refresh logs
      const updatedLogs = await inventoryApi.getInventoryLogs(id);
      setLogs(updatedLogs);
      
      // Reset form
      setRestockQuantity(0);
      setRestockNote("");
      
      alert("Product restocked successfully");
    } catch (err: any) {
      console.error("Error restocking inventory:", err);
      alert(`Failed to restock inventory: ${err.message}`);
    } finally {
      setRestocking(false);
    }
  };

  // Get inventory status
  const getInventoryStatus = (item: InventoryItem) => {
    if (item.stockQuantity === 0) return "Out of Stock";
    if (item.isLowStock) return "Low Stock";
    return "In Stock";
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Out of Stock":
        return "destructive";
      case "Low Stock":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-24">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading inventory data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !inventory) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Inventory</h2>
          <p className="text-muted-foreground mb-4">{error || "Inventory item not found"}</p>
          <Button onClick={() => router.push("/inventory")}>
            Back to Inventory
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getInventoryStatus(inventory);
  const badgeVariant = getStatusBadgeVariant(status);

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/inventory" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">
              Inventory Details
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>View and update inventory information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
                      <p className="text-base font-medium">{inventory.product?.title || "Unknown Product"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">SKU</h3>
                      <p className="text-base">{inventory.product?.sku}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <Badge variant={badgeVariant} className="mt-1">{status}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Restocked</h3>
                      <p className="text-base">
                        {inventory.lastRestockedAt 
                          ? format(new Date(inventory.lastRestockedAt), "PPp") 
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stockQuantity">Stock Quantity</Label>
                        <Input 
                          id="stockQuantity" 
                          type="number"
                          min="0"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reservedQuantity">Reserved Quantity</Label>
                        <Input 
                          id="reservedQuantity" 
                          type="number"
                          min="0"
                          value={reservedQuantity}
                          onChange={(e) => setReservedQuantity(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="threshold">Low Stock Threshold</Label>
                        <Input 
                          id="threshold" 
                          type="number"
                          min="1"
                          value={threshold}
                          onChange={(e) => setThreshold(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updating}>
                        {updating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-5">
              <CardHeader>
                <CardTitle>Inventory History</CardTitle>
                <CardDescription>View all inventory changes</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p>Loading history...</p>
                    </div>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No history available</h3>
                    <p className="text-muted-foreground">Inventory changes will be recorded here</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.createdAt), "PP")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.changeType === 'RESTOCK' ? 'outline' : 
                                           log.changeType === 'SALE' ? 'destructive' : 'secondary'}>
                              {log.changeType}
                            </Badge>
                          </TableCell>
                          <TableCell className={log.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'}>
                            {log.quantityChanged > 0 ? '+' : ''}{log.quantityChanged}
                          </TableCell>
                          <TableCell>{log.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Restock</CardTitle>
                <CardDescription>Add inventory to this product</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRestock} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity to Add</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={restockQuantity || ''}
                      onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Input
                      id="note"
                      placeholder="Add a note about this restock"
                      value={restockNote}
                      onChange={(e) => setRestockNote(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={restocking || restockQuantity <= 0}
                  >
                    {restocking ? "Processing..." : "Restock Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-5">
              <CardHeader>
                <CardTitle>Current Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Stock</div>
                    <div className="text-2xl font-bold">{inventory.stockQuantity}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Reserved</div>
                    <div className="text-2xl font-bold">{inventory.reservedQuantity}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Available</div>
                    <div className="text-2xl font-bold">{inventory.availableQuantity}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Low Stock Threshold</div>
                    <div className="text-2xl font-bold">{inventory.threshold}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 