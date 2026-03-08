"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AlertCircle, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { couponsApi, CouponType, CreateCouponDto } from "@/lib/api/coupons-api";

// Local DatePicker component to avoid import issues
function DatePicker({ 
  date, 
  onSelect, 
  disabled 
}: { 
  date?: Date; 
  onSelect: (date: Date | undefined) => void; 
  disabled?: boolean; 
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function CreateCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponData, setCouponData] = useState<Partial<CreateCouponDto>>({
    type: CouponType.PERCENTAGE,
    value: 10,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
  });

  const handleChange = (field: keyof CreateCouponDto, value: any) => {
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
    
    if (!couponData.value) {
      setError("Coupon value is required");
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API
      const apiData = {
        ...couponData,
        code: couponData.code?.toUpperCase(),
      } as CreateCouponDto;
      
      const result = await couponsApi.createCoupon(apiData);
      console.log("Coupon created:", result);
      
      // Redirect to coupons list (in deals page for now)
      router.push("/deals");
    } catch (err: any) {
      console.error("Error creating coupon:", err);
      setError(err.response?.data?.message || err.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Create New Coupon</h1>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Details</CardTitle>
                <CardDescription>
                  Enter the basic information for your coupon
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
                      onSelect={(date: Date | undefined) => handleDateChange('startDate', date)} 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <DatePicker 
                      date={couponData.endDate ? new Date(couponData.endDate) : undefined} 
                      onSelect={(date: Date | undefined) => handleDateChange('endDate', date)} 
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
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 