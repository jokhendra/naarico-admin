"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { brandsApi, Brand } from "@/lib/api/brands-api";

export default function BrandsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const data = await brandsApi.getBrands();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setBrands(data);
        } else {
          console.error('Unexpected data format:', data);
          setBrands([]);
          setError('Received invalid data format from server');
        }
      } catch (error: any) {
        console.error("Error fetching brands:", error);
        setBrands([]);
        setError(error.message || "Failed to load brands");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrands();
  }, []);
  
  // Filter brands based on search term
  // Ensure brands is an array before filtering
  const filteredBrands = Array.isArray(brands) 
    ? brands.filter(brand => 
        brand && brand.name && brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Brands</h1>
          <Link href="/brands/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Brands</CardTitle>
            <CardDescription>
              View and manage all product brands in your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search brands..."
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
                  <p>Loading brands...</p>
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
                      <TableHead>Brand</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          {searchTerm ? "No matching brands found" : "No brands available"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBrands.map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell className="font-medium">
                            <Link href={`/brands/${brand.id}/view`} className="flex items-center gap-2 hover:underline">
                              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-xs overflow-hidden">
                                {brand.logo ? (
                                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                ) : (
                                  brand.name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              {brand.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {brand.website ? (
                              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {brand.website.replace(/(^\w+:|^)\/\//, '')}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{brand.productCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Link href={`/brands/${brand.id}/view`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                              View
                            </Link>
                            <Link href={`/brands/${brand.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 