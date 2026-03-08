"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Smartphone,
  Monitor,
  Search,
  ListTree,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { getSafeImageSrc } from '@/lib/utils';
import { PreviewProduct } from '@/hooks/useProductPreview';

interface ProductPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: PreviewProduct;
}

export function ProductPreviewModal({ 
  open, 
  onOpenChange,
  product 
}: ProductPreviewModalProps) {
  // State for toggling between mobile and desktop views
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  // Track active context
  const [activeContext, setActiveContext] = useState<'storefront' | 'search' | 'category'>('storefront');

  // Helper to format the price with currency
  const formatPrice = (price: string, currency: string) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '';
    
    switch (currency) {
      case 'USD':
        return `$${numericPrice.toFixed(2)}`;
      case 'EUR':
        return `€${numericPrice.toFixed(2)}`;
      case 'GBP':
        return `£${numericPrice.toFixed(2)}`;
      case 'INR':
        return `₹${numericPrice.toFixed(2)}`;
      case 'JPY':
        return `¥${Math.round(numericPrice)}`;
      default:
        return `${numericPrice.toFixed(2)} ${currency}`;
    }
  };

  // Calculate discount percentage if there's a discount price
  const discountPercentage = (() => {
    if (!product.discountPrice) return null;
    
    const originalPrice = parseFloat(product.price);
    const discountPrice = parseFloat(product.discountPrice);
    
    if (isNaN(originalPrice) || isNaN(discountPrice) || discountPrice >= originalPrice) {
      return null;
    }
    
    const discount = ((originalPrice - discountPrice) / originalPrice) * 100;
    return Math.round(discount);
  })();

  // Function to open preview in a new window
  const openInNewWindow = () => {
    const previewWindow = window.open('', '_blank', 'width=1024,height=768');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
        <head>
          <title>Product Preview: ${product.title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
            img { max-width: 100%; height: auto; }
            .container { max-width: 1200px; margin: 0 auto; }
            .product-title { font-size: 24px; margin-bottom: 10px; }
            .product-image { max-width: 100%; max-height: 500px; object-fit: contain; }
            .product-price { font-size: 18px; font-weight: bold; margin: 10px 0; }
            .product-description { line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="product-title">${product.title}</h1>
            ${product.images && product.images.length > 0 ? 
              `<img src="${product.images[0].imageUrl}" alt="${product.images[0].altText || product.title}" class="product-image">` : 
              '<div style="background: #eee; height: 300px; display: flex; align-items: center; justify-content: center;">No image available</div>'
            }
            <div class="product-price">
              ${product.discountPrice ? 
                `<span style="color: red">${formatPrice(product.discountPrice, product.currency)}</span> 
                 <span style="text-decoration: line-through; color: #777">${formatPrice(product.price, product.currency)}</span>` : 
                formatPrice(product.price, product.currency)
              }
            </div>
            ${product.shortDescription ? `<p>${product.shortDescription}</p>` : ''}
            <div class="product-description">${product.description}</div>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Product Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                onClick={() => setViewMode('desktop')}
                className="h-8 w-8 p-0"
              >
                <Monitor className="h-4 w-4" />
                <span className="sr-only">Desktop view</span>
              </Button>
              <Button
                size="sm" 
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                onClick={() => setViewMode('mobile')}
                className="h-8 w-8 p-0"
              >
                <Smartphone className="h-4 w-4" />
                <span className="sr-only">Mobile view</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={activeContext} onValueChange={(val) => setActiveContext(val as any)}>
          <div className="border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="storefront">
                <ShoppingBag className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Product Page</span>
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Search Results</span>
              </TabsTrigger>
              <TabsTrigger value="category">
                <ListTree className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Category View</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Storefront (Product Page) Preview */}
          <TabsContent value="storefront" className="mt-0">
            <div className={`p-4 ${viewMode === 'mobile' ? 'max-w-[360px] mx-auto' : ''}`}>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Product images */}
                <div className={`${viewMode === 'desktop' ? 'w-1/2' : 'w-full'}`}>
                  <div className="aspect-square relative bg-slate-100 rounded-md overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getSafeImageSrc(product.images[0].imageUrl)}
                        alt={product.images[0].altText || product.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  {/* Thumbnail row */}
                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      {product.images.slice(0, 4).map((image, i) => (
                        <div 
                          key={i} 
                          className="aspect-square w-16 relative border rounded overflow-hidden"
                        >
                          <img
                            src={getSafeImageSrc(image.imageUrl)}
                            alt={image.altText || `${product.title} thumbnail ${i}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                      {product.images.length > 4 && (
                        <div className="aspect-square w-16 flex items-center justify-center bg-muted rounded text-xs">
                          +{product.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Product details */}
                <div className={`${viewMode === 'desktop' ? 'w-1/2' : 'w-full'}`}>
                  {/* Brand */}
                  {product.brand?.name && (
                    <div className="text-sm text-muted-foreground mb-1">
                      {product.brand.name}
                    </div>
                  )}
                  
                  {/* Title */}
                  <h1 className="text-2xl font-semibold mb-2">{product.title}</h1>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.isFeatured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                    {!product.isActive && (
                      <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                    )}
                    {discountPercentage && (
                      <Badge variant="destructive">-{discountPercentage}%</Badge>
                    )}
                  </div>
                  
                  {/* Pricing */}
                  <div className="mb-4">
                    {product.discountPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {formatPrice(product.discountPrice, product.currency)}
                        </span>
                        <span className="text-muted-foreground line-through">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    )}
                  </div>
                  
                  {/* Short description */}
                  {product.shortDescription && (
                    <p className="text-muted-foreground mb-6">{product.shortDescription}</p>
                  )}
                  
                  {/* Add to cart button - non-functional in preview */}
                  <Button className="w-full mb-4">Add to Cart</Button>
                  
                  {/* Category */}
                  {product.category?.name && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Category:</span> {product.category.name}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description section */}
              {product.description && (
                <div className="mt-8 pt-6 border-t">
                  <h2 className="text-lg font-semibold mb-3">Product Description</h2>
                  <div className="prose max-w-none text-muted-foreground">
                    {product.description}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Search Results Preview */}
          <TabsContent value="search" className="mt-0">
            <div className={`p-4 ${viewMode === 'mobile' ? 'max-w-[360px] mx-auto' : ''}`}>
              <Label className="mb-2 block text-muted-foreground">Search Results View</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current product card */}
                <Card className="overflow-hidden border-2 border-primary">
                  <div className="aspect-[4/3] relative bg-slate-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getSafeImageSrc(product.images[0].imageUrl)}
                        alt={product.images[0].altText || product.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        No image
                      </div>
                    )}
                    {discountPercentage && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        -{discountPercentage}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium line-clamp-1">{product.title}</h3>
                    {product.brand?.name && (
                      <div className="text-xs text-muted-foreground">{product.brand.name}</div>
                    )}
                    <div className="mt-2">
                      {product.discountPrice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            {formatPrice(product.discountPrice, product.currency)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.price, product.currency)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Placeholder products */}
                {Array(2).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden opacity-50">
                    <div className="aspect-[4/3] bg-slate-100"></div>
                    <CardContent className="p-3">
                      <div className="h-5 w-4/5 bg-muted rounded mb-1.5"></div>
                      <div className="h-3 w-2/3 bg-muted rounded mb-2"></div>
                      <div className="h-4 w-1/3 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Category View Preview */}
          <TabsContent value="category" className="mt-0">
            <div className={`p-4 ${viewMode === 'mobile' ? 'max-w-[360px] mx-auto' : ''}`}>
              <div className="mb-4">
                <Label className="mb-2 block text-muted-foreground">Category Page View</Label>
                <div className="flex items-center space-x-1 text-sm font-medium">
                  <span>Home</span>
                  <span>/</span>
                  {product.category?.name && (
                    <>
                      <span>{product.category.name}</span>
                      <span>/</span>
                    </>
                  )}
                  <span className="text-muted-foreground">{product.title}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Filter sidebar */}
                <Card className="hidden md:block p-3 h-[300px]">
                  <div className="font-medium mb-2">Filters</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="h-4 w-4/5 bg-muted rounded"></div>
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-4 w-4/5 bg-muted rounded"></div>
                    <div className="h-4 w-2/3 bg-muted rounded"></div>
                  </div>
                </Card>
                
                {/* Product grid */}
                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Current product card */}
                  <Card className="overflow-hidden border-2 border-primary">
                    <div className="aspect-square relative bg-slate-100">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getSafeImageSrc(product.images[0].imageUrl)}
                          alt={product.images[0].altText || product.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                          No image
                        </div>
                      )}
                      {discountPercentage && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                          -{discountPercentage}%
                        </Badge>
                      )}
                      {product.isFeatured && (
                        <Badge variant="secondary" className="absolute top-2 left-2">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium line-clamp-1">{product.title}</h3>
                      {product.shortDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {product.shortDescription}
                        </p>
                      )}
                      <div className="mt-2">
                        {product.discountPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">
                              {formatPrice(product.discountPrice, product.currency)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.price, product.currency)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold">
                            {formatPrice(product.price, product.currency)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Placeholder products */}
                  {Array(viewMode === 'mobile' ? 1 : 5).fill(0).map((_, i) => (
                    <Card key={i} className="overflow-hidden opacity-50">
                      <div className="aspect-square bg-slate-100"></div>
                      <CardContent className="p-3">
                        <div className="h-5 w-4/5 bg-muted rounded mb-1.5"></div>
                        <div className="h-3 w-full bg-muted rounded mb-2"></div>
                        <div className="h-4 w-1/3 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <div className="w-full flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Preview Mode • {viewMode === 'desktop' ? 'Desktop View' : 'Mobile View'}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 gap-1.5"
              onClick={openInNewWindow}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in new tab</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
