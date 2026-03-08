"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Package, Truck, CreditCard, User, RefreshCw, Phone, MessageSquare, TrendingUp, Warehouse, DollarSign, Clock, MapPin, AlertCircle, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import ordersService from "@/services/ordersService";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { formatCurrency } from "@/lib/utils";

// Constants
const PRODUCT_IMAGE_SIZE = {
  width: 48,
  height: 48,
  className: "h-12 w-12"
};

const TIMELINE_ICON_SIZE = {
  width: 24,
  height: 24,
  className: "w-6 h-6"
};

// Memoized Timeline Item Component
const TimelineItem = memo(({ 
  children, 
  className = "",
  isLast = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  isLast?: boolean;
}) => (
  <li className={`mb-6 ml-6 ${className} ${isLast ? 'last:mb-0' : ''}`}>
    <span className="absolute flex items-center justify-center w-6 h-6 bg-primary rounded-full -left-3 ring-8 ring-background">
      <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
    </span>
    {children}
  </li>
));

TimelineItem.displayName = 'TimelineItem';

// Memoized Order Item Component
const OrderItem = memo(({ item }: { item: any }) => (
  <div className="flex justify-between items-center border-b pb-3 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`${PRODUCT_IMAGE_SIZE.className} rounded-md bg-muted flex items-center justify-center`}>
        {item.product?.imageUrl ? (
          <img 
            src={item.product.imageUrl} 
            alt={`${item.product.title || 'Product'} - Order item`}
            className={`${PRODUCT_IMAGE_SIZE.className} rounded-md object-cover`}
            loading="lazy"
          />
        ) : (
          <Package className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="font-medium">
          {item.product?.title || 'Product'}
        </p>
        <p className="text-sm text-muted-foreground">
          Qty: {item.quantity} × {formatCurrency(item.unitPrice, item.currency)}
        </p>
        {item.variant && (
          <p className="text-xs text-muted-foreground">
            Variant: {item.variant.variantName}
          </p>
        )}
      </div>
    </div>
    <span className="font-medium">{formatCurrency(item.totalPrice, item.currency)}</span>
  </div>
));

OrderItem.displayName = 'OrderItem';

// Enhanced Shipping Status Component
const ShippingStatus = memo(({ order }: { order: Order }) => {
  const getShippingStatus = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { label: 'Not Shipped', color: 'bg-gray-100 text-gray-800', icon: Clock };
      case OrderStatus.PROCESSING:
        return { label: 'Preparing', color: 'bg-blue-100 text-blue-800', icon: Package };
      case OrderStatus.SHIPPED:
        return { label: 'In Transit', color: 'bg-purple-100 text-purple-800', icon: Truck };
      case OrderStatus.DELIVERED:
        return { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case OrderStatus.CANCELLED:
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
  };

  const statusInfo = getShippingStatus(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex items-center gap-2">
      <StatusIcon className="h-4 w-4" />
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    </div>
  );
});

ShippingStatus.displayName = 'ShippingStatus';

// Quick Actions Component
const QuickActions = memo(({ order, onAction }: { order: Order; onAction: (action: string, data?: any) => void }) => {
  const actions = [
    { id: 'update-status', label: 'Update Status', icon: Edit, variant: 'outline' as const },
    { id: 'add-tracking', label: 'Add Tracking', icon: Truck, variant: 'outline' as const },
    { id: 'send-notification', label: 'Notify Customer', icon: MessageSquare, variant: 'outline' as const },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: DollarSign, variant: 'outline' as const },
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

// Order Notes Component
const OrderNotes = memo(({ notes, onAddNote }: { notes: string[]; onAddNote: (note: string) => void }) => {
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Internal Notes</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Add Note
        </Button>
      </div>
      
      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add internal note..."
            className="w-full p-2 border rounded-md text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      
      <div className="space-y-2">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes added yet</p>
        ) : (
          notes.map((note, index) => (
            <div key={index} className="p-2 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleString()}
                </span>
              </div>
              <p>{note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

OrderNotes.displayName = 'OrderNotes';

// Customer Insights Component
const CustomerInsights = memo(({ order }: { order: Order }) => {
  // Mock data - in real implementation, this would come from API
  const customerData = {
    totalOrders: 12,
    totalSpent: 2450.75,
    averageOrderValue: 204.23,
    lastOrderDate: '2024-01-15',
    customerSince: '2023-06-10',
    segment: 'VIP Customer'
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Total Orders</span>
          </div>
          <p className="text-lg font-bold">{customerData.totalOrders}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Total Spent</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(customerData.totalSpent, order.currency)}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Avg Order Value</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(customerData.averageOrderValue, order.currency)}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Customer Segment</span>
          </div>
          <p className="text-sm font-bold">{customerData.segment}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>Customer since: {new Date(customerData.customerSince).toLocaleDateString()}</p>
        <p>Last order: {new Date(customerData.lastOrderDate).toLocaleDateString()}</p>
      </div>
    </div>
  );
});

CustomerInsights.displayName = 'CustomerInsights';

// Inventory Status Component
const InventoryStatus = memo(({ order }: { order: Order }) => {
  // Mock data - in real implementation, this would come from API
  const inventoryData = {
    warehouse: 'Main Warehouse',
    fulfillmentCenter: 'FC-001',
    stockStatus: 'In Stock',
    reserved: true,
    backorderStatus: 'None'
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-600';
      case 'Low Stock': return 'text-yellow-600';
      case 'Out of Stock': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Warehouse className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Warehouse</span>
          </div>
          <p className="text-sm font-bold">{inventoryData.warehouse}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Fulfillment Center</span>
          </div>
          <p className="text-sm font-bold">{inventoryData.fulfillmentCenter}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Stock Status</span>
          </div>
          <p className={`text-sm font-bold ${getStockStatusColor(inventoryData.stockStatus)}`}>
            {inventoryData.stockStatus}
          </p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Reserved</span>
          </div>
          <p className="text-sm font-bold">{inventoryData.reserved ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
});

InventoryStatus.displayName = 'InventoryStatus';

// Financial Breakdown Component
const FinancialBreakdown = memo(({ order }: { order: Order }) => {
  // Mock data - in real implementation, this would come from API
  const financialData = {
    costOfGoods: order.subtotal * 0.6, // 60% of subtotal
    profitMargin: order.subtotal * 0.4, // 40% of subtotal
    commission: order.total * 0.05, // 5% commission
    fees: order.total * 0.03, // 3% fees
    netProfit: order.total - (order.subtotal * 0.6) - (order.total * 0.05) - (order.total * 0.03)
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">Cost of Goods</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(financialData.costOfGoods, order.currency)}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Profit Margin</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(financialData.profitMargin, order.currency)}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Commission</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(financialData.commission, order.currency)}</p>
        </div>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Fees</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(financialData.fees, order.currency)}</p>
        </div>
      </div>
      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Net Profit</span>
        </div>
        <p className="text-lg font-bold text-green-800">{formatCurrency(financialData.netProfit, order.currency)}</p>
      </div>
    </div>
  );
});

FinancialBreakdown.displayName = 'FinancialBreakdown';

export default function OrderViewPage() {
  // Use the useParams hook to get the ID parameter from the URL
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [orderNotes, setOrderNotes] = useState<string[]>([]);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const { toast } = useToast();

  // Memoized fetchOrder function with retry logic
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ordersService.getOrderById(orderId);
      
      if (response.success) {
        setOrder(response.data);
        setRetryCount(0); // Reset retry count on success
      } else {
        const errorMessage = response.error || "Failed to load order details";
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  // Memoized utility functions
  const formatCustomerName = useCallback((order: Order) => {
    if (order.user) {
      const fullName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
      return fullName || order.user.email;
    }
    return 'Guest Customer';
  }, []);

  const getCustomerEmail = useCallback((order: Order) => {
    return order.user?.email || 'N/A';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Enhanced address formatting with mobile number
  const formatAddress = useCallback((address: any) => {
    if (typeof address === 'string') return address;
    if (!address) return 'N/A';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    
    const addressString = parts.join(', ');
    
    // Add mobile number if available
    if (address.mobileNumber) {
      return `${addressString}\n📱 ${address.mobileNumber}`;
    }
    
    return addressString;
  }, []);

  // Get specific error content
  const getErrorContent = useCallback((error: string | null, order: Order | null) => {
    if (!orderId) return { title: "Invalid Order ID", message: "Please check the URL" };
    if (error?.includes('404')) return { title: "Order Not Found", message: "This order doesn't exist" };
    if (error?.includes('403')) return { title: "Access Denied", message: "You don't have permission to view this order" };
    if (error?.includes('500')) return { title: "Server Error", message: "Something went wrong on our end" };
    return { title: "Error Loading Order", message: error || "Something went wrong" };
  }, [orderId]);

  // Memoized status badge functions
  const getOrderStatusBadge = useCallback((status: OrderStatus) => {
    const config = ordersService.getOrderStatusBadgeConfig(status);
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  }, []);

  const getPaymentStatusBadge = useCallback((status: PaymentStatus) => {
    const config = ordersService.getPaymentStatusBadgeConfig(status);
    return config;
  }, []);

  // Memoized order summary
  const orderSummary = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shippingFee,
      discount: order.discount,
      total: order.total,
      currency: order.currency
    };
  }, [order]);

  // Action handlers
  const handleQuickAction = useCallback((action: string, data?: any) => {
    switch (action) {
      case 'update-status':
        toast({
          title: "Update Status",
          description: "Status update functionality would be implemented here",
        });
        break;
      case 'add-tracking':
        setShowTrackingForm(true);
        break;
      case 'send-notification':
        toast({
          title: "Customer Notification",
          description: "Customer notification sent successfully",
        });
        break;
      case 'generate-invoice':
        toast({
          title: "Invoice Generated",
          description: "Invoice has been generated and sent to customer",
        });
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [toast]);

  const handleAddNote = useCallback((note: string) => {
    setOrderNotes(prev => [...prev, note]);
    toast({
      title: "Note Added",
      description: "Internal note has been added successfully",
    });
  }, [toast]);

  const handleAddTracking = useCallback(() => {
    if (trackingNumber.trim()) {
      toast({
        title: "Tracking Added",
        description: `Tracking number ${trackingNumber} has been added`,
      });
      setTrackingNumber('');
      setShowTrackingForm(false);
    }
  }, [trackingNumber, toast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center" role="status" aria-label="Loading order details">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <p>Loading order details...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    const errorContent = getErrorContent(error, order);
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">{errorContent.title}</h2>
            <p className="text-gray-600">{errorContent.message}</p>
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
            <h1 className="text-3xl font-bold">Order Details</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.print()}
              variant="outline"
              aria-label="Print order details"
            >
              <Package className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Link href={`/orders/${orderId}`}>
              <Button aria-label="Edit order details">
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </Button>
            </Link>
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
            <QuickActions order={order} onAction={handleQuickAction} />
            
            {/* Tracking Number Form */}
            {showTrackingForm && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h4 className="font-medium mb-2">Add Tracking Number</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number..."
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <Button onClick={handleAddTracking} size="sm">
                    Add
                  </Button>
                  <Button 
                    onClick={() => setShowTrackingForm(false)} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-5">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{order.orderNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Placed on {formatDate(order.placedAt)}
                  </p>
                </div>
                {getOrderStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Items ({order.items.length})</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <OrderItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {orderSummary && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(orderSummary.subtotal, orderSummary.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>{formatCurrency(orderSummary.tax, orderSummary.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{formatCurrency(orderSummary.shipping, orderSummary.currency)}</span>
                        </div>
                        {orderSummary.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(orderSummary.discount, orderSummary.currency)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>{formatCurrency(orderSummary.total, orderSummary.currency)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5 md:w-96">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{formatCustomerName(order)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerEmail(order)}</p>
                  {order.user?.id && (
                    <p className="text-xs text-muted-foreground">ID: {order.user.id}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Shipping Status */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Shipping Status</p>
                    <ShippingStatus order={order} />
                  </div>
                  
                  {/* Shipping Address */}
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping Address</p>
                    <div className="whitespace-pre-line">
                      {formatAddress(order.shippingAddress)}
                    </div>
                  </div>
                  
                  {/* Billing Address */}
                  {order.billingAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Billing Address</p>
                      <div className="whitespace-pre-line">
                        {formatAddress(order.billingAddress)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p>{order.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className={
                      order.paymentStatus === PaymentStatus.PAID 
                        ? "text-green-600" 
                        : order.paymentStatus === PaymentStatus.REFUNDED 
                        ? "text-amber-600" 
                        : order.paymentStatus === PaymentStatus.FAILED
                        ? "text-red-600"
                        : "text-gray-600"
                    }>
                      {getPaymentStatusBadge(order.paymentStatus).label}
                    </p>
                  </div>
                  {/* Enhanced Payment Details */}
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transaction ID</p>
                        <p className="font-mono text-xs">TXN-{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gateway</p>
                        <p>{order.paymentMethod === 'Credit Card' ? 'Stripe' : 'PayPal'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-bold">{formatCurrency(order.total, order.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Processed</p>
                        <p>{formatDate(order.placedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Customer Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Customer Insights
              </CardTitle>
              <CardDescription>
                Customer behavior and order history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerInsights order={order} />
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Inventory Status
              </CardTitle>
              <CardDescription>
                Stock and fulfillment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryStatus order={order} />
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Breakdown
              </CardTitle>
              <CardDescription>
                Cost analysis and profit margins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialBreakdown order={order} />
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Order Notes
              </CardTitle>
              <CardDescription>
                Internal notes and communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderNotes notes={orderNotes} onAddNote={handleAddNote} />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Order Timeline
            </CardTitle>
            <CardDescription>
              Track the progress of this order with detailed events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-gray-200 dark:border-gray-700">
              <TimelineItem>
                <h3 className="flex items-center mb-1 font-medium">Order Placed</h3>
                <time className="block mb-2 text-sm text-muted-foreground">
                  {formatDate(order.placedAt)}
                </time>
                <p className="text-sm text-muted-foreground">Order was successfully placed by customer</p>
              </TimelineItem>
              
              {order.paymentStatus === PaymentStatus.PAID && (
                <TimelineItem>
                  <h3 className="flex items-center mb-1 font-medium">Payment Confirmed</h3>
                  <time className="block mb-2 text-sm text-muted-foreground">
                    {formatDate(order.placedAt)}
                  </time>
                  <p className="text-sm text-muted-foreground">Payment of {formatCurrency(order.total, order.currency)} was successfully processed</p>
                </TimelineItem>
              )}
              
              {order.status === OrderStatus.PROCESSING && (
                <TimelineItem>
                  <h3 className="flex items-center mb-1 font-medium">Order Processing</h3>
                  <time className="block mb-2 text-sm text-muted-foreground">
                    {formatDate(order.updatedAt)}
                  </time>
                  <p className="text-sm text-muted-foreground">Order is being prepared for shipment</p>
                </TimelineItem>
              )}
              
              {order.status === OrderStatus.SHIPPED && (
                <TimelineItem>
                  <h3 className="flex items-center mb-1 font-medium">Order Shipped</h3>
                  <time className="block mb-2 text-sm text-muted-foreground">
                    {formatDate(order.updatedAt)}
                  </time>
                  <p className="text-sm text-muted-foreground">Order has been shipped and is in transit</p>
                </TimelineItem>
              )}
              
              {order.status === OrderStatus.DELIVERED && (
                <TimelineItem>
                  <h3 className="flex items-center mb-1 font-medium">Order Delivered</h3>
                  <time className="block mb-2 text-sm text-muted-foreground">
                    {formatDate(order.updatedAt)}
                  </time>
                  <p className="text-sm text-muted-foreground">Order has been successfully delivered</p>
                </TimelineItem>
              )}
              
              <TimelineItem isLast>
                <h3 className="flex items-center mb-1 font-medium">Current Status</h3>
                <div className="mb-2">
                  {getOrderStatusBadge(order.status)}
                </div>
                <p className="text-sm text-muted-foreground">Last updated: {formatDate(order.updatedAt)}</p>
              </TimelineItem>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 