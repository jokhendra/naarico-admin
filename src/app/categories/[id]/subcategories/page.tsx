"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, PlusCircle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Mock function to get category by ID
async function getCategoryById(id: string) {
  const categories = [
    {
      id: "cat-1",
      name: "Electronics",
      slug: "electronics",
      subcategories: [
        { 
          id: "subcat-1", 
          name: "Smartphones", 
          slug: "smartphones", 
          products: 45,
          description: "Mobile phones and smartphones",
          featured: true
        },
        { 
          id: "subcat-2", 
          name: "Laptops", 
          slug: "laptops", 
          products: 32,
          description: "Laptops and notebooks",
          featured: true
        },
        { 
          id: "subcat-3", 
          name: "Audio", 
          slug: "audio", 
          products: 28,
          description: "Headphones, speakers and audio equipment",
          featured: false
        },
        { 
          id: "subcat-4", 
          name: "Accessories", 
          slug: "accessories", 
          products: 19,
          description: "Cables, chargers and other accessories",
          featured: false
        },
        { 
          id: "subcat-5", 
          name: "Cameras", 
          slug: "cameras", 
          products: 12,
          description: "Digital cameras and photography equipment",
          featured: true
        }
      ]
    },
    {
      id: "cat-2",
      name: "Clothing",
      slug: "clothing",
      subcategories: [
        { 
          id: "subcat-6", 
          name: "Men's", 
          slug: "mens", 
          products: 37,
          description: "Men's clothing and apparel",
          featured: true
        },
        { 
          id: "subcat-7", 
          name: "Women's", 
          slug: "womens", 
          products: 42,
          description: "Women's clothing and apparel",
          featured: true
        },
        { 
          id: "subcat-8", 
          name: "Children's", 
          slug: "childrens", 
          products: 10,
          description: "Children's clothing and apparel",
          featured: false
        }
      ]
    }
  ];

  // Simulate async behavior
  await new Promise(resolve => setTimeout(resolve, 10));
  return categories.find(category => category.id === id) || categories[0];
}

type Subcategory = {
  id: string;
  name: string;
  slug: string;
  products: number;
  description: string;
  featured: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

export default function SubcategoriesPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const categoryData = await getCategoryById(categoryId);
        setCategory(categoryData as Category);
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategory();
  }, [categoryId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p>Loading subcategories...</p>
        </div>
      </MainLayout>
    );
  }

  if (!category) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p>Category not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/categories/${categoryId}/view`} className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">{category.name} Subcategories</h1>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subcategory
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Subcategories</CardTitle>
            <CardDescription>
              View and manage subcategories for {category.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">{subcategory.name}</TableCell>
                    <TableCell>{subcategory.slug}</TableCell>
                    <TableCell>
                      <span className="line-clamp-1">
                        {subcategory.description}
                      </span>
                    </TableCell>
                    <TableCell>{subcategory.products}</TableCell>
                    <TableCell>
                      <div className={`h-2.5 w-2.5 rounded-full ${subcategory.featured ? "bg-green-500" : "bg-gray-300"}`}></div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 