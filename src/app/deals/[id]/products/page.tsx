"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Package, Search, Trash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { dealsApi, Deal } from "@/lib/api/deals-api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { productsApi, Product } from "@/lib/api/products-api";

export default function DealProductsPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params?.id as string;
  
  // State for deal and products
  const [deal, setDeal] = useState<Deal | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch deal data on component mount
  useEffect(() => {
    const fetchDealAndProducts = async () => {
      if (!dealId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch deal details
        const dealData = await dealsApi.getDealById(dealId);
        setDeal(dealData);
        
        // Fetch products in the deal
        const productsResponse = await dealsApi.getDealProducts(dealId);
        setProducts(productsResponse.products || []);
        
        // Initial search for available products
        searchProducts("");
      } catch (err: any) {
        console.error("Error fetching deal data:", err);
        setError(err.message || "Failed to load deal data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDealAndProducts();
  }, [dealId]);
  
  // Search for products to add to the deal
  const searchProducts = async (query: string) => {
    try {
      setSearchLoading(true);
      
      // Get all products that match the search query
      const response = await productsApi.getProducts({
        search: query,
        limit: 10
      });
      
      // Filter out products that are already in the deal
      const productIds = products.map((p: Product) => p.id);
      const filteredProducts = response.products.filter(
        (p: Product) => !productIds.includes(p.id)
      );
      
      setAvailableProducts(filteredProducts);
    } catch (err: any) {
      console.error("Error searching products:", err);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchProducts(query);
  };
  
  // Add a product to the deal
  const addProductToDeal = async (productId: string) => {
    try {
      setActionLoading(true);
      
      await dealsApi.addProductToDeal(dealId, productId);
      
      // Refresh the product list
      const productsResponse = await dealsApi.getDealProducts(dealId);
      setProducts(productsResponse.products || []);
      
      // Refresh available products
      searchProducts(searchQuery);
      
      // Refresh deal data to update product count
      const dealData = await dealsApi.getDealById(dealId);
      setDeal(dealData);
    } catch (err: any) {
      console.error("Error adding product to deal:", err);
      setError(err.message || "Failed to add product to deal");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Remove a product from the deal
  const removeProductFromDeal = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this product from the deal?")) {
      return;
    }
    
    try {
      setActionLoading(true);
      
      await dealsApi.removeProductFromDeal(dealId, productId);
      
      // Refresh the product list
      const productsResponse = await dealsApi.getDealProducts(dealId);
      setProducts(productsResponse.products || []);
      
      // Refresh available products
      searchProducts(searchQuery);
      
      // Refresh deal data to update product count
      const dealData = await dealsApi.getDealById(dealId);
      setDeal(dealData);
    } catch (err: any) {
      console.error("Error removing product from deal:", err);
      setError(err.message || "Failed to remove product from deal");
    } finally {
      setActionLoading(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading deal products...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!deal) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/deals/${dealId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Manage Products in Deal</h1>
          </div>
          
          <Link href="/deals">
            <Button variant="outline">Back to Deals</Button>
          </Link>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>{deal.name}</CardTitle>
            <CardDescription>
              {deal.dealType} deal with {deal.discount}% discount, 
              running from {new Date(deal.startTime).toLocaleDateString()} 
              to {new Date(deal.endTime).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Badge variant={
                deal.status === "Active" ? "default" : 
                deal.status === "Upcoming" ? "secondary" : "outline"
              }>
                {deal.status}
              </Badge>
              <span className="ml-2 text-sm text-muted-foreground">
                {deal.productsCount} product{deal.productsCount !== 1 ? 's' : ''} in this deal
              </span>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Products in the deal */}
          <Card>
            <CardHeader>
              <CardTitle>Products in this Deal</CardTitle>
              <CardDescription>
                These products will have the {deal.discount}% discount applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-3" />
                  <p>No products in this deal yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the search on the right to add products
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Regular Price</TableHead>
                      <TableHead>Deal Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {product.images && product.images[0] ? (
                              <img 
                                src={product.images[0].imageUrl} 
                                alt={product.title} 
                                className="h-8 w-8 object-cover rounded"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                            <span>{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>${parseFloat(product.price.toString()).toFixed(2)}</TableCell>
                        <TableCell>
                          ${(parseFloat(product.price.toString()) * (1 - deal.discount/100)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeProductFromDeal(product.id)}
                            disabled={actionLoading}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Add products section */}
          <Card>
            <CardHeader>
              <CardTitle>Add Products to Deal</CardTitle>
              <CardDescription>
                Search for products to add to this deal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={searchLoading}
                />
              </div>
              
              {availableProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchLoading 
                      ? "Searching products..." 
                      : searchQuery 
                        ? "No matching products found" 
                        : "Start typing to search for products"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {product.images && product.images[0] ? (
                              <img 
                                src={product.images[0].imageUrl} 
                                alt={product.title} 
                                className="h-8 w-8 object-cover rounded"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                            <span>{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>${parseFloat(product.price.toString()).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => addProductToDeal(product.id)}
                            disabled={actionLoading}
                          >
                            Add to Deal
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 