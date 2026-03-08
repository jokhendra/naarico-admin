"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { storesService } from "@/services/storesService";
import { CreateStoreFormData } from "@/types/store";
import { CsrfProtectedForm } from "@/components/form/CsrfProtectedForm";
import { useCsrf } from "@/contexts/CsrfContext";
import { useToast } from "@/components/ui/use-toast";

export default function CreateStorePage() {
  const router = useRouter();
  const { withCsrfProtection } = useCsrf();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<CreateStoreFormData>({
    name: '',
    description: '',
    logo: '',
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear errors when user types
    setError(null);
    setValidationErrors([]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    setSaving(true);
    setError(null);
    setValidationErrors([]);
    
    try {
      // Client-side validation
      const validation = storesService.validateStoreData(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setSaving(false);
        return;
      }

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Store name is required');
        setSaving(false);
        return;
      }
      
      // Create store data object
      const storeData: CreateStoreFormData = {
        name: formData.name.trim(),
      };
      
      // Only add optional fields if they have values
      if (formData.description?.trim()) {
        storeData.description = formData.description.trim();
      }
      
      if (formData.logo?.trim()) {
        storeData.logo = formData.logo.trim();
      }
      
      console.log('Submitting store data:', storeData);
      
      // API call to create store with CSRF protection
      const result = await withCsrfProtection(async () => {
        return await storesService.createStore(storeData);
      });
      
      if (result.success) {
        console.log('Store created successfully:', result.data);
        toast({
          title: "Success",
          description: result.message || "Store created successfully",
        });
        
        // Navigate to stores listing page
        router.push('/seller/stores');
      } else {
        setError(result.error || 'Failed to create store');
      }
    } catch (error: any) {
      console.error("Error creating store:", error);
      
      // Extract error message from API response if available
      let errorMessage = "Failed to create store";
      if (error.response) {
        console.error("API error response:", error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid store data";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to create stores";
        } else if (error.response.status === 409) {
          errorMessage = "A store with this name already exists";
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
        <div className="flex items-center gap-4">
          <Link href="/seller/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Store</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Create a new store to start selling on Naarico marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-4">
                <ul className="list-disc list-inside">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <CsrfProtectedForm onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Store Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Electronics Hub"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={saving}
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a unique and memorable name for your store (3-100 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your store..."
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={saving}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Describe what you sell and what makes your store special (max 500 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo}
                  onChange={handleInputChange}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Add a logo URL to make your store stand out
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 px-4 py-3 rounded">
                <p className="text-sm font-medium">ℹ️ Store Approval Process</p>
                <p className="text-sm mt-1">
                  Your store will be created with <strong>PENDING</strong> status. 
                  An admin will review and approve it before you can start selling.
                </p>
              </div>

              <div className="flex gap-3">
                <Link href="/seller/stores" className="flex-1">
                  <Button type="button" variant="outline" disabled={saving} className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Creating Store...' : 'Create Store'}
                </Button>
              </div>
            </CsrfProtectedForm>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

