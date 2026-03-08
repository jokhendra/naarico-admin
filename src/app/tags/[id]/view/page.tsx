"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { tagsApi, Tag } from "@/lib/api/tags-api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ViewTagPage() {
  const params = useParams();
  const router = useRouter();
  const tagId = params.id as string;
  
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tag details
  useEffect(() => {
    const fetchTag = async () => {
      try {
        setLoading(true);
        const data = await tagsApi.getTagById(tagId);
        setTag(data);
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TagIcon className="h-6 w-6" />
              {tag?.name}
            </h1>
          </div>
          <Link href={`/tags/${tagId}`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Tag
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tag Details</CardTitle>
            <CardDescription>
              View detailed information about this tag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tag Name</h3>
                <p className="text-lg">{tag?.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Slug</h3>
                <p className="text-lg">{tag?.slug}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                <p>{new Date(tag?.createdAt || '').toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p>{new Date(tag?.updatedAt || '').toLocaleString()}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Associated Products</h3>
              <div className="mt-2">
                <Badge variant="secondary" className="text-base py-2 px-3">
                  {tag?.productCount || 0} products
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 