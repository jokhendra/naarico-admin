"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Globe, Package, BarChart2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Mock function to get brand by ID
async function getBrandById(id: string) {
  const brands = [
    {
      id: "1",
      name: "TechGiant",
      logo: "techgiant-logo.png",
      website: "https://techgiant.com",
      description: "A leading technology company specializing in smartphones, laptops, and other electronic devices.",
      founded: "2005",
      headquarters: "San Francisco, CA",
      productsCount: 42,
      featured: true,
      status: "Active",
      socialMedia: {
        twitter: "techgiant",
        facebook: "techgiant",
        instagram: "techgiant"
      },
      categories: ["Electronics", "Computers", "Smartphones"],
      topProducts: [
        { id: "3", name: "Smartphone X", price: 899.99 },
        { id: "7", name: "Laptop Pro", price: 1299.99 },
        { id: "12", name: "Wireless Earbuds", price: 149.99 }
      ]
    },
    {
      id: "2",
      name: "FitLife",
      logo: "fitlife-logo.png",
      website: "https://fitlife.com",
      description: "Health and fitness brand creating innovative wearable technology and exercise equipment.",
      founded: "2012",
      headquarters: "Boston, MA",
      productsCount: 18,
      featured: true,
      status: "Active",
      socialMedia: {
        twitter: "fitlife",
        facebook: "fitlife",
        instagram: "fitlife"
      },
      categories: ["Wearables", "Fitness", "Health"],
      topProducts: [
        { id: "4", name: "Fitness Watch", price: 129.99 },
        { id: "15", name: "Smart Scale", price: 79.99 },
        { id: "22", name: "Workout Tracker", price: 99.99 }
      ]
    },
    {
      id: "3",
      name: "UrbanGear",
      logo: "urbangear-logo.png",
      website: "https://urbangear.com",
      description: "Urban lifestyle brand focusing on fashionable and functional bags, backpacks, and accessories.",
      founded: "2015",
      headquarters: "New York, NY",
      productsCount: 31,
      featured: false,
      status: "Active",
      socialMedia: {
        twitter: "urbangear",
        facebook: "urbangear",
        instagram: "urbangear"
      },
      categories: ["Fashion", "Accessories", "Bags"],
      topProducts: [
        { id: "5", name: "Designer Backpack", price: 79.99 },
        { id: "18", name: "Messenger Bag", price: 59.99 },
        { id: "27", name: "Travel Duffel", price: 89.99 }
      ]
    },
    {
      id: "4",
      name: "AudioTech",
      logo: "audiotech-logo.png",
      website: "https://audiotech.com",
      description: "Premium audio equipment manufacturer known for high-quality headphones and speakers.",
      founded: "2008",
      headquarters: "Los Angeles, CA",
      productsCount: 15,
      featured: true,
      status: "Active",
      socialMedia: {
        twitter: "audiotech",
        facebook: "audiotech",
        instagram: "audiotech"
      },
      categories: ["Electronics", "Audio", "Accessories"],
      topProducts: [
        { id: "1", name: "Premium Headphones", price: 199.99 },
        { id: "9", name: "Bluetooth Speaker", price: 149.99 },
        { id: "21", name: "Sound Bar", price: 299.99 }
      ]
    },
    {
      id: "5",
      name: "ComfortPlus",
      logo: "comfortplus-logo.png",
      website: "https://comfortplus.com",
      description: "Furniture brand specializing in ergonomic office and home solutions.",
      founded: "2010",
      headquarters: "Chicago, IL",
      productsCount: 24,
      featured: false,
      status: "Inactive",
      socialMedia: {
        twitter: "comfortplus",
        facebook: "comfortplus",
        instagram: "comfortplus"
      },
      categories: ["Furniture", "Office", "Home"],
      topProducts: [
        { id: "2", name: "Ergonomic Chair", price: 249.99 },
        { id: "11", name: "Standing Desk", price: 349.99 },
        { id: "19", name: "Lumbar Support Cushion", price: 39.99 }
      ]
    }
  ];

  // Simulate async behavior
  await new Promise(resolve => setTimeout(resolve, 10));
  return brands.find(brand => brand.id === id) || brands[0];
}

// Define brand type
interface Brand {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  founded: string;
  headquarters: string;
  productsCount: number;
  featured: boolean;
  status: string;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
  };
  categories: string[];
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export default function BrandViewPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setLoading(true);
        const brandData = await getBrandById(brandId);
        setBrand(brandData);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching brand:", error);
        setError(error.message || "Failed to load brand details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrand();
  }, [brandId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading brand details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-destructive text-lg">Error: {error}</p>
          <Button onClick={() => router.push('/brands')}>Back to Brands</Button>
        </div>
      </MainLayout>
    );
  }

  if (!brand) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-lg">Brand not found</p>
          <Button onClick={() => router.push('/brands')}>Back to Brands</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/brands" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Brand Details</h1>
          </div>
          <Link href={`/brands/${brandId}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Brand
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Brand Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center mb-4 overflow-hidden">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{brand.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <h2 className="text-xl font-bold">{brand.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  {brand.website.replace(/(^\w+:|^)\/\//, '')}
                </a>
              </div>
              <div className="mt-2 flex gap-2">
                <Badge variant={brand.status === "Active" ? "default" : "secondary"}>
                  {brand.status}
                </Badge>
                {brand.featured && (
                  <Badge variant="default">
                    Featured
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>
                Detailed brand profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p>{brand.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Founded</h3>
                    <p>{brand.founded}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Headquarters</h3>
                    <p>{brand.headquarters}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Products</h3>
                    <p>{brand.productsCount} products</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {brand.categories.map((category, index) => (
                      <Badge key={index} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Social Media</h3>
                  <div className="flex gap-3 mt-1">
                    {brand.socialMedia.twitter && (
                      <a href={`https://twitter.com/${brand.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
                        Twitter
                      </a>
                    )}
                    {brand.socialMedia.facebook && (
                      <a href={`https://facebook.com/${brand.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        Facebook
                      </a>
                    )}
                    {brand.socialMedia.instagram && (
                      <a href={`https://instagram.com/${brand.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best-selling products from this brand
                </CardDescription>
              </div>
              <Link href={`/products?brand=${brand.id}`}>
                <Button variant="outline" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  View All Products
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {brand.topProducts.map((product, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardContent className="p-4">
                      <Link href={`/products/${product.id}/view`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 