"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Loader2, Save, Trash } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { productsApi, Product, UpdateProductDto, ProductImage } from "@/lib/api/products-api";
import { categoriesApi, Category } from "@/lib/api/categories-api";
import { brandsApi, Brand } from "@/lib/api/brands-api";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { getCurrencySymbol, getCurrencyOptions } from "@/lib/utils";
import { ProductSpecificationsForm } from "@/components/ProductSpecificationsForm";
import { ProductSpecificationsDisplay } from "@/components/ProductSpecificationsDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { UploadedFileInfo } from "@/types/upload";

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const imagesRef = useRef<HTMLDivElement>(null);
  
  // State for data
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // Form state
  const [form, setForm] = useState<UpdateProductDto>({});
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [productImages, setProductImages] = useState<Array<{
    imageUrl: string;
    altText: string;
    position: number;
  }>>([]);
  const [currency, setCurrency] = useState<string>("USD");
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productData = await productsApi.getProductById(productId);
        
        setProduct(productData);
        setForm({
          title: productData.title,
          description: productData.description,
          shortDescription: productData.shortDescription,
          price: productData.price,
          discountPrice: productData.discountPrice,
          stockQuantity: productData.stockQuantity,
          sku: productData.sku,
          barcode: productData.barcode as string,
          weight: productData.weight,
          dimensions: productData.dimensions,
          isActive: productData.isActive,
          isFeatured: productData.isFeatured,
          visibility: productData.visibility,
          metaTitle: productData.metaTitle,
          metaDescription: productData.metaDescription,
          metaKeywords: productData.metaKeywords,
          brandId: productData.brand?.id,
          categoryId: productData.category?.id,
          subCategoryId: productData.subCategory?.id
        });
        
        setCategoryId(productData.category?.id || "");
        setSubCategoryId(productData.subCategory?.id || "");
        setCurrency(productData.currency || "USD");
        setProductImages(productData.images?.map((img, index) => ({
          imageUrl: img.imageUrl,
          altText: img.altText || `Product image ${index + 1}`,
          position: index
        })) || []);
        
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError(error.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchOptionsData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          categoriesApi.getCategories(),
          brandsApi.getBrands()
        ]);
        
        // Add defensive checks for categories and brands data
        setCategories(Array.isArray(categoriesData) ? 
          categoriesData : []);
          
        setSubCategories(Array.isArray(categoriesData) ? 
          categoriesData.filter(cat => cat.parentId) : []);
          
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.error("Error fetching options data:", error);
        setCategories([]);
        setSubCategories([]);
        setBrands([]);
      }
    };
    
    if (productId) {
      fetchProductData();
      fetchOptionsData();
    }
  }, [productId]);
  
  // Scroll to images section if tab=images in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'images' && imagesRef.current && !loading) {
      setTimeout(() => {
        imagesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [searchParams, loading]);
  
  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    handleChange('categoryId', value);
    
    // Reset subcategory if parent category changes
    setSubCategoryId("");
    handleChange('subCategoryId', null);
  };
  

  


  // FileUpload handlers
  const handleFilesChange = (files: UploadedFileInfo[]) => {
    // This handles file removal and reordering from the UI
    const images = files.map((file, index) => ({
      imageUrl: file.url,
      altText: file.originalName || `Product image ${index + 1}`,
      position: index
    }));
    
    setProductImages(images);
  };

  const handleUploadSuccess = (files: UploadedFileInfo[]) => {
    // Directly process backend response and add to productImages
    const newImages = files.map((file, index) => ({
      imageUrl: file.url, // Backend URL from response
      altText: file.originalName || `Product image ${productImages.length + index + 1}`,
      position: productImages.length + index
    }));
    
    // Add to existing productImages
    const updatedImages = [...productImages, ...newImages];
    setProductImages(updatedImages);
    
    toast.success(`Uploaded ${files.length} image(s) successfully`);
  };

  const handleUploadError = (error: string) => {
    toast.error('Upload failed', { description: error });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Basic validation
      if (!form.title || !form.price || !form.sku) {
        toast.error("Validation Error", {
          description: "Please fill in all required fields"
        });
        return;
      }
      
      // Prepare update data with the correct structure
      const updateData: UpdateProductDto = {
        title: form.title,
        description: form.description,
        shortDescription: form.shortDescription,
        price: form.price,
        discountPrice: form.discountPrice,
        currency: currency,
        stockQuantity: form.stockQuantity,
        sku: form.sku,
        barcode: form.barcode as string,
        weight: form.weight,
        dimensions: form.dimensions,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        visibility: form.visibility,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        metaKeywords: form.metaKeywords,
        brandId: form.brandId,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId,
        // Include product images
        images: productImages.map(img => ({
          imageUrl: img.imageUrl,
          altText: img.altText || '',
          position: img.position
        })),
        // Include variants if present
        variants: form.variants
      };
      
      // Submit update using PUT (not PATCH) as per API implementation
      await productsApi.updateProduct(productId, updateData);
      
      toast.success("Success", {
        description: "Product updated successfully"
      });
      
      router.push('/products');
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error("Error", {
        description: error.message || "Failed to update product"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle product deletion
  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await productsApi.deleteProduct(productId);
      
      toast.success("Success", {
        description: "Product deleted successfully"
      });
      
      router.push('/products');
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error("Error", {
        description: error.message || "Failed to delete product"
      });
      setDeleteDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate SKU for product
  const generateSku = (title: string): string => {
    if (!title.trim()) return "";
    
    // Extract prefix from title (first 3 characters, uppercase)
    const prefix = title
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    
    // Add timestamp and random string for uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return `${prefix}-${timestamp}-${random}`;
  };

  // Update SKU when title changes if SKU is empty
  useEffect(() => {
    if (form.title && !form.sku) {
      handleChange("sku", generateSku(form.title));
    }
  }, [form.title, form.sku]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading product details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="flex flex-col h-full items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-destructive">
            <Info className="h-6 w-6" />
            <p className="font-medium">{error || "Product not found"}</p>
          </div>
          <Button onClick={() => router.push('/products')}>
            Go Back to Products
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/products" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Edit Product</h1>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push('/products')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
        </div>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  Basic product details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="title">Product Name <span className="text-destructive">*</span></Label>
                      <Input 
                        id="title" 
                        value={form.title || ""} 
                        onChange={e => handleChange("title", e.target.value)} 
                        placeholder="Enter product name" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="sku">SKU <span className="text-destructive">*</span></Label>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs"
                          onClick={() => form.title && handleChange("sku", generateSku(form.title))}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <Input 
                        id="sku" 
                        value={form.sku || ""} 
                        onChange={e => handleChange("sku", e.target.value)} 
                        placeholder="Enter SKU code" 
                        required 
                      />
                      <p className="text-xs text-muted-foreground">
                        SKU is auto-generated based on the product title, but you can edit it manually
                      </p>
                    </div>

                  <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input 
                        id="barcode" 
                        value={form.barcode || ""} 
                        onChange={e => handleChange("barcode", e.target.value)} 
                        placeholder="Enter barcode (optional)" 
                      />
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="brandId">Brand</Label>
                      <Select 
                        value={form.brandId || ""} 
                        onValueChange={value => handleChange("brandId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <Select 
                        value={categoryId}
                        onValueChange={handleCategoryChange}
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subCategoryId">Subcategory</Label>
                      <Select 
                        value={subCategoryId}
                        onValueChange={value => {
                          setSubCategoryId(value);
                          handleChange("subCategoryId", value);
                        }}
                        disabled={!categoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={categoryId ? "Select subcategory" : "Select a category first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {subCategories
                            .filter(subCat => subCat.parentId === categoryId)
                            .map((subCategory) => (
                              <SelectItem key={subCategory.id} value={subCategory.id}>
                                {subCategory.name}
                              </SelectItem>
                            ))
                          }
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="price">Price <span className="text-destructive">*</span></Label>
                        <Select 
                          value={currency} 
                          onValueChange={setCurrency}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="USD" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCurrencyOptions().map((curr) => (
                              <SelectItem key={curr.value} value={curr.value}>
                                {curr.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {getCurrencySymbol(currency)}
                        </span>
                    <Input 
                      id="price" 
                      type="number"
                      step="0.01" 
                          value={form.price?.toString() || ""} 
                          onChange={e => handleChange("price", parseFloat(e.target.value))} 
                      placeholder="0.00" 
                          className="pl-7"
                          required
                          min="0"
                    />
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="discountPrice">Discount Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {getCurrencySymbol(currency)}
                        </span>
                        <Input 
                          id="discountPrice" 
                          type="number"
                          step="0.01" 
                          value={form.discountPrice?.toString() || ""} 
                          onChange={e => handleChange("discountPrice", e.target.value ? parseFloat(e.target.value) : null)} 
                          placeholder="0.00" 
                          className="pl-7"
                          min="0"
                        />
                      </div>
                  </div>
                                
                  <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Textarea 
                        id="shortDescription" 
                        rows={2}
                        value={form.shortDescription || ""} 
                        onChange={e => handleChange("shortDescription", e.target.value)}
                        placeholder="Brief product description" 
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Full Description</Label>
                    <Textarea 
                      id="description" 
                      rows={5}
                        value={form.description || ""} 
                        onChange={e => handleChange("description", e.target.value)}
                        placeholder="Detailed product description" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
                <CardDescription>
                  Technical details and measurements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="weight">Weight (g)</Label>
                      <Input 
                        id="weight" 
                        type="number"
                        step="0.1" 
                        value={form.weight?.toString() || ""} 
                        onChange={e => handleChange("weight", parseFloat(e.target.value))} 
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="length">Length (cm)</Label>
                    <Input 
                      id="length" 
                      type="number"
                      step="0.1" 
                        value={form.dimensions?.length?.toString() || ""} 
                        onChange={e => handleChange("dimensions", {
                          ...form.dimensions,
                          length: parseFloat(e.target.value)
                        })} 
                        min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="width">Width (cm)</Label>
                    <Input 
                      id="width" 
                      type="number"
                      step="0.1" 
                        value={form.dimensions?.width?.toString() || ""} 
                        onChange={e => handleChange("dimensions", {
                          ...form.dimensions,
                          width: parseFloat(e.target.value)
                        })} 
                        min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                    <Input 
                      id="height" 
                      type="number"
                      step="0.1" 
                        value={form.dimensions?.height?.toString() || ""} 
                        onChange={e => handleChange("dimensions", {
                          ...form.dimensions,
                          height: parseFloat(e.target.value)
                        })} 
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>
                    Search engine optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input 
                        id="metaTitle" 
                        value={form.metaTitle || ""} 
                        onChange={e => handleChange("metaTitle", e.target.value)} 
                        placeholder="SEO title" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea 
                        id="metaDescription" 
                        rows={2}
                        value={form.metaDescription || ""} 
                        onChange={e => handleChange("metaDescription", e.target.value)}
                        placeholder="SEO description" 
                    />
                  </div>
                  
                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input 
                        id="metaKeywords" 
                        value={form.metaKeywords || ""} 
                        onChange={e => handleChange("metaKeywords", e.target.value)} 
                        placeholder="keyword1, keyword2, keyword3" 
                    />
                      <p className="text-sm text-muted-foreground">Separate keywords with commas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>
                  Stock and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Stock Quantity <span className="text-destructive">*</span></Label>
                  <Input 
                      id="stockQuantity" 
                    type="number" 
                      value={form.stockQuantity?.toString() || "0"} 
                      onChange={e => handleChange("stockQuantity", parseInt(e.target.value))}
                      required
                      min="0" 
                  />
                </div>
                
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Product Status</h3>
                <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="active">Active</Label>
                          <p className="text-sm text-muted-foreground">
                            Product is visible and purchasable
                          </p>
                        </div>
                        <Switch 
                          id="active"
                          checked={form.isActive}
                          onCheckedChange={checked => handleChange("isActive", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="featured">Featured</Label>
                          <p className="text-sm text-muted-foreground">
                            Show in featured sections
                          </p>
                        </div>
                        <Switch 
                          id="featured"
                          checked={form.isFeatured}
                          onCheckedChange={checked => handleChange("isFeatured", checked)}
                        />
                      </div>
                
                      <div className="space-y-2">
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select 
                          value={form.visibility} 
                          onValueChange={value => handleChange("visibility", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Public (visible to all)</SelectItem>
                            <SelectItem value="PRIVATE">Private (restricted access)</SelectItem>
                            <SelectItem value="HIDDEN">Hidden (not visible in listings)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
            
            <Card ref={imagesRef}>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Product photos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  folder="products"
                  multiple={true}
                  maxSizeMB={10}
                  allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                  value={productImages
                    .filter(img => img && img.imageUrl)
                    .map((img, index) => {
                      // Try to detect mimetype from URL extension
                      const url = img.imageUrl.toLowerCase();
                      let mimetype = 'image/jpeg'; // default
                      if (url.includes('.png')) mimetype = 'image/png';
                      else if (url.includes('.gif')) mimetype = 'image/gif';
                      else if (url.includes('.webp')) mimetype = 'image/webp';
                      else if (url.includes('.svg')) mimetype = 'image/svg+xml';
                      
                      return {
                        key: `product-image-${img.position || index}-${img.imageUrl.substring(img.imageUrl.lastIndexOf('/') + 1)}`,
                        url: img.imageUrl,
                        originalName: img.altText || `Product image ${index + 1}`,
                        mimetype,
                        size: 1024 // Placeholder size
                      };
                    })}
                  onFilesChange={handleFilesChange}
                  onSuccess={handleUploadSuccess}
                  onError={handleUploadError}
                  placeholder="Drag and drop product images here or click to browse"
                  dragText="Drop product images here to upload"
                  browseText="Browse Images"
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Add Specifications Section */}
        <div className="mt-8">
          <Tabs defaultValue="view" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Specifications</h2>
              <TabsList>
                <TabsTrigger value="view">View</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="view" className="mt-0">
              <ProductSpecificationsDisplay productId={productId} />
            </TabsContent>
            
            <TabsContent value="edit" className="mt-0">
              <ProductSpecificationsForm 
                productId={productId} 
                categoryId={categoryId} 
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <Card className="border-destructive/50 mt-8">
          <CardHeader className="text-destructive">
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Actions that can't be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Product</h3>
                <p className="text-sm text-muted-foreground">Permanently remove this product from the catalog</p>
              </div>
                <Button 
                  variant="destructive"
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={submitting}
                >
                Delete Product
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </form>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{product.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
} 