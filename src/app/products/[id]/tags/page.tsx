"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Search, Tag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { productsApi, Product } from "@/lib/api/products-api";
import { tagsApi, Tag as TagType } from "@/lib/api/tags-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function ProductTagsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get the product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        const data = await productsApi.getProductById(productId);
        setProduct(data);
        
        // Initialize selected tags based on product's current tags
        if (data.tags && data.tags.length > 0) {
          setSelectedTagIds(data.tags.map(tag => tag.id));
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details. Please try again.");
      } finally {
        setProductLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  // Fetch all available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const data = await tagsApi.getTags();
        setTags(data);
      } catch (error: any) {
        console.error("Error fetching tags:", error);
        setError("Failed to load tags. Please try again.");
      } finally {
        setTagsLoading(false);
      }
    };
    
    fetchTags();
  }, []);
  
  // Handle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };
  
  // Filter tags based on search term
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Save tags
  const handleSaveTags = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Use the dedicated tags API endpoint
      await productsApi.updateProductTags(productId, selectedTagIds);
      
      setSuccess(true);
      
      // Navigate back to product view after successful update
      setTimeout(() => {
        router.push(`/products/${productId}/view`);
      }, 1500);
    } catch (error: any) {
      console.error("Error updating product tags:", error);
      setError(error.message || "Failed to update product tags. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/products/${productId}/view`} className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Manage Product Tags</h1>
          </div>
          <Button
            onClick={handleSaveTags}
            disabled={isSaving || productLoading || tagsLoading}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">◌</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Tags
              </>
            )}
          </Button>
        </div>
        
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
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-50 dark:border-green-800">
            <AlertDescription>Tags updated successfully! Redirecting...</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Current Tags
            </CardTitle>
            <CardDescription>
              Tags currently assigned to this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTagIds.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTagIds.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge key={tag.id} variant="outline" className="flex items-center gap-1 px-3 py-1">
                      {tag.name}
                      <button 
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        onClick={() => toggleTag(tag.id)}
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">No tags currently assigned to this product</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Tags</CardTitle>
            <CardDescription>
              Select tags to assign to this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {tagsLoading ? (
              <p className="text-muted-foreground">Loading tags...</p>
            ) : filteredTags.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredTags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2 border rounded-md p-2">
                    <Checkbox 
                      id={`tag-${tag.id}`} 
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="flex-1 cursor-pointer">{tag.name}</Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {searchTerm ? "No tags matching your search" : "No tags available"}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/tags/new">Create New Tag</Link>
            </Button>
            <Button onClick={handleSaveTags} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Tags
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
} 