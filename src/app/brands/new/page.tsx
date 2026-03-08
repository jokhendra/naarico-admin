"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { brandsApi, CreateBrandDto } from "@/lib/api/brands-api";
import { CsrfProtectedForm } from "@/components/form/CsrfProtectedForm";
import { useCsrf } from "@/contexts/CsrfContext";

export default function AddBrandPage() {
  const router = useRouter();
  const { withCsrfProtection } = useCsrf();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    logo: string;
    website: string;
    description: string;
    featured: boolean;
  }>({
    name: '',
    logo: '',
    website: '',
    description: '',
    featured: false,
  });

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    setSaving(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Brand name is required');
        setSaving(false);
        return;
      }
      
      // Create brand data object
      const brandData: CreateBrandDto = {
        name: formData.name.trim(),
      };
      
      // Only add optional fields if they have values
      if (formData.description.trim()) {
        brandData.description = formData.description.trim();
      }
      
      if (formData.logo.trim()) {
        brandData.logo = formData.logo.trim();
      }
      
      if (formData.website.trim()) {
        brandData.website = formData.website.trim();
      }
      
      // Add featured status
      brandData.isFeatured = formData.featured;
      
      console.log('Submitting brand data:', brandData);
      
      // API call to create brand with CSRF protection
      const result = await withCsrfProtection(async () => {
        return await brandsApi.createBrand(brandData);
      });
      console.log('Brand created successfully:', result);
      
      // Navigate to brands listing page
      router.push('/brands');
    } catch (error: any) {
      console.error("Error creating brand:", error);
      
      // Extract error message from API response if available
      let errorMessage = "Failed to create brand";
      if (error.response) {
        console.error("API error response:", error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid brand data";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to create brands";
        } else if (error.response.status === 409) {
          errorMessage = "A brand with this name already exists";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link href="/brands" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Add New Brand</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            {error}
          </div>
        )}

        <CsrfProtectedForm onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>
                Add a new brand to your store
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline" 
                type="button" 
                onClick={() => router.push('/brands')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Brand'}
              </Button>
            </CardFooter>
          </Card>
        </CsrfProtectedForm>
      </div>
    </MainLayout>
  );
} 