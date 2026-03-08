"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SpecificationTemplateForm } from "@/components/SpecificationTemplateForm";
import { categoriesApi } from "@/lib/api/categories-api";
import { MainLayout } from "@/components/MainLayout";

export default function CategoryTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<{ id: string; name: string } | null>(null);
  
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        const data = await categoriesApi.getCategoryById(categoryId);
        setCategory({ 
          id: data.id,
          name: data.name
        });
      } catch (error) {
        console.error("Failed to load category", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);
  
  const handleBackClick = () => {
    router.back();
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {loading ? "Loading..." : `Specification Templates for ${category?.name || ""}`}
          </h1>
          <p className="text-muted-foreground">
            Create and manage specification templates for this category
          </p>
        </div>
        
        <Separator />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <SpecificationTemplateForm 
            categoryId={categoryId} 
          />
        )}
      </div>
    </MainLayout>
  );
} 