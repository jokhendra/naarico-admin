"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, PlusCircle, Tag, Percent, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useState, useEffect } from "react";
import { dealsApi, Deal } from "@/lib/api/deals-api";
import { couponsApi, Coupon, CouponType, CouponStatus } from "@/lib/api/coupons-api";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponsError, setCouponsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        console.log("Fetching deals from API...");
        const response = await dealsApi.getDeals();
        console.log("API response:", response);
        
        if (response && response.deals) {
          console.log("Setting deals from API:", response.deals);
          setDeals(response.deals);
        } else {
          console.warn("No deals found in API response:", response);
          setDeals([]);
        }
      } catch (err: any) {
        console.error("Error fetching deals:", err);
        setError(err.message || "Failed to load deals");
        // Use fallback data if API fails
        setDeals([
          {
            id: "deal-1",
            name: "Summer Sale",
            dealType: "FLASH",
            discount: 20,
            startTime: "2023-08-01T00:00:00.000Z",
            endTime: "2023-08-31T23:59:59.000Z",
            status: "Active",
            productsCount: 45,
          },
          {
            id: "deal-2",
            name: "Back to School",
            dealType: "TRENDING",
            discount: 10,
            startTime: "2023-08-15T00:00:00.000Z",
            endTime: "2023-09-15T23:59:59.000Z",
            status: "Active",
            productsCount: 32,
          },
          {
            id: "deal-3",
            name: "Flash Sale",
            dealType: "FLASH",
            discount: 30,
            startTime: "2023-09-05T00:00:00.000Z",
            endTime: "2023-09-06T23:59:59.000Z",
            status: "Upcoming",
            productsCount: 15,
          },
          {
            id: "deal-4",
            name: "Clearance",
            dealType: "DEAL_OF_DAY",
            discount: 50,
            startTime: "2023-07-15T00:00:00.000Z",
            endTime: "2023-08-15T23:59:59.000Z",
            status: "Ended",
            productsCount: 28,
          },
          {
            id: "deal-5",
            name: "Holiday Special",
            dealType: "TRENDING",
            discount: 25,
            startTime: "2023-12-01T00:00:00.000Z",
            endTime: "2023-12-31T23:59:59.000Z",
            status: "Upcoming",
            productsCount: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCoupons = async () => {
      try {
        setCouponsLoading(true);
        console.log("Fetching coupons from API...");
        const response = await couponsApi.getCoupons();
        console.log("Coupons API response:", response);
        
        if (response) {
          console.log("Setting coupons from API:", response);
          setCoupons(response);
        } else {
          console.warn("No coupons found in API response:", response);
          setCoupons([]);
        }
      } catch (err: any) {
        console.error("Error fetching coupons:", err);
        setCouponsError(err.message || "Failed to load coupons");
        // Use empty array if API fails
        setCoupons([]);
      } finally {
        setCouponsLoading(false);
      }
    };

    fetchDeals();
    fetchCoupons();
  }, []);

  // Function to handle deal deletion
  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    
    try {
      await dealsApi.deleteDeal(dealId);
      // Update the list after deletion
      setDeals(deals.filter(deal => deal.id !== dealId));
    } catch (err: any) {
      console.error("Error deleting deal:", err);
      alert("Failed to delete deal: " + (err.message || "Unknown error"));
    }
  };
  
  // Function to handle coupon deletion
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      await couponsApi.deleteCoupon(couponId);
      // Update the list after deletion
      setCoupons(coupons.filter(coupon => coupon.id !== couponId));
    } catch (err: any) {
      console.error("Error deleting coupon:", err);
      alert("Failed to delete coupon: " + (err.message || "Unknown error"));
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Deals & Promotions</h1>
          <div className="flex gap-2">
            <Link href="/deals/new">
              <Button>
                <Tag className="mr-2 h-4 w-4" />
                Create Deal
              </Button>
            </Link>
            <Link href="/coupons/new">
              <Button variant="outline">
                <Percent className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            </Link>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "-" : deals.filter(deal => deal.status === "Active").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {couponsLoading ? "-" : coupons.filter(coupon => coupon.status === CouponStatus.ACTIVE).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deals</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "-" : deals.filter(deal => deal.status === "Upcoming").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products on Sale</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "-" : deals.filter(deal => deal.status === "Active").reduce((sum, deal) => sum + deal.productsCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
            <CardDescription>
              Manage your promotional deals and discounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p>Loading deals...</p>
                </div>
              </div>
            ) : deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <p className="text-muted-foreground">No deals found</p>
                <Link href="/deals/new">
                  <Button className="mt-2">Create Your First Deal</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell>{`${deal.discount}%`}</TableCell>
                      <TableCell>{deal.productsCount}</TableCell>
                      <TableCell>{formatDate(deal.startTime)}</TableCell>
                      <TableCell>{formatDate(deal.endTime)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          deal.status === "Active" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : deal.status === "Upcoming"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {deal.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/deals/${deal.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                          Edit
                        </Link>
                        <button 
                          className="text-sm text-red-600 hover:underline dark:text-red-400"
                          onClick={() => handleDeleteDeal(deal.id)}
                        >
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Coupons</CardTitle>
            <CardDescription>
              Manage your discount coupon codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {couponsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p>Loading coupons...</p>
                </div>
              </div>
            ) : couponsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{couponsError}</AlertDescription>
              </Alert>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <p className="text-muted-foreground">No coupons found</p>
                <Link href="/coupons/new">
                  <Button className="mt-2">Create Your First Coupon</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
                      <TableCell>{coupon.type}</TableCell>
                      <TableCell>
                        {coupon.type === CouponType.PERCENTAGE 
                          ? `${coupon.value}%` 
                          : coupon.type === CouponType.FIXED_AMOUNT 
                            ? `$${coupon.value}` 
                            : 'Free Shipping'}
                      </TableCell>
                      <TableCell>{coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</TableCell>
                      <TableCell>{new Date(coupon.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          coupon.status === CouponStatus.ACTIVE 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : coupon.status === CouponStatus.EXPIRED
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {coupon.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/coupons/${coupon.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                          Edit
                        </Link>
                        <button 
                          className="text-sm text-red-600 hover:underline dark:text-red-400"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 