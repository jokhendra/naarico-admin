"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FolderTree, PlusCircle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categoriesApi, Category } from "@/lib/api/categories-api";

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoriesApi.getCategories();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('Unexpected data format:', data);
          setCategories([]);
          setError('Received invalid data format from server');
        }
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        setError(error.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Filter categories based on search term
  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(category => 
        category && category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE) || 1;

  const paginated = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Helper to get parent category name
  const getParentName = (parentId: string | null): string | null => {
    if (!parentId) return null;
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : null;
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Categories</h1>
          <Link href="/categories/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Categories</CardTitle>
            <CardDescription>
              View and manage all product categories in your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p>Loading categories...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          {searchTerm ? "No matching categories found" : "No categories available"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <Link href={`/categories/${category.id}/view`} className="flex items-center gap-2 hover:underline">
                              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-xs overflow-hidden">
                                {category.icon ? (
                                  <img src={category.icon} alt={category.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FolderTree className="h-4 w-4" />
                                )}
                              </div>
                              {category.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {category.parentId ? (
                              getParentName(category.parentId) ? (
                                <span className="text-muted-foreground">{getParentName(category.parentId)}</span>
                              ) : (
                                <span className="text-muted-foreground">Parent N/A</span>
                              )
                            ) : (
                              <Badge variant="outline">Root Category</Badge>
                            )}
                          </TableCell>
                          <TableCell>{category.productCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Link href={`/categories/${category.id}/view`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                              View
                            </Link>
                            <Link href={`/categories/${category.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                              Edit
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredCategories.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 