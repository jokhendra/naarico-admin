"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, Search, Filter, Download, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import ordersService from "@/services/ordersService";
import { Order, OrderStatus, PaymentStatus, OrderListParams } from "@/types/order";
import { formatCurrency } from "@/lib/utils";


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('placedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: OrderListParams = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        sortBy,
        sortOrder
      };

      const response = await ordersService.getOrders(params);
      
      if (response.success) {
        setOrders(response.data.orders);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.error || "Failed to load orders");
        toast({
          title: "Error",
          description: response.error || "Failed to load orders",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load orders when component mounts or filters change
  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentStatusFilter, sortBy, sortOrder]);

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchOrders();
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await ordersService.updateOrderStatus(orderId, newStatus);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        // Refresh orders list
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update order status",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Handle export orders
  const handleExportOrders = async () => {
    try {
      const params: OrderListParams = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        sortBy,
        sortOrder
      };

      const response = await ordersService.exportOrders(params);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Orders exported successfully",
        });
        // Handle download URL if provided
        if (response.data.downloadUrl) {
          window.open(response.data.downloadUrl, '_blank');
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to export orders",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error exporting orders:", err);
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive",
      });
    }
  };

  // Format customer name
  const formatCustomerName = (order: Order) => {
    if (order.user) {
      const fullName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
      return fullName || order.user.email;
    }
    return 'Guest Customer';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };



  // Get status badge component
  const getOrderStatusBadge = (status: OrderStatus) => {
    const config = ordersService.getOrderStatusBadgeConfig(status);
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Get payment status badge component
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const config = ordersService.getPaymentStatusBadgeConfig(status);
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-gray-600 mt-1">
              {total > 0 ? `${total} orders total` : 'No orders found'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportOrders} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={fetchOrders} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link href="/orders/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Order Status Filter */}
              <Select value={statusFilter} onValueChange={(value: OrderStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={OrderStatus.PROCESSING}>Processing</SelectItem>
                  <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                  <SelectItem value={OrderStatus.RETURNED}>Returned</SelectItem>
                  <SelectItem value={OrderStatus.REFUNDED}>Refunded</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Status Filter */}
              <Select value={paymentStatusFilter} onValueChange={(value: PaymentStatus | 'all') => setPaymentStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                  <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('_');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placedAt_desc">Newest First</SelectItem>
                  <SelectItem value="placedAt_asc">Oldest First</SelectItem>
                  <SelectItem value="total_desc">Highest Value</SelectItem>
                  <SelectItem value="total_asc">Lowest Value</SelectItem>
                  <SelectItem value="orderNumber_asc">Order Number A-Z</SelectItem>
                  <SelectItem value="orderNumber_desc">Order Number Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>
              View and manage customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading orders...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchOrders} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
                <Link href="/orders/new">
                  <Button className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create First Order
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link href={`/orders/${order.id}/view`} className="hover:underline">
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{formatCustomerName(order)}</TableCell>
                        <TableCell>{formatDate(order.placedAt)}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.total,order.currency)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Link href={`/orders/${order.id}/view`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            View
                          </Link>
                          <Link href={`/orders/${order.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            Edit
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} orders
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 