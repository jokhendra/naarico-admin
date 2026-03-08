import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { Category } from "@/lib/api/categories-api";
import { useRouter } from "next/navigation";
import { FolderPlus, Settings, Upload } from "lucide-react";

interface CategoryFormProps {
  categories: Category[];
  initialData?: Category;
  onSubmit: (values: {
    name: string;
    description: string;
    parentId?: string;
    icon?: string;
  }) => void;
  isSubmitting: boolean;
}

export const CategoryForm = ({
  categories,
  initialData,
  onSubmit,
  isSubmitting
}: CategoryFormProps) => {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [parentId, setParentId] = useState<string | undefined>(initialData?.parentId || undefined);
  const [icon, setIcon] = useState(initialData?.icon || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setParentId(initialData.parentId || undefined);
      setIcon(initialData.icon || "");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      parentId: parentId === "none" ? undefined : parentId,
      icon
    });
  };
  
  const navigateToSpecTemplates = () => {
    if (initialData?.id) {
      router.push(`/categories/${initialData.id}/templates`);
    }
  };
  
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For now, we'll use a simple URL.createObjectURL approach
    // In a production app, you'd upload to your server or cloud storage
    setIcon(URL.createObjectURL(file));
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter category description"
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select
              value={parentId}
              onValueChange={(value) => setParentId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top-level Category)</SelectItem>
                {categories
                  .filter((cat) => cat.id !== initialData?.id)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {initialData && initialData.id && (
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={navigateToSpecTemplates}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                Manage Specification Templates
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Category Icon</Label>
            <div className="border rounded-md aspect-square flex items-center justify-center bg-muted">
              {icon ? (
                <img 
                  src={icon} 
                  alt={name || "Category icon"} 
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <FolderPlus className="h-10 w-10 text-muted-foreground" />
              )}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                variant="outline" 
                className="w-full" 
                type="button" 
                onClick={handleFileSelect}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting || !name}
        className="w-full"
      >
        {isSubmitting ? "Saving..." : initialData ? "Update Category" : "Create Category"}
      </Button>
    </form>
  );
}; 