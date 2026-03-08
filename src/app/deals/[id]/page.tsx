"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { dealsApi, UpdateDealDto, Deal } from "@/lib/api/deals-api";
import Link from "next/link";

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  // State for form fields
  const [name, setName] = useState("");
  const [dealType, setDealType] = useState<"FLASH" | "TRENDING" | "DEAL_OF_DAY">("FLASH");
  const [discount, setDiscount] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  // State for the deal
  const [deal, setDeal] = useState<Deal | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the deal data on component mount
  useEffect(() => {
    const fetchDeal = async () => {
      if (!id) return;
      
      try {
        setInitialLoading(true);
        setError(null);
        
        const fetchedDeal = await dealsApi.getDealById(id);
        setDeal(fetchedDeal);
        
        // Set form fields
        setName(fetchedDeal.name);
        setDealType(fetchedDeal.dealType);
        setDiscount(fetchedDeal.discount.toString());
        
        // Format dates for the datetime-local input
        const startDate = new Date(fetchedDeal.startTime);
        const endDate = new Date(fetchedDeal.endTime);
        
        setStartTime(formatDateForInput(startDate));
        setEndTime(formatDateForInput(endDate));
      } catch (err: any) {
        console.error("Error fetching deal:", err);
        setError(err.message || "Failed to load deal");
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchDeal();
  }, [id]);
  
  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!name.trim()) {
      setError("Deal name is required");
      return;
    }
    
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
      setError("Discount must be a number between 0 and 100");
      return;
    }
    
    if (!startTime) {
      setError("Start time is required");
      return;
    }
    
    if (!endTime) {
      setError("End time is required");
      return;
    }
    
    // Validate that end time is after start time
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (endDate <= startDate) {
      setError("End time must be after start time");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the data for the API
      const dealData: UpdateDealDto = {
        name,
        dealType,
        discount: discountValue,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      };
      
      console.log("Updating deal with data:", dealData);
      
      // Call the API
      const updatedDeal = await dealsApi.updateDeal(id, dealData);
      
      console.log("Deal updated successfully:", updatedDeal);
      
      // Redirect to the deals list page
      router.push("/deals");
    } catch (err: any) {
      console.error("Error updating deal:", err);
      setError(err.message || "Failed to update deal");
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading deal information...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!deal && !initialLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Deal not found or could not be loaded.</AlertDescription>
          </Alert>
          <Link href="/deals">
            <Button>Return to Deals</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link href="/deals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Deal</h1>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
            <CardDescription>Update the details for this promotional deal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Deal Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Sale"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dealType">Deal Type</Label>
                  <Select
                    value={dealType}
                    onValueChange={(value: "FLASH" | "TRENDING" | "DEAL_OF_DAY") => setDealType(value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="dealType">
                      <SelectValue placeholder="Select deal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLASH">Flash Sale</SelectItem>
                      <SelectItem value="TRENDING">Trending Deal</SelectItem>
                      <SelectItem value="DEAL_OF_DAY">Deal of the Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Percentage</Label>
                  <Input
                    id="discount"
                    placeholder="25"
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="startTime"
                      type="datetime-local"
                      className="pl-10"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="endTime"
                      type="datetime-local"
                      className="pl-10"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Link href="/deals">
                  <Button variant="outline" disabled={loading}>Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Deal"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Products section could be added here in the future */}
        <Card>
          <CardHeader>
            <CardTitle>Products in this Deal</CardTitle>
            <CardDescription>
              Manage the products that will receive this discount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {deal && (
                <div className="font-medium mb-4">
                  {deal.productsCount > 0
                    ? `This deal currently includes ${deal.productsCount} product${deal.productsCount === 1 ? '' : 's'}`
                    : "This deal doesn't have any products yet"}
                </div>
              )}
              
              <Link href={`/deals/${id}/products`}>
                <Button>
                  Manage Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 