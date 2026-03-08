"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { storesService } from "@/services/storesService";
import { UpdateStoreFormData } from "@/types/store";
import { CsrfProtectedForm } from "@/components/form/CsrfProtectedForm";
import { useCsrf } from "@/contexts/CsrfContext";
import { useToast } from "@/components/ui/use-toast";

export default function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { withCsrfProtection } = useCsrf();
  const { toast } = useToast();
  
  // Unwrap params promise
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<UpdateStoreFormData>({
    name: '',
    description: '',
    logo: '',
  });

  // Load existing store data
  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const result = await storesService.getStoreById(id);
        
        if (result.success && result.data) {
          setFormData({
            name: result.data.name,
            description: result.data.description || '',
            logo: result.data.logo || '',
          });
        } else {
          setError(result.error || 'Failed to load store');
          toast({
            title: "Error",
            description: "Failed to load store details",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Error fetching store:", err);
        setError(err.message || "Failed to load store");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStore();
  }, [id]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
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
      
      // Create update data object (only include changed/non-empty fields)
      const updateData: UpdateStoreFormData = {};
      
      if (formData.name?.trim()) {
        updateData.name = formData.name.trim();
      }
      
      if (formData.description?.trim()) {
        updateData.description = formData.description.trim();
      }
      
      if (formData.logo?.trim()) {
        updateData.logo = formData.logo.trim();
      }
      
      console.log('Updating store:', id, updateData);
      
      // API call to update store with CSRF protection
      const result = await withCsrfProtection(async () => {
        return await storesService.updateStore(id, updateData);
      });
      
      if (result.success) {
        console.log('Store updated successfully:', result.data);
        toast({
          title: "Success",
          description: result.message || "Store updated successfully",
        });
        
        // Navigate back to stores listing
        router.push('/seller/stores');
      } else {
        setError(result.error || 'Failed to update store');
      }
    } catch (error: any) {
      console.error("Error updating store:", error);
      
      let errorMessage = "Failed to update store";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = "You can only edit your own stores";
      } else if (error.response?.status === 404) {
        errorMessage = "Store not found";
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Link href="/seller/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Store</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Update your store details
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
              </div>

              <div className="flex gap-3">
                <Link href="/seller/stores" className="flex-1">
                  <Button type="button" variant="outline" disabled={saving} className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </CsrfProtectedForm>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

