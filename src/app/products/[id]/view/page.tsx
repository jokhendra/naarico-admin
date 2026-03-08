"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  Tag, 
  BarChart2, 
  Star, 
  AlertCircle,
  Trash2,
  Calendar,
  DollarSign, 
  Info,
  Eye,
  ShoppingBag,
  Layers,
  X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productsApi, Product, ProductImage } from "@/lib/api/products-api";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { getCurrencySymbol } from "@/lib/utils";
import { toast } from "sonner";
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

export default function ProductViewPage() {
  // Use the useParams hook to get the ID parameter from the URL
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await productsApi.getProductById(productId);
        console.log("Product data:", productData);
        setProduct(productData);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError(error.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);

  const handleImagePreview = (image: ProductImage) => {
    setPreviewImage(image);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete || !imageToDelete.id || !product) return;
    
    try {
      setDeleteLoading(true);
      await productsApi.deleteProductImage(productId, imageToDelete.id);
      
      // Update the product state by filtering out the deleted image
      setProduct({
        ...product,
        images: product.images?.filter(img => img.id !== imageToDelete.id) || []
      });
      
      toast.success("Image deleted successfully");
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error(error.message || "Failed to delete image");
    } finally {
      setDeleteLoading(false);
      setImageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDeleteImage = (image: ProductImage) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
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
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Stock</Badge>
    );
  };

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

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => router.push('/products')}
          >
            Back to Products
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p>Product not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/products" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            {getStatusBadge(product)}
            {product.isFeatured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/products/${productId}/variants/new`}>
              <Button variant="outline">
                <Layers className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </Link>
            <Link href={`/products/${productId}/tags`}>
              <Button variant="outline">
                <Tag className="mr-2 h-4 w-4" />
                Manage Tags
              </Button>
            </Link>
            <Link href={`/products/${productId}/deals`}>
              <Button variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Add to Deal
              </Button>
            </Link>
            <Link href={`/products/${productId}`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images ({product.images?.length || 0})</TabsTrigger>
            <TabsTrigger value="variants">Variants ({product.variants?.length || 0})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviews?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-5">
            <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{product.title}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        {product.category && (
                          <Badge variant="outline">{product.category.name}</Badge>
                        )}
                        {product.brand && (
                          <Badge variant="outline">{product.brand.name}</Badge>
                        )}
                        <Badge variant="outline">{product.visibility}</Badge>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {product.discountPrice ? (
                        <div>
                          <span className="line-through text-muted-foreground text-lg">
                            {getCurrencySymbol(product.currency || 'USD')}{parseFloat(product.price.toString()).toFixed(2)}
                          </span>
                          <span className="ml-2 text-green-600 font-medium">
                            {getCurrencySymbol(product.currency || 'USD')}{parseFloat(product.discountPrice.toString()).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span>{getCurrencySymbol(product.currency || 'USD')}{parseFloat(product.price.toString()).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {product.description && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Product Description</h3>
                      <p>{product.description}</p>
                    </div>
                  )}
                  
                  {product.shortDescription && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Short Description</h3>
                      <p>{product.shortDescription}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">SKU</p>
                      <p className="font-medium">{product.sku}</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="font-medium">{product.stockQuantity} units</p>
                    </div>
                    {product.weight && (
                      <div className="border rounded-md p-3">
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="font-medium">{product.weight} {product.dimensions?.unit || 'kg'}</p>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="border rounded-md p-3">
                        <p className="text-xs text-muted-foreground">Dimensions</p>
                        <p className="font-medium">
                          {product.dimensions.length}" × {product.dimensions.width}" × {product.dimensions.height}"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm">Created</span>
                      </div>
                      <p className="text-sm">{format(new Date(product.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm">Last Updated</span>
                      </div>
                      <p className="text-sm">{format(new Date(product.updatedAt), 'MMM d, yyyy')}</p>
                    </div>
                    {product.averageRating !== undefined && product.averageRating > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-muted-foreground">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm">Rating</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-1">{product.averageRating.toFixed(1)}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.round(product.averageRating || 0) ? "fill-primary text-primary" : "text-gray-300"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground ml-1">({product.reviewCount || 0})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.images && product.images.length > 0 ? (
                    <div className="space-y-4">
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        <Image 
                          src={product.images[0].imageUrl} 
                          alt={product.images[0].altText || product.title}
                          width={300}
                          height={300}
                          className="object-cover"
                        />
                      </div>
                      
                      {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {product.images.slice(1, 5).map((image) => (
                            <div 
                              key={image.id} 
                              className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden"
                            >
                              <Image 
                                src={image.imageUrl} 
                                alt={image.altText || product.title}
                                width={80}
                                height={80}
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No images available</p>
                      <Link href={`/products/${productId}`} className="mt-4">
                        <Button size="sm" variant="outline">Add Images</Button>
                      </Link>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Meta Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Meta Title:</span>
                        <p>{product.metaTitle || product.title}</p>
                      </div>
                      {product.metaDescription && (
                        <div>
                          <span className="text-muted-foreground">Meta Description:</span>
                          <p>{product.metaDescription}</p>
                        </div>
                      )}
                      {product.metaKeywords && (
                        <div>
                          <span className="text-muted-foreground">Meta Keywords:</span>
                          <p>{product.metaKeywords}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tags Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </div>
                <Link href={`/products/${productId}/tags`}>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Manage Tags
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {product.tags && product.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No tags assigned to this product</p>
                )}
              </CardContent>
            </Card>
            
            {/* Deals Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Special Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.deals && product.deals.length > 0 ? (
                  <div className="space-y-4">
                    {product.deals.map((deal) => (
                      <div key={deal.id} className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <h4 className="font-medium">{deal.dealType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(deal.startTime), 'MMM d, yyyy')} - {format(new Date(deal.endTime), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge>{deal.discount}% OFF</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <p className="text-muted-foreground">No active deals for this product</p>
                    <Link href={`/products/${productId}/deals`}>
                      <Button size="sm" variant="outline" className="mt-2">
                        Add to Deal
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Product Images</CardTitle>
                  <Link href={`/products/${productId}?tab=images`}>
                    <Button size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Manage Images
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {product.images && product.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          <Image 
                            src={image.imageUrl} 
                            alt={image.altText || product.title}
                            width={200}
                            height={200}
                            className="object-cover"
                          />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-white"
                              onClick={() => handleImagePreview(image)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-white hover:text-red-500" 
                              onClick={() => confirmDeleteImage(image)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Position: {image.position}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <Package className="h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No images available for this product</p>
                    <Link href={`/products/${productId}?tab=images`}>
                      <Button className="mt-4">Add Images</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Product Variants</CardTitle>
                  <Link href={`/products/${productId}/variants/new`}>
                    <Button size="sm">
                      <Layers className="mr-2 h-4 w-4" />
                      Add Variant
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {product.variants && product.variants.length > 0 ? (
                  <div className="space-y-4">
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{variant.variantName}</h3>
                            <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{getCurrencySymbol(product.currency || 'USD')}{parseFloat(variant.price.toString()).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Stock: {variant.stockQuantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <Layers className="h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No variants available for this product</p>
                    <Link href={`/products/${productId}/variants/new`}>
                      <Button className="mt-4">Add Variant</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>
                  {product.reviewCount 
                    ? `${product.reviewCount} review${product.reviewCount !== 1 ? 's' : ''} with an average rating of ${product.averageRating?.toFixed(1) || '0.0'}`
                    : 'No reviews yet for this product'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-gray-300"}`} />
                                ))}
                              </div>
                              <span className="ml-2 font-medium">
                                {review.user.firstName} {review.user.lastName}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <Star className="h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No reviews available for this product</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-background rounded-lg shadow-lg p-4 overflow-hidden">
            <Button 
              className="absolute right-2 top-2 rounded-full w-8 h-8 p-0 z-10"
              onClick={handleClosePreview}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <Image 
                  src={previewImage.imageUrl}
                  alt={previewImage.altText || "Product image"}
                  width={800}
                  height={800}
                  className="max-h-[80vh] object-contain"
                />
              </div>
              
              <div className="pt-4 space-y-2">
                {previewImage.altText && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Alt Text:</span> {previewImage.altText}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Position:</span> {previewImage.position}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteImage}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
} 