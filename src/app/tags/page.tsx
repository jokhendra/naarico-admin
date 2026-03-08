"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Tag as TagIcon, Pencil, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function TagsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Fetch tags on page load
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const data = await tagsApi.getTags();
        
        if (Array.isArray(data)) {
          setTags(data);
        } else {
          console.error('Unexpected data format:', data);
          setTags([]);
          setError('Received invalid data format from server');
        }
      } catch (error: any) {
        console.error("Error fetching tags:", error);
        setTags([]);
        setError(error.message || "Failed to load tags");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTags();
  }, []);
  
  // Filter tags based on search term
  const filteredTags = Array.isArray(tags) 
    ? tags.filter(tag => 
        tag && tag.name && tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
    
  // Handle tag deletion
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    
    try {
      setDeleting(true);
      await tagsApi.deleteTag(tagToDelete.id);
      setTags(prevTags => prevTags.filter(tag => tag.id !== tagToDelete.id));
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      setError(`Failed to delete tag: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tags</h1>
          <Link href="/tags/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Tags</CardTitle>
            <CardDescription>
              View and manage all product tags in your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tags..."
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
                  <p>Loading tags...</p>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          {searchTerm ? "No matching tags found" : "No tags available"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <TagIcon className="h-4 w-4 text-muted-foreground" />
                              {tag.name}
                            </div>
                          </TableCell>
                          <TableCell>{tag.slug}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {tag.productCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(tag.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/tags/${tag.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setTagToDelete(tag);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag "{tagToDelete?.name}".
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