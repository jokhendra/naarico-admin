"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { tagsApi, Tag } from "@/lib/api/tags-api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EditTagPage() {
  const params = useParams();
  const router = useRouter();
  const tagId = params.id as string;
  
  const [tag, setTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch tag on page load
  useEffect(() => {
    const fetchTag = async () => {
      try {
        setLoading(true);
        const data = await tagsApi.getTagById(tagId);
        setTag(data);
        setName(data.name);
        setSlug(data.slug);
      } catch (error: any) {
        console.error("Error fetching tag:", error);
        setError(error.message || "Failed to load tag");
      } finally {
        setLoading(false);
      }
    };
    
    if (tagId) {
      fetchTag();
    }
  }, [tagId]);

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
      // Update tag
      const result = await tagsApi.updateTag(tagId, { name: name.trim() });
      console.log('Tag updated successfully:', result);
      
      // Navigate back to tags list
      router.push('/tags');
    } catch (error: any) {
      console.error("Error updating tag:", error);
      
      // Extract error message
      let errorMessage = "Failed to update tag";
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid tag data";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to update this tag";
        } else if (error.response.status === 404) {
          errorMessage = "Tag not found";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle tag deletion
  const handleDeleteTag = async () => {
    try {
      setDeleting(true);
      await tagsApi.deleteTag(tagId);
      router.push('/tags');
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      alert(`Failed to delete tag: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading tag details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!tag && !loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p>Tag not found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/tags')}
            >
              Back to Tags
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/tags" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Edit Tag</h1>
          </div>
          <Button 
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Tag
          </Button>
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
                Edit the tag's details
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input 
                  id="slug" 
                  value={slug}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  The slug is generated automatically from the name and cannot be edited directly.
                </p>
              </div>
              
              {tag && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Created At</Label>
                    <p>{new Date(tag.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                    <p>{new Date(tag.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
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
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag "{tag?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTag}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
} 