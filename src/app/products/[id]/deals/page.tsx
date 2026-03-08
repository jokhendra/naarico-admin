"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarRange, Clock, Percent, Save, AlertCircle, Trash2, Plus, Search, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePickerWithRange } from "@/components/DatePickerWithRange";
import { CreateProductDealDto, productsApi, Product } from "@/lib/api/products-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dealsApi, Deal as GlobalDeal } from "@/lib/api/deals-api";

// Define a type for product-specific deal
type ProductDeal = {
  id: string;
  dealType: string;
  discount: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
};

export default function ProductDealsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [allDeals, setAllDeals] = useState<GlobalDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('existing');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDeals, setFilteredDeals] = useState<GlobalDeal[]>([]);
  
  // Form state
  const [dealType, setDealType] = useState<'FLASH' | 'TRENDING' | 'DEAL_OF_DAY'>('FLASH');
  const [discount, setDiscount] = useState<string>('10');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  });

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getProductById(productId);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Fetch all deals
  useEffect(() => {
    const fetchAllDeals = async () => {
      try {
        setDealsLoading(true);
        const response = await dealsApi.getDeals();
        setAllDeals(response.deals || []);
        setFilteredDeals(response.deals || []);
      } catch (err: any) {
        console.error("Error fetching all deals:", err);
      } finally {
        setDealsLoading(false);
      }
    };

    fetchAllDeals();
  }, []);

  // Filter deals based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDeals(allDeals);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allDeals.filter(deal => 
        deal.name.toLowerCase().includes(query) || 
        deal.dealType.toLowerCase().includes(query)
      );
      setFilteredDeals(filtered);
    }
  }, [searchQuery, allDeals]);

  // Handle form submission for new deal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateRange.from || !dateRange.to) {
      setError("Please select a valid date range");
      return;
    }
    
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
      setError("Please enter a valid discount between 0.01 and 100");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const dealData: CreateProductDealDto = {
        dealType,
        discount: discountValue,
        startTime: dateRange.from.toISOString(),
        endTime: dateRange.to.toISOString(),
      };
      
      await productsApi.addDeal(productId, dealData);
      setSuccessMessage('Deal added successfully!');
      setSuccess(true);
      
      // Refresh product data to show the new deal
      const updatedProduct = await productsApi.getProductById(productId);
      setProduct(updatedProduct);
      setActiveTab('existing');
      
      // Reset form
      setDealType('FLASH');
      setDiscount('10');
      setDateRange({
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 7)),
      });
      
    } catch (err: any) {
      setError(err.message || "Failed to add product to deal");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle adding product to existing deal
  const handleAttachToDeal = async (dealId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Check if product is already in this deal
      const productDeals = product?.deals || [];
      const alreadyInDeal = productDeals.some(deal => deal.id === dealId);
      
      if (alreadyInDeal) {
        setError("Product is already part of this deal");
        return;
      }
      
      console.log(`Attempting to attach product ${productId} to deal ${dealId}`);
      
      // First, verify the deal exists
      try {
        const dealInfo = await dealsApi.getDealById(dealId);
        console.log('Deal info retrieved:', dealInfo);
        
        // If deal exists, attempt to add the product to it
        try {
          await dealsApi.addProductToDeal(dealId, productId);
          setSuccessMessage('Product attached to existing deal successfully!');
          setSuccess(true);
        } catch (attachError: any) {
          console.error('Error attaching product to deal:', {
            message: attachError.message,
            status: attachError.response?.status,
            data: attachError.response?.data,
            dealId,
            productId
          });
          
          // If we can't attach via the deals API, try the products API
          if (attachError.response?.status === 404) {
            console.log('Trying alternative approach via products API...');
            
            // Create a deal on the product with the same parameters as the global deal
            const dealData: CreateProductDealDto = {
              dealType: dealInfo.dealType as 'FLASH' | 'TRENDING' | 'DEAL_OF_DAY',
              discount: dealInfo.discount,
              startTime: dealInfo.startTime,
              endTime: dealInfo.endTime
            };
            
            await productsApi.addDeal(productId, dealData);
            setSuccessMessage('Product attached to deal successfully (via product deal)!');
            setSuccess(true);
          } else {
            throw attachError;
          }
        }
      } catch (dealLookupError: any) {
        console.error('Error looking up deal:', {
          message: dealLookupError.message,
          status: dealLookupError.response?.status,
          data: dealLookupError.response?.data
        });
        
        if (dealLookupError.response?.status === 404) {
          setError(`Deal not found. It may have been deleted.`);
        } else {
          throw dealLookupError;
        }
        return;
      }
      
      // Refresh product data regardless of which method worked
      const updatedProduct = await productsApi.getProductById(productId);
      setProduct(updatedProduct);
      setActiveTab('existing');
      
    } catch (err: any) {
      console.error("Error attaching product to deal:", err);
      setError(err.message || "Failed to attach product to deal");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove product from deal
  const handleRemoveDeal = async (dealId: string) => {
    if (confirmRemove !== dealId) {
      setConfirmRemove(dealId);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setConfirmRemove(null);
      
      await productsApi.removeDeal(productId, dealId);
      setSuccessMessage('Product removed from deal successfully!');
      setSuccess(true);
      
      // Refresh product data
      const updatedProduct = await productsApi.getProductById(productId);
      setProduct(updatedProduct);
      
    } catch (err: any) {
      setError(err.message || "Failed to remove product from deal");
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  // Get deal status for any deal object
  const getDealStatus = (deal: ProductDeal | GlobalDeal) => {
    const now = new Date();
    const startDate = new Date(deal.startTime);
    const endDate = new Date(deal.endTime);
    
    if (now < startDate) {
      return 'Upcoming';
    } else if (now > endDate) {
      return 'Ended';
    } else {
      return 'Active';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'Upcoming':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Upcoming</Badge>;
      case 'Ended':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Ended</Badge>;
      default:
        return null;
    }
  };

  // Check if product is already in a deal
  const isProductInDeal = (dealId: string) => {
    return product?.deals?.some(deal => deal.id === dealId) || false;
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/products/${productId}/view`} className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Product Deals</h1>
          </div>
          {activeTab === 'existing' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setActiveTab('attach')}
                variant="outline"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Attach to Existing Deal
              </Button>
              <Button 
                onClick={() => setActiveTab('add')}
                variant="default"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Deal
              </Button>
            </div>
          )}
          {activeTab === 'add' && (
            <Button 
              onClick={handleSubmit}
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Deal
                </>
              )}
            </Button>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-50 dark:border-green-800">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Product summary */}
        {product && (
          <div className="flex items-center gap-2 bg-muted p-4 rounded-md">
            <div className="flex-1">
              <h2 className="font-medium">Product: {product.title}</h2>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Price: ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Stock: {product.stockQuantity}</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing">Current Deals</TabsTrigger>
            <TabsTrigger value="attach">Attach to Existing Deal</TabsTrigger>
            <TabsTrigger value="add">Create New Deal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing">
            <Card>
              <CardHeader>
                <CardTitle>Current Deals</CardTitle>
                <CardDescription>
                  Manage deals associated with this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : !product?.deals || product.deals.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">This product isn't part of any deals yet.</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button 
                        onClick={() => setActiveTab('attach')} 
                        variant="outline"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Attach to Existing Deal
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('add')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Deal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.deals?.map((deal: ProductDeal) => {
                        const status = getDealStatus(deal);
                        return (
                          <TableRow key={deal.id}>
                            <TableCell className="font-medium">
                              <Link href={`/deals/${deal.id}`} className="hover:underline text-primary">
                                {deal.name || `Deal ${deal.id.substring(0, 8)}`}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {deal.dealType === 'FLASH' ? 'Flash Sale' : 
                               deal.dealType === 'TRENDING' ? 'Trending Deal' : 'Deal of the Day'}
                            </TableCell>
                            <TableCell>{deal.discount}%</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs">From: {formatDate(deal.startTime)}</span>
                                <span className="text-xs">To: {formatDate(deal.endTime)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={confirmRemove === deal.id ? "text-red-500" : "text-muted-foreground"}
                                onClick={() => handleRemoveDeal(deal.id)}
                                disabled={submitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attach">
            <Card>
              <CardHeader>
                <CardTitle>Attach to Existing Deal</CardTitle>
                <CardDescription>Add this product to an existing promotional deal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search deals by name or type..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {dealsLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredDeals.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">No deals found matching your search.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeals.map((deal) => {
                        const status = deal.status || getDealStatus(deal);
                        const productInDeal = isProductInDeal(deal.id);
                        
                        return (
                          <TableRow key={deal.id} className={productInDeal ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">
                              <Link href={`/deals/${deal.id}`} className="hover:underline text-primary">
                                {deal.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {deal.dealType === 'FLASH' ? 'Flash Sale' : 
                               deal.dealType === 'TRENDING' ? 'Trending Deal' : 'Deal of the Day'}
                            </TableCell>
                            <TableCell>{deal.discount}%</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs">From: {formatDate(deal.startTime)}</span>
                                <span className="text-xs">To: {formatDate(deal.endTime)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell className="text-right">
                              {productInDeal ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Already Attached
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAttachToDeal(deal.id)}
                                  disabled={submitting}
                                >
                                  <LinkIcon className="mr-2 h-3 w-3" />
                                  Attach
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('existing')}
                >
                  Back to Current Deals
                </Button>
                <Link href="/deals/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Deal
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Create New Deal</CardTitle>
                <CardDescription>Configure a new deal for this product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Deal Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Sale, Flash Discount, etc."
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dealType">Deal Type</Label>
                  <RadioGroup 
                    value={dealType} 
                    onValueChange={(value) => setDealType(value as 'FLASH' | 'TRENDING' | 'DEAL_OF_DAY')}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FLASH" id="flash" />
                      <Label htmlFor="flash" className="font-normal">Flash Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TRENDING" id="trending" />
                      <Label htmlFor="trending" className="font-normal">Trending Deal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DEAL_OF_DAY" id="deal-of-day" />
                      <Label htmlFor="deal-of-day" className="font-normal">Deal of the Day</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Percentage (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="discount" 
                      type="number" 
                      min="0.01" 
                      max="100" 
                      step="0.01"
                      placeholder="Enter discount percentage" 
                      className="pl-8"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Deal Period</Label>
                  <DatePickerWithRange 
                    date={dateRange}
                    setDate={setDateRange}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('existing')}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Deal
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 