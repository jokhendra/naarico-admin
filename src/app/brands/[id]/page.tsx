"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CsrfProtectedForm } from "@/components/form/CsrfProtectedForm";
import { useCsrf } from "@/contexts/CsrfContext";

// Mock function to get brand by ID (same as in view page)
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
      categories: ["Electronics", "Computers", "Smartphones"]
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
      categories: ["Wearables", "Fitness", "Health"]
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
      categories: ["Fashion", "Accessories", "Bags"]
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
      categories: ["Electronics", "Audio", "Accessories"]
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
      categories: ["Furniture", "Office", "Home"]
    }
  ];

  // Simulate async behavior
  await new Promise(resolve => setTimeout(resolve, 10));
  return brands.find(brand => brand.id === id) || brands[0];
}

// Form data type
interface BrandFormData {
  name: string;
  logo: string;
  website: string;
  description: string;
  founded: string;
  headquarters: string;
  featured: boolean;
  status: string;
  twitter: string;
  facebook: string;
  instagram: string;
}

export default function BrandEditPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  const { withCsrfProtection } = useCsrf();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    logo: '',
    website: '',
    description: '',
    founded: '',
    headquarters: '',
    featured: false,
    status: 'Active',
    twitter: '',
    facebook: '',
    instagram: ''
  });

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setLoading(true);
        const brandData = await getBrandById(brandId);
        
        // Initialize form data with brand data
        setFormData({
          name: brandData.name,
          logo: brandData.logo,
          website: brandData.website,
          description: brandData.description,
          founded: brandData.founded,
          headquarters: brandData.headquarters,
          featured: brandData.featured,
          status: brandData.status,
          twitter: brandData.socialMedia.twitter,
          facebook: brandData.socialMedia.facebook,
          instagram: brandData.socialMedia.instagram
        });
        
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      featured: checked
    }));
  };

  // Handle select changes
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    setSaving(true);
    
    try {
      // Use CSRF protection for brand update
      await withCsrfProtection(async () => {
        // TODO: Replace with real API call when implemented
        // await brandsApi.updateBrand(brandId, formData);
        
        // Simulate API call to update brand for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      // Navigate to brand view page
      router.push(`/brands/${brandId}/view`);
    } catch (error: any) {
      console.error("Error updating brand:", error);
      setError(error.message || "Failed to update brand");
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

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link href={`/brands/${brandId}/view`} className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Edit Brand</h1>
        </div>

        <CsrfProtectedForm onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>
                Update brand details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter brand name" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input 
                    id="website" 
                    type="url" 
                    value={formData.website} 
                    onChange={handleInputChange} 
                    placeholder="https://example.com" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input 
                    id="logo" 
                    value={formData.logo} 
                    onChange={handleInputChange} 
                    placeholder="Enter logo URL" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="founded">Founded Year</Label>
                  <Input 
                    id="founded" 
                    value={formData.founded} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 2010" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="headquarters">Headquarters</Label>
                  <Input 
                    id="headquarters" 
                    value={formData.headquarters} 
                    onChange={handleInputChange} 
                    placeholder="City, Country" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Enter brand description" 
                    rows={4} 
                  />
                </div>
                
                <div className="space-y-3 md:col-span-2">
                  <Label>Brand Settings</Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="featured" 
                      checked={formData.featured} 
                      onCheckedChange={handleSwitchChange} 
                    />
                    <Label htmlFor="featured" className="cursor-pointer">
                      Feature this brand on the storefront
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter Username</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                        @
                      </span>
                      <Input 
                        id="twitter" 
                        value={formData.twitter} 
                        onChange={handleInputChange} 
                        className="rounded-l-none" 
                        placeholder="username" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook Username</Label>
                    <Input 
                      id="facebook" 
                      value={formData.facebook} 
                      onChange={handleInputChange} 
                      placeholder="username or page ID" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Username</Label>
                    <Input 
                      id="instagram" 
                      value={formData.instagram} 
                      onChange={handleInputChange} 
                      placeholder="username" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline" 
                type="button" 
                onClick={() => router.push(`/brands/${brandId}/view`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </CsrfProtectedForm>
        
        <Card className="border-destructive/50">
          <CardHeader className="text-destructive">
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Actions that can't be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Brand</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this brand and remove it from all products
                </p>
              </div>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Brand
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 