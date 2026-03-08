"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Box, DollarSign, ShoppingCart, TrendingUp, Users, RefreshCw, Store } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ordersService from "@/services/ordersService";
import { productsApi } from "@/lib/api/products-api";
import { usersApi } from "@/lib/api/users-api";
import { storesService } from "@/services/storesService";
import { Order } from "@/types/order";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

export default function DashboardPage() {
  const { isAdmin, isSeller, isAuthenticated, isLoading: authLoading } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    orderCount: 0,
    productCount: 0,
    userCount: 0,
    storeCount: 0,
    currency: 'USD' as string,
  });
  const [salesSeries, setSalesSeries] = useState<Array<{ date: string; revenue: number; orders: number }>>([]);
  const { toast } = useToast();

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setOrdersLoading(false);
      return;
    }
    
    try {
      setOrdersLoading(true);
      
      const response = await ordersService.getOrders({
        limit: 5,
        sortBy: 'placedAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        setRecentOrders(response.data.orders);
      } else {
        console.error("Failed to load recent orders:", response.error);
        toast({
          title: "Error",
          description: "Failed to load recent orders",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching recent orders:", err);
      toast({
        title: "Error",
        description: "Failed to load recent orders",
        variant: "destructive",
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated) {
      fetchRecentOrders();
      fetchDashboardStats();
    }
  }, [isAuthenticated]); // Re-run when auth status changes

  const fetchDashboardStats = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setStatsLoading(false);
      return;
    }
    
    try {
      setStatsLoading(true);
      setDashboardError(null);

      // Define current month range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch data based on role
      // Admins: fetch products, users, orders
      // Sellers: fetch products (their own), stores (their own), orders (their own)
      const fetchPromises: Promise<any>[] = [
        productsApi.getProducts({ page: 1, limit: 1 }),
        ordersService.getOrders({ page: 1, limit: 100, startDate: startOfMonth.toISOString(), endDate: endOfMonth.toISOString(), sortBy: 'placedAt', sortOrder: 'desc' }),
      ];

      // Only admins can fetch users
      if (isAdmin) {
        fetchPromises.push(usersApi.getUsers({ skip: 0, take: 1 }));
      }

      // Sellers should fetch their stores
      if (isSeller) {
        fetchPromises.push(storesService.getStores());
      }

      const results = await Promise.all(fetchPromises);
      const productsRes = results[0];
      const ordersFirstPage = results[1];
      const usersRes = isAdmin ? results[2] : null;
      const storesRes = isSeller ? results[2] : null;

      // Sum revenue across pages up to a cap for performance
      const firstOrders = (ordersFirstPage.success ? ordersFirstPage.data.orders : []) as Order[];
      let totalRevenue = firstOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0);

      const totalOrders = ordersFirstPage.success ? ordersFirstPage.data.total : 0;
      const currency = firstOrders[0]?.currency || 'USD';

      const pageSize = ordersFirstPage.success ? ordersFirstPage.data.limit : 100;
      const totalPages = Math.ceil(totalOrders / pageSize);
      const maxPagesToFetch = Math.min(totalPages, 5); // cap to avoid too many requests

      const additionalPagesPromises: Promise<any>[] = [];
      for (let p = 2; p <= maxPagesToFetch; p += 1) {
        additionalPagesPromises.push(
          ordersService.getOrders({ page: p, limit: pageSize, startDate: startOfMonth.toISOString(), endDate: endOfMonth.toISOString(), sortBy: 'placedAt', sortOrder: 'desc' })
        );
      }

      let allOrders: Order[] = [...firstOrders];
      if (additionalPagesPromises.length > 0) {
        const additional = await Promise.all(additionalPagesPromises);
        for (const resp of additional) {
          if (resp.success) {
            const list = resp.data.orders as Order[];
            totalRevenue += list.reduce((sum: number, o: Order) => sum + (o.total || 0), 0);
            allOrders = allOrders.concat(list);
          }
        }
      }

      // Build daily series for current month
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
      const byDate: Record<string, { revenue: number; orders: number }> = {};
      for (const o of allOrders) {
        const d = new Date(o.placedAt);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        if (!byDate[key]) byDate[key] = { revenue: 0, orders: 0 };
        byDate[key].revenue += o.total || 0;
        byDate[key].orders += 1;
      }
      const series: Array<{ date: string; revenue: number; orders: number }> = [];
      const cursor = new Date(startOfMonth);
      while (cursor <= endOfMonth) {
        const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
        series.push({ date: key.slice(5), revenue: byDate[key]?.revenue || 0, orders: byDate[key]?.orders || 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      setSalesSeries(series);

      setMetrics({
        totalRevenue,
        orderCount: totalOrders,
        productCount: productsRes?.total || productsRes?.data?.total || 0,
        userCount: isAdmin && usersRes ? (usersRes.total || 0) : 0,
        storeCount: isSeller && storesRes?.success ? (storesRes.data?.length || 0) : 0,
        currency,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setDashboardError(err.message || 'Failed to load dashboard stats');
      toast({ title: 'Error', description: 'Failed to load dashboard stats', variant: 'destructive' });
    } finally {
      setStatsLoading(false);
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

  // Show loading during auth or if not authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            This month overview
          </div>
          <button
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => { fetchDashboardStats(); fetchRecentOrders(); }}
            disabled={statsLoading && ordersLoading}
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading || ordersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '—' : formatCurrency(metrics.totalRevenue, metrics.currency)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '—' : metrics.orderCount}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '—' : metrics.productCount}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '—' : metrics.userCount}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          )}
          
          {isSeller && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? '—' : metrics.storeCount}</div>
                <p className="text-xs text-muted-foreground">Active stores</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                Monthly sales performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {statsLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">Loading chart…</div>
              ) : salesSeries.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatCurrency(v as number, metrics.currency)} width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      formatter={(value: any, name: any) =>
                        name === 'revenue'
                          ? [formatCurrency(value as number, metrics.currency), 'Revenue']
                          : [String(value), 'Orders']
                      }
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0284c7" fill="url(#rev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest 5 orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading orders...</span>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No recent orders found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          <Link 
                            href={`/orders/${order.id}/view`} 
                            className="hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCustomerName(order)}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(order.total,order.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 