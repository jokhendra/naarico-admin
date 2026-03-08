"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X,
  Edit,
  Eye,
  ArrowUpDown,
  AlertCircle
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { categoriesApi } from "@/lib/api/categories-api";
import { brandsApi } from "@/lib/api/brands-api";
import {
  productsApi,
  Product,
  ProductListParams,
  ProductListResponse
} from "@/lib/api/products-api";
import { getCurrencySymbol } from "@/lib/utils";


export default function ProductsPage() {
  // States for data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  // States for pagination
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // States for filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [isFeaturedFilter, setIsFeaturedFilter] = useState<boolean | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL params
  useEffect(() => {
    if (searchParams) {
      const pageParam = searchParams.get('page');
      const searchParam = searchParams.get('search');
      const categoryParam = searchParams.get('category');
      const brandParam = searchParams.get('brand');
      const minPriceParam = searchParams.get('minPrice');
      const maxPriceParam = searchParams.get('maxPrice');
      const sortByParam = searchParams.get('sortBy');
      const sortOrderParam = searchParams.get('sortOrder') as "asc" | "desc" | null;
      const isActiveParam = searchParams.get('isActive');
      const isFeaturedParam = searchParams.get('isFeatured');
      
      if (pageParam) setPage(parseInt(pageParam));
      if (searchParam) setSearch(searchParam);
      if (categoryParam) setCategoryFilter(categoryParam);
      if (brandParam) setBrandFilter(brandParam);
      if (minPriceParam) setMinPrice(minPriceParam);
      if (maxPriceParam) setMaxPrice(maxPriceParam);
      if (sortByParam) setSortBy(sortByParam);
      if (sortOrderParam) setSortOrder(sortOrderParam);
      if (isActiveParam) setIsActiveFilter(isActiveParam === 'true');
      if (isFeaturedParam) setIsFeaturedFilter(isFeaturedParam === 'true');
    }
  }, [searchParams]);
  
  // Load categories and brands
  useEffect(() => {
    const fetchOptionsData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          categoriesApi.getCategories(),
          brandsApi.getBrands()
        ]);
        
        // Add defensive checks for categories and brands data
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.error("Error fetching filter options:", error);
        setCategories([]);
        setBrands([]);
      }
    };
    
    fetchOptionsData();
  }, []);
  
  // Load products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params: ProductListParams = { page, limit };
        
        if (search) params.search = search;
        if (categoryFilter && categoryFilter !== "all") params.category = categoryFilter;
        if (brandFilter && brandFilter !== "all") params.brand = brandFilter;
        if (minPrice && !isNaN(Number(minPrice))) params.minPrice = Number(minPrice);
        if (maxPrice && !isNaN(Number(maxPrice))) params.maxPrice = Number(maxPrice);
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;
        if (isActiveFilter !== undefined) params.isActive = isActiveFilter;
        if (isFeaturedFilter !== undefined) params.isFeatured = isFeaturedFilter;
        
        console.log("Fetching products with params:", params);
        
        const response = await productsApi.getProducts(params);
        
        // Add defensive check to handle potentially undefined response data
        if (response && response.products) {
          setProducts(response.products);
          setTotal(response.total || 0);
          setTotalPages(response.totalPages || 1);
        } else {
          console.error("Invalid response format:", response);
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
          setError("Received invalid data format from server");
        }
      } catch (error: any) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setError(error.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [page, limit, search, categoryFilter, brandFilter, minPrice, maxPrice, sortBy, sortOrder, isActiveFilter, isFeaturedFilter]);
  
  // Update URL when filters change
  const updateFiltersInUrl = () => {
    const params = new URLSearchParams();
    
    if (page > 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    if (categoryFilter && categoryFilter !== "all") params.set('category', categoryFilter);
    if (brandFilter && brandFilter !== "all") params.set('brand', brandFilter);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy !== "createdAt") params.set('sortBy', sortBy);
    if (sortOrder !== "desc") params.set('sortOrder', sortOrder);
    if (isActiveFilter !== undefined) params.set('isActive', isActiveFilter.toString());
    if (isFeaturedFilter !== undefined) params.set('isFeatured', isFeaturedFilter.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    
    router.push(url);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    updateFiltersInUrl();
  };
  
  // Handle filter change
  const applyFilters = () => {
    setPage(1); // Reset to first page when filters change
    updateFiltersInUrl();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setIsActiveFilter(undefined);
    setIsFeaturedFilter(undefined);
    setPage(1);
    
    router.push('/products');
  };
  
  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    
    updateFiltersInUrl();
  };
  
  // Get status badge for product
  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return (
        <Badge variant="destructive">Inactive</Badge>
      );
    }
    
    if (product.stockQuantity <= 0) {
      return (
        <Badge variant="destructive">Out of Stock</Badge>
      );
    }
    
    if (product.stockQuantity < 10) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          Low Stock
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Stock</Badge>
    );
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
          <Link href="/products/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>
              Manage your product inventory
            </CardDescription>
            <div className="mt-4 flex flex-col md:flex-row gap-4 justify-between">
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="submit" className="sr-only">Search</Button>
              </form>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Button onClick={() => setIsOpen(!isOpen)}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  {isOpen && (
                    <div className="absolute z-50 mt-2 right-0 w-72">
                      <Card className="border border-border shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            Filter Products
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              onClick={() => setIsOpen(false)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Close</span>
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center justify-between">
                              Category
                              <span className="text-xs text-muted-foreground">Required</span>
                            </label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center justify-between">
                              Brand
                              <span className="text-xs text-muted-foreground">Optional</span>
                            </label>
                            <Select value={brandFilter} onValueChange={setBrandFilter}>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Brands" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {brands.map((brand) => (
                                  <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center justify-between">
                              Price Range
                              <span className="text-xs text-muted-foreground">Optional</span>
                            </label>
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  className="pl-6 bg-background"
                                  value={minPrice}
                                  onChange={(e) => setMinPrice(e.target.value)}
                                />
                              </div>
                              <span className="text-muted-foreground">to</span>
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  className="pl-6 bg-background"
                                  value={maxPrice}
                                  onChange={(e) => setMaxPrice(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Product Status</label>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex items-center space-x-2 rounded-md border p-2 bg-background">
                                <Checkbox 
                                  id="active" 
                                  checked={isActiveFilter === true}
                                  onCheckedChange={(checked) => 
                                    setIsActiveFilter(checked === true ? true : undefined)
                                  }
                                />
                                <label htmlFor="active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Active products only
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 rounded-md border p-2 bg-background">
                                <Checkbox 
                                  id="featured" 
                                  checked={isFeaturedFilter === true}
                                  onCheckedChange={(checked) => 
                                    setIsFeaturedFilter(checked === true ? true : undefined)
                                  }
                                />
                                <label htmlFor="featured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Featured products only
                                </label>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2 border-t">
                          <Button variant="outline" onClick={resetFilters} size="sm" type="button">
                            Reset All
                          </Button>
                          <Button onClick={() => { applyFilters(); setIsOpen(false); }} size="sm" type="button" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Apply Filters
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}
                </div>
                
                {(categoryFilter !== "all" || brandFilter !== "all" || minPrice || maxPrice || 
                  isActiveFilter !== undefined || isFeaturedFilter !== undefined) && (
                  <Button variant="ghost" onClick={resetFilters} className="h-9 px-2">
                    <X className="h-4 w-4" />
                    <span className="ml-2">Clear Filters</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p>Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <p className="text-muted-foreground">No products found</p>
                {(search || categoryFilter !== "all" || brandFilter !== "all" || minPrice || maxPrice || 
                  isActiveFilter !== undefined || isFeaturedFilter !== undefined) && (
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                          <div className="flex items-center">
                            Product
                            {sortBy === "title" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                          <div className="flex items-center">
                            Price
                            {sortBy === "price" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("stockQuantity")}>
                          <div className="flex items-center">
                            Stock
                            {sortBy === "stockQuantity" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <Link href={`/products/${product.id}/view`} className="hover:underline">
                              {product.title}
                            </Link>
                            {product.isFeatured && (
                              <Badge variant="secondary" className="ml-2">Featured</Badge>
                            )}
                          </TableCell>
                          <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
                          <TableCell>
                            {product.discountPrice ? (
                              <div>
                                <span className="line-through text-muted-foreground">
                                  {getCurrencySymbol(product.currency || 'USD')}{product.price.toFixed(2)}
                                </span>
                                <span className="ml-2 text-green-600 font-medium">
                                  {getCurrencySymbol(product.currency || 'USD')}{product.discountPrice.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span>{getCurrencySymbol(product.currency || 'USD')}{product.price.toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell>{product.stockQuantity}</TableCell>
                          <TableCell>{getStatusBadge(product)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/products/${product.id}/view`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </Link>
                              <Link href={`/products/${product.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {products?.length || 0} of {total || 0} products
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(page > 1 ? page - 1 : 1);
                          updateFiltersInUrl();
                        }}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous Page</span>
                      </Button>
                      <div className="text-sm">
                        Page {page} of {totalPages || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(page < totalPages ? page + 1 : totalPages);
                          updateFiltersInUrl();
                        }}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
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