"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, FolderPlus, RefreshCw, Wand2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { categoriesApi, Category, CreateCategoryDto } from "@/lib/api/categories-api";

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Form data
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState("none");
  const [featured, setFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [showInMenu, setShowInMenu] = useState(true);
  const [showInFilters, setShowInFilters] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");
  
  // state additions after existing states
  const [slugEdited, setSlugEdited] = useState(false);
  const [metaTitleEdited, setMetaTitleEdited] = useState(false);
  const [metaDescriptionEdited, setMetaDescriptionEdited] = useState(false);

  // helper generators
  const generateMetaTitle = (catName: string) => `${catName} | Buy ${catName} Online`;
  const generateMetaDescription = (catName: string, desc?: string) => {
    if (desc && desc.trim()) return desc.trim().slice(0,150);
    return `Discover a wide range of ${catName} at best prices. Shop the latest ${catName} products with fast delivery & secure checkout.`;
  };
  
  // Generate slug from name
  const generateSlug = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with dashes
      .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
      .replace(/\-\-+/g, '-')       // Replace multiple dashes with single dash
      .replace(/^-+/, '')           // Trim dashes from start
      .replace(/-+$/, '');          // Trim dashes from end
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Only auto-generate slug if user hasn't manually edited it yet
    // or if the slug is empty
    if (!slugEdited) {
      setSlug(generateSlug(newName));
    }
    
    if (!metaTitleEdited) setMetaTitle(generateMetaTitle(newName));
    if (!metaDescriptionEdited) setMetaDescription(generateMetaDescription(newName));
  };

  // Handle regenerate slug button click
  const handleRegenerateSlug = () => {
    setSlug(generateSlug(name));
  };
  
  // Fetch categories for parent dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoriesApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare data for API (only sending fields the API accepts)
      const categoryData: CreateCategoryDto = {
        name: name.trim()
      };
      
      if (description.trim()) {
        categoryData.description = description.trim();
      }
      
      // Note: The API doesn't accept slug directly, but we keep the UI functionality
      // const slugForUI = slug.trim();
      
      if (icon.trim()) {
        categoryData.icon = icon.trim();
      }
      
      if (parentId && parentId !== "none") {
        categoryData.parentId = parentId;
      }
      
      // These fields are collected in UI but not sent to API
      // as they're not supported in the current API version
      console.log("UI-only fields not sent to API:", {
        slug: slug.trim(),
        metaTitle: metaTitle.trim(), 
        metaDescription: metaDescription.trim(),
        featured,
        showInMenu,
        showInFilters,
        displayOrder
      });
      
      console.log("Creating category with data:", categoryData);
      
      // Call API to create category
      const result = await categoriesApi.createCategory(categoryData);
      console.log("Category created successfully:", result);
      
      // Redirect to categories list
      router.push("/categories");
    } catch (error: any) {
      console.error("Error creating category:", error);
      
      // Extract error message
      let errorMessage = "Failed to create category";
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid category data";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to create categories";
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/categories" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Create New Category</h1>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the basic details of this category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input 
                        id="name" 
                        placeholder="Enter category name" 
                        value={name}
                        onChange={handleNameChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <div className="flex space-x-2">
                        <Input 
                          id="slug" 
                          placeholder="enter-slug-here"
                          value={slug}
                          onChange={(e) => {setSlug(e.target.value); setSlugEdited(true);}}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={handleRegenerateSlug}
                          title="Regenerate slug from name"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The slug is used in the URL of the category page. It will be auto-generated from the name.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      rows={4} 
                      placeholder="Enter category description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="featured" 
                      checked={featured}
                      onCheckedChange={(checked) => setFeatured(checked as boolean)}
                    />
                    <Label htmlFor="featured">Featured Category</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                  <CardDescription>
                    Optimize category for search engines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input 
                      id="metaTitle" 
                      placeholder="Enter meta title"
                      value={metaTitle}
                      onChange={(e) => {setMetaTitle(e.target.value); setMetaTitleEdited(true);}}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea 
                      id="metaDescription" 
                      rows={3} 
                      placeholder="Enter meta description"
                      value={metaDescription}
                      onChange={(e) => {setMetaDescription(e.target.value); setMetaDescriptionEdited(true);}}
                    />
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button type="button" variant="outline" size="sm" onClick={()=>{
                    setMetaTitle(generateMetaTitle(name||'Category'));
                    setMetaDescription(generateMetaDescription(name||'Category', description));
                    setMetaTitleEdited(false);
                    setMetaDescriptionEdited(false);
                  }} className="flex items-center gap-1">
                    <Wand2 className="h-4 w-4"/> Generate SEO
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Category Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-md aspect-square flex items-center justify-center bg-muted">
                    <FolderPlus className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="icon"
                      type="text"
                      placeholder="Enter icon URL"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="mb-2"
                    />
                    <Button variant="outline" className="w-full" type="button">
                      Upload Image
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parent Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="parentCategory">Parent</Label>
                    <Select 
                      value={parentId} 
                      onValueChange={setParentId}
                    >
                      <SelectTrigger id="parentCategory">
                        <SelectValue placeholder="No parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent category</SelectItem>
                        {loadingCategories ? (
                          <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground pt-2">
                      Setting a parent category will make this a subcategory
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showInMenu" 
                      checked={showInMenu}
                      onCheckedChange={(checked) => setShowInMenu(checked as boolean)}
                    />
                    <Label htmlFor="showInMenu">Show in Menu</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showInFilters" 
                      checked={showInFilters}
                      onCheckedChange={(checked) => setShowInFilters(checked as boolean)}
                    />
                    <Label htmlFor="showInFilters">Show in Filters</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input 
                      id="displayOrder" 
                      type="number" 
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" type="button">
              <Link href="/categories" className="flex items-center">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 