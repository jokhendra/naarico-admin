"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle, CheckCircle, Eye, MoreHorizontal, Package, Truck, CreditCard, User, MessageSquare, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { ordersService } from "@/services/ordersService";
import { useToast } from "@/components/ui/use-toast";
import { Order as BackendOrder, OrderTimeline } from "@/types/order";

// UI-facing order type (mirrors previous structure to keep UI unchanged)
type UIOrder = {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  payment: {
    method: string;
    cardLast4?: string;
    email?: string;
    status: string;
  };
  shippingInfo: {
    address: string;
    method: string;
    carrier: string;
    trackingNumber: string;
  };
  notes: string;
  timeline: {
    date: string;
    status: string;
  }[];
};

// Transform backend order & timeline into UIOrder shape
const transformOrder = (
  order: BackendOrder,
  timelineEvents: OrderTimeline[],
): UIOrder => {
  // Build customer info
  const customerName = order.user
    ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
      order.user.email
    : "Guest Customer";

  // Address formatting helper
  const formatAddress = (addr: any) => {
    if (!addr) return "";
    const { street, city, state, zipCode, country } = addr;
    return [street, city, state, zipCode, country].filter(Boolean).join(", ");
  };

  return {
    id: order.orderNumber || order.id,
    customer: {
      name: customerName,
      email: order.user?.email || "",
      phone: order.user?.phone || order.shippingAddress?.mobileNumber|| "", // Phone not available in current response
    },
    date: new Date(order.placedAt).toISOString().substring(0, 10),
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    tax: order.tax,
    shippingCost: order.shippingFee,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.product?.title || item.variant?.variantName || "Item",
      price: item.unitPrice,
      quantity: item.quantity,
    })),
    payment: {
      method: order.paymentMethod || "",
      status: order.paymentStatus,
    },
    shippingInfo: {
      address: formatAddress(order.shippingAddress),
      method: "",
      carrier: "",
      trackingNumber: "",
    },
    notes: "",
    timeline: timelineEvents.map((e) => ({
      date: new Date(e.createdAt).toLocaleString(),
      status: e.status,
    })),
  };
};

