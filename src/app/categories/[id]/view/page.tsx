"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash, FolderPlus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { categoriesApi, CategoryDetail } from "@/lib/api/categories-api";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const data = await categoriesApi.getCategoryById(categoryId);
        setCategory(data);
      } catch (error: any) {
        console.error("Error fetching category:", error);
        setError(error.message || "Failed to load category details");
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }
    
    try {
      await categoriesApi.deleteCategory(categoryId);
      router.push("/categories");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert(`Failed to delete category: ${error.message}`);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/categories" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">
              {loading ? "Loading..." : category?.name || "Category Details"}
            </h1>
          </div>
          
          {!loading && category && (
            <div className="flex gap-2">
              <Link href={`/categories/${categoryId}`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
        
        {error ? (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/categories")}
              >
                Go Back
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p>Loading category details...</p>
            </div>
          </div>
        ) : category ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Category Information</CardTitle>
                  <CardDescription>Detailed information about this category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                      <p className="text-base">{category.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Slug</h3>
                      <p className="text-base">{category.slug}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                      <p className="text-base">{new Date(category.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                      <p className="text-base">{new Date(category.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="text-base">{category.description || 'No description provided'}</p>
                  </div>
                </CardContent>
              </Card>
              
              {category.children && category.children.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Subcategories</CardTitle>
                    <CardDescription>Categories that belong to this parent category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {category.children.map((child) => (
                        <Link 
                          key={child.id} 
                          href={`/categories/${child.id}/view`}
                          className="p-3 border rounded-md hover:bg-muted flex items-center gap-2"
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center text-xs">
                            {child.icon ? (
                              <img src={child.icon} alt={child.name} className="w-full h-full object-cover" />
                            ) : (
                              child.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <span>{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Category Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Parent Category</h3>
                    {category.parent ? (
                      <Link href={`/categories/${category.parent.id}/view`} className="text-primary hover:underline">
                        {category.parent.name}
                      </Link>
                    ) : (
                      <Badge variant="outline">Root Category</Badge>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Subcategories</h3>
                    <p className="text-base">{category.children?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Products</h3>
                    <p className="text-base">{category.productCount || 0}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Icon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md aspect-square flex items-center justify-center bg-muted">
                    {category.icon ? (
                      <img 
                        src={category.icon} 
                        alt={category.name} 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <FolderPlus className="h-10 w-10 mb-2" />
                        <p className="text-sm">No icon available</p>
                      </div>
                    )}
                  </div>
                  {category.icon && (
                    <p className="text-xs text-muted-foreground mt-2 break-all">{category.icon}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-md">
            Category not found
          </div>
        )}
      </div>
    </MainLayout>
  );
} 