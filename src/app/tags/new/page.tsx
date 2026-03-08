"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tagsApi, CreateTagDto } from "@/lib/api/tags-api";

export default function NewTagPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Tag name is required");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Create tag data object
      const tagData: CreateTagDto = {
        name: name.trim()
      };
      
      console.log('Submitting tag data:', tagData);
      
      // API call to create tag
      const result = await tagsApi.createTag(tagData);
      console.log('Tag created successfully:', result);
      
      // Navigate to tags listing page
      router.push('/tags');
    } catch (error: any) {
      console.error("Error creating tag:", error);
      
      // Extract error message from API response if available
      let errorMessage = "Failed to create tag";
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid tag data";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to create tags";
        } else if (error.response.status === 409) {
          errorMessage = "A tag with this name already exists";
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
          <Link href="/tags" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Add New Tag</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Tag Information</CardTitle>
              <CardDescription>
                Add a new tag to help categorize and filter products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tag name" 
                  required 
                />
                <p className="text-sm text-muted-foreground">
                  The tag name should be concise and descriptive, like "Wireless", "Waterproof", or "Limited Edition".
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline" 
                type="button" 
                onClick={() => router.push('/tags')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Creating...' : 'Create Tag'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
} 