// Enhanced Status Badge Component
const StatusBadge = memo(({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'PROCESSING':
        return { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package };
      case 'SHIPPED':
        return { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck };
      case 'DELIVERED':
        return { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
      case 'REFUNDED':
        return { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: DollarSign };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Badge className={config.color}>
      <StatusIcon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Enhanced Order Item Component
const OrderItemRow = memo(({ 
  item, 
  index, 
  onUpdate, 
  onRemove 
}: { 
  item: any; 
  index: number; 
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}) => {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [quantity, setQuantity] = useState(item.quantity.toString());

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    onUpdate(index, 'name', value);
  }, [index, onUpdate]);

  const handlePriceChange = useCallback((value: string) => {
    setPrice(value);
    onUpdate(index, 'price', parseFloat(value) || 0);
  }, [index, onUpdate]);

  const handleQuantityChange = useCallback((value: string) => {
    setQuantity(value);
    onUpdate(index, 'quantity', parseInt(value) || 1);
  }, [index, onUpdate]);

  const total = parseFloat(price) * parseInt(quantity);

  return (
    <div className="flex items-center gap-4 border-b pb-4 last:border-0">
      <div className="flex-1">
        <div className="space-y-2">
          <Label htmlFor={`item-name-${index}`}>Product</Label>
          <Input 
            id={`item-name-${index}`} 
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Product name"
          />
        </div>
      </div>
      <div className="w-24">
        <div className="space-y-2">
          <Label htmlFor={`item-price-${index}`}>Price</Label>
          <Input 
            id={`item-price-${index}`} 
            type="number" 
            step="0.01" 
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            min="0"
          />
        </div>
      </div>
      <div className="w-20">
        <div className="space-y-2">
          <Label htmlFor={`item-qty-${index}`}>Qty</Label>
          <Input 
            id={`item-qty-${index}`} 
            type="number" 
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            min="1"
          />
        </div>
      </div>
      <div className="w-20 text-right">
        <div className="space-y-2">
          <Label>Total</Label>
          <div className="text-sm font-medium">${total.toFixed(2)}</div>
        </div>
      </div>
      <div className="flex items-end pb-2">
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-destructive hover:text-destructive"
          onClick={() => onRemove(index)}
          aria-label={`Remove item ${name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

// Quick Actions Component
const QuickActions = memo(({ onAction }: { onAction: (action: string) => void }) => {
  const actions = [
    { id: 'duplicate', label: 'Duplicate Order', icon: Plus, variant: 'outline' as const },
    { id: 'export', label: 'Export Data', icon: Package, variant: 'outline' as const },
    { id: 'notify', label: 'Notify Customer', icon: MessageSquare, variant: 'outline' as const },
    { id: 'invoice', label: 'Generate Invoice', icon: DollarSign, variant: 'outline' as const },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant}
          size="sm"
          onClick={() => onAction(action.id)}
          className="flex items-center gap-1"
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </Button>
      ))}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

export default function OrderEditPage() {
  // Use the useParams hook to get the ID parameter from the URL
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<UIOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Memoized fetchOrder function with retry logic
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch order details and timeline in parallel
      const [orderRes, timelineRes] = await Promise.all([
        ordersService.getOrderById(orderId),
        ordersService.getOrderTimeline(orderId),
      ]);

      if (orderRes.success && orderRes.data) {
        const timelineEvents = timelineRes.success ? timelineRes.data : [];
        const uiOrder = transformOrder(orderRes.data as BackendOrder, timelineEvents);
        setOrder(uiOrder);
        // initialize editable fields
        setStatus(orderRes.data.status as unknown as string);
        setPaymentStatus(orderRes.data.paymentStatus as unknown as string);
        setRetryCount(0); // Reset retry count on success
      } else {
        const errorMessage = orderRes.error || "Failed to load order";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [orderId, toast]);

  // Retry with exponential backoff
  const retryWithBackoff = useCallback(async () => {
    if (retryCount >= 3) {
      toast({
        title: "Max Retries Reached",
        description: "Unable to load order after multiple attempts",
        variant: "destructive",
      });
      return;
    }
    
    setIsRetrying(true);
    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
    
    setTimeout(async () => {
      setRetryCount(prev => prev + 1);
      await fetchOrder();
    }, delay);
  }, [retryCount, fetchOrder, toast]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.back();
      }
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  // Memoized save function with enhanced validation
  const handleSave = useCallback(async () => {
    if (!order) return;
    
    try {
      setSaving(true);
      const payload: any = {};
      
      // Check for changes
      if (status && status !== order.status) payload.status = status;
      if (paymentStatus && paymentStatus !== order.payment.status) payload.paymentStatus = paymentStatus;

      if (Object.keys(payload).length === 0) {
        toast({ 
          title: "No changes", 
          description: "No changes detected to save.",
          variant: "default"
        });
        return;
      }

      const res = await ordersService.updateOrder(orderId, payload);
      if (res.success && res.data) {
        // Refresh local order state from server response
        const timelineRes = await ordersService.getOrderTimeline(orderId);
        const fresh = transformOrder(res.data as BackendOrder, timelineRes.success ? timelineRes.data : []);
        setOrder(fresh);
        setStatus(fresh.status);
        setPaymentStatus(fresh.payment.status);
        setHasChanges(false);
        toast({ 
          title: "Order updated", 
          description: "Changes saved successfully.",
          variant: "default"
        });
      } else {
        toast({ 
          title: "Update failed", 
          description: res.error || "Unable to update order.", 
          variant: "destructive" 
        });
      }
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to update order.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  }, [order, status, paymentStatus, orderId, toast]);

  // Action handlers
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'duplicate':
        toast({
          title: "Duplicate Order",
          description: "Order duplication functionality would be implemented here",
        });
        break;
      case 'export':
        toast({
          title: "Export Data",
          description: "Order data has been exported successfully",
        });
        break;
      case 'notify':
        toast({
          title: "Customer Notification",
          description: "Customer notification sent successfully",
        });
        break;
      case 'invoice':
        toast({
          title: "Invoice Generated",
          description: "Invoice has been generated and sent to customer",
        });
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [toast]);

  const handleDeleteOrder = useCallback(async () => {
    try {
      // In a real implementation, this would call the delete API
      toast({
        title: "Order Deleted",
        description: "Order has been permanently deleted",
        variant: "destructive"
      });
      router.push('/orders');
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete order",
        variant: "destructive"
      });
    }
  }, [router, toast]);

  const handleItemUpdate = useCallback((index: number, field: string, value: any) => {
    if (!order) return;
    
    const updatedItems = [...order.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    setOrder({ ...order, items: updatedItems });
    setHasChanges(true);
  }, [order]);

  const handleItemRemove = useCallback((index: number) => {
    if (!order) return;
    
    const updatedItems = order.items.filter((_, i) => i !== index);
    setOrder({ ...order, items: updatedItems });
    setHasChanges(true);
  }, [order]);

  const handleAddItem = useCallback(() => {
    if (!order) return;
    
    const newItem = {
      id: `new-${Date.now()}`,
      name: '',
      price: 0,
      quantity: 1,
    };
    
    setOrder({ ...order, items: [...order.items, newItem] });
    setHasChanges(true);
  }, [order]);

  // Memoized order summary
  const orderSummary = useMemo(() => {
    if (!order) return null;
    
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = order.shippingCost;
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
  }, [order]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center" role="status" aria-label="Loading order details">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading order details...</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Order</h2>
            <p className="text-gray-600">{error || "Order not found"}</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Retry attempt: {retryCount}/3
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/orders">
              <Button variant="outline" aria-label="Go back to orders list">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
            <Button 
              onClick={retryWithBackoff}
              disabled={isRetrying || retryCount >= 3}
              aria-label="Retry loading order details"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link 
              href="/orders" 
              className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80"
              aria-label="Go back to orders list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Order</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">Order #{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/orders/${orderId}/view`}>
              <Button variant="outline" aria-label="View order details">
                <Eye className="mr-2 h-4 w-4" />
                View Order
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              aria-label="Save changes to order"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Quick Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MoreHorizontal className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common order management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions onAction={handleQuickAction} />
          </CardContent>
        </Card>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
                <CardDescription>
                  Basic order details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderId">Order ID</Label>
                    <Input id="orderId" defaultValue={order.id} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" defaultValue={order.date} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>Order Items</CardTitle>
                    <CardDescription>
                      Products in this order ({order.items.length} items)
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleAddItem}
                    aria-label="Add new item to order"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No items in this order</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleAddItem}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    order.items.map((item, index) => (
                      <OrderItemRow
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={handleItemUpdate}
                        onRemove={handleItemRemove}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  Price calculations (auto-calculated from items)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="subtotal">Subtotal</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="subtotal" 
                          type="number" 
                          step="0.01" 
                          value={orderSummary?.subtotal.toFixed(2) || '0.00'}
                          readOnly
                          className="bg-muted"
                        />
                        <span className="text-sm text-muted-foreground">Auto-calculated</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax">Tax (10%)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="tax" 
                          type="number" 
                          step="0.01" 
                          value={orderSummary?.tax.toFixed(2) || '0.00'}
                          readOnly
                          className="bg-muted"
                        />
                        <span className="text-sm text-muted-foreground">Auto-calculated</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping">Shipping Cost</Label>
                      <Input 
                        id="shipping" 
                        type="number" 
                        step="0.01" 
                        defaultValue={order.shippingCost.toString()}
                        onChange={(e) => {
                          const newShipping = parseFloat(e.target.value) || 0;
                          setOrder({ ...order, shippingCost: newShipping });
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total">Total</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="total" 
                          type="number" 
                          step="0.01" 
                          value={orderSummary?.total.toFixed(2) || '0.00'}
                          readOnly
                          className="bg-muted font-bold"
                        />
                        <span className="text-sm text-muted-foreground">Auto-calculated</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Summary Breakdown */}
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items ({order.items.length})</span>
                      <span>${orderSummary?.subtotal.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${orderSummary?.tax.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${orderSummary?.shipping.toFixed(2) || '0.00'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${orderSummary?.total.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Name</Label>
                  <Input id="customerName" defaultValue={order.customer.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input id="customerEmail" type="email" defaultValue={order.customer.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input id="customerPhone" defaultValue={order.customer.phone} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Address</Label>
                  <Textarea id="shippingAddress" defaultValue={order.shippingInfo.address} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingMethod">Method</Label>
                  <Select defaultValue={order.shippingInfo.method}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard Shipping">Standard Shipping</SelectItem>
                      <SelectItem value="Express Shipping">Express Shipping</SelectItem>
                      <SelectItem value="Next Day Delivery">Next Day Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input id="carrier" defaultValue={order.shippingInfo.carrier} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input id="trackingNumber" defaultValue={order.shippingInfo.trackingNumber} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Method</Label>
                  <Select defaultValue={order.payment.method}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {order.payment.cardLast4 && (
                  <div className="space-y-2">
                    <Label htmlFor="cardLast4">Card (last 4)</Label>
                    <Input id="cardLast4" defaultValue={order.payment.cardLast4} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea rows={4} defaultValue={order.notes} placeholder="Add notes about this order" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" asChild>
            <Link href="/orders" className="flex items-center">
              Cancel
            </Link>
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" aria-label="Delete this order">
                Delete Order
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the order
                  and remove all associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOrder}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            aria-label="Save changes to order"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
} 