"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { categoriesApi, Category, CategoryDetail } from "@/lib/api/categories-api";
import { CategoryForm } from "@/components/CategoryForm";

export default function CategoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  
  // Fetch category and parent categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch category details
        const categoryData = await categoriesApi.getCategoryById(categoryId);
        setCategory(categoryData);
        
        // Fetch parent categories
        const categories = await categoriesApi.getCategories();
        // Filter out the current category to prevent self-reference
        const filteredCategories = categories.filter(cat => cat.id !== categoryId);
        setParentCategories(filteredCategories);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load category data");
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  // Handle form submission
  const handleSubmit = async (values: { name: string; description: string; parentId?: string; icon?: string }) => {
    if (!values.name.trim()) {
      setError("Category name is required");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Call API to update category
      const result = await categoriesApi.updateCategory(categoryId, values);
      console.log("Category updated successfully:", result);
      
      // Redirect to category view page
      router.push(`/categories/${categoryId}/view`);
    } catch (error: any) {
      console.error("Error updating category:", error);
      
      // Extract error message
      let errorMessage = "Failed to update category";
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid category data";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to update this category";
        } else if (error.response.status === 404) {
          errorMessage = "Category not found";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading category details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!category) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p>Category not found</p>
          <Button 
            variant="outline" 
            className="ml-4"
            onClick={() => router.push('/categories')}
          >
            Back to Categories
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/categories" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Edit Category</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/categories/${categoryId}/view`}>
              <Button variant="outline">View Category</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Edit Category</CardTitle>
            <CardDescription>
              Update the details of this category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm
              initialData={category}
              categories={parentCategories}
              onSubmit={handleSubmit}
              isSubmitting={saving}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 