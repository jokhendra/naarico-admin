"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  couponsApi, 
  CouponType, 
  Coupon, 
  UpdateCouponDto,
  CouponStatus
} from "@/lib/api/coupons-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponData, setCouponData] = useState<UpdateCouponDto>({});

  // Fetch coupon data when component mounts
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setLoading(true);
        const data = await couponsApi.getCouponById(couponId);
        setCoupon(data);
        
        // Initialize form with coupon data
        setCouponData({
          code: data.code,
          type: data.type as CouponType,
          value: parseFloat(data.value),
          description: data.description,
          minimumPurchase: data.minimumPurchase ? parseFloat(data.minimumPurchase) : undefined,
          usageLimit: data.usageLimit,
          perUserLimit: data.perUserLimit,
          startDate: data.startDate,
          endDate: data.endDate,
        });
      } catch (err: any) {
        console.error("Error fetching coupon:", err);
        setError(err.message || "Failed to load coupon");
      } finally {
        setLoading(false);
      }
    };

    if (couponId) {
      fetchCoupon();
    }
  }, [couponId]);

  const handleChange = (field: keyof UpdateCouponDto, value: any) => {
    setCouponData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (date) {
      setCouponData((prev) => ({
        ...prev,
        [field]: date.toISOString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!couponData.code) {
      setError("Coupon code is required");
      return;
    }
    
    if (couponData.value === undefined || couponData.value === null) {
      setError("Coupon value is required");
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for API
      const apiData: UpdateCouponDto = {
        ...couponData,
        code: couponData.code?.toUpperCase(),
      };
      
      const result = await couponsApi.updateCoupon(couponId, apiData);
      console.log("Coupon updated:", result);
      
      // Redirect to coupons list (in deals page for now)
      router.push("/deals");
    } catch (err: any) {
      console.error("Error updating coupon:", err);
      setError(err.response?.data?.message || err.message || "Failed to update coupon");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading coupon data...</p>
        </div>
      </MainLayout>
    );
  }

  if (error && !coupon) {
    return (
      <MainLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Coupon not found</h1>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <Button onClick={() => router.push("/deals")}>
            Return to Deals & Coupons
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Coupon</h1>
          </div>
          
          {coupon && (
            <div className="flex items-center gap-2">
              <Badge variant={coupon.status === CouponStatus.ACTIVE ? "default" : 
                              coupon.status === CouponStatus.EXPIRED ? "secondary" : 
                              "destructive"}>
                {coupon.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created: {new Date(coupon.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Coupon Details</TabsTrigger>
            <TabsTrigger value="usage" disabled>Usage History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Coupon Details</CardTitle>
                    <CardDescription>
                      Update the basic information for your coupon
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input 
                          id="code" 
                          placeholder="e.g., SUMMER25" 
                          value={couponData.code || ''} 
                          onChange={(e) => handleChange('code', e.target.value)}
                          className="uppercase"
                          maxLength={20}
                        />
                        <p className="text-sm text-muted-foreground">
                          This is the code customers will enter at checkout
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="type">Discount Type</Label>
                        <Select 
                          value={couponData.type} 
                          onValueChange={(value) => handleChange('type', value)}
                        >
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CouponType.PERCENTAGE}>Percentage</SelectItem>
                            <SelectItem value={CouponType.FIXED_AMOUNT}>Fixed Amount</SelectItem>
                            <SelectItem value={CouponType.FREE_SHIPPING}>Free Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="value">
                        {couponData.type === CouponType.PERCENTAGE ? 'Discount Percentage' :
                         couponData.type === CouponType.FIXED_AMOUNT ? 'Discount Amount ($)' :
                         'Maximum Shipping Discount ($)'}
                      </Label>
                      <Input 
                        id="value" 
                        type="number" 
                        min={0} 
                        step={couponData.type === CouponType.PERCENTAGE ? 1 : 0.01}
                        placeholder={couponData.type === CouponType.PERCENTAGE ? "e.g., 25 for 25%" : "e.g., 10.00"}
                        value={couponData.value || ''}
                        onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Enter coupon description" 
                        value={couponData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Limits</CardTitle>
                    <CardDescription>
                      Set limits on how this coupon can be used
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="minimumPurchase">Minimum Purchase Amount ($)</Label>
                        <Input 
                          id="minimumPurchase" 
                          type="number" 
                          min={0} 
                          step={0.01}
                          placeholder="Leave blank for no minimum" 
                          value={couponData.minimumPurchase || ''}
                          onChange={(e) => handleChange('minimumPurchase', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="usageLimit">Total Usage Limit</Label>
                        <Input 
                          id="usageLimit" 
                          type="number" 
                          min={1} 
                          step={1}
                          placeholder="Leave blank for unlimited" 
                          value={couponData.usageLimit || ''}
                          onChange={(e) => handleChange('usageLimit', e.target.value ? parseInt(e.target.value) : null)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Current usage: {coupon?.usageCount || 0} times
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="perUserLimit">Per User Limit</Label>
                      <Input 
                        id="perUserLimit" 
                        type="number" 
                        min={1} 
                        step={1}
                        placeholder="Leave blank for unlimited" 
                        value={couponData.perUserLimit || ''}
                        onChange={(e) => handleChange('perUserLimit', e.target.value ? parseInt(e.target.value) : null)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of times a single user can use this coupon
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Validity Period</CardTitle>
                    <CardDescription>
                      Set when this coupon will be valid
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <DatePicker 
                          date={couponData.startDate ? new Date(couponData.startDate) : undefined} 
                          onSelect={(date) => handleDateChange('startDate', date)} 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>End Date</Label>
                        <DatePicker 
                          date={couponData.endDate ? new Date(couponData.endDate) : undefined} 
                          onSelect={(date) => handleDateChange('endDate', date)} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
                <CardDescription>
                  View detailed usage history for this coupon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Usage history feature coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 