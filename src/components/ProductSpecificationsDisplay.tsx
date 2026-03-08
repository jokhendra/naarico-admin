import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { specificationsApi, GroupedProductSpecificationsDto } from "@/lib/api/specifications-api";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSpecificationsDisplayProps {
  productId: string;
}

export function ProductSpecificationsDisplay({ productId }: ProductSpecificationsDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [specifications, setSpecifications] = useState<GroupedProductSpecificationsDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadSpecifications();
    }
  }, [productId]);

  const loadSpecifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await specificationsApi.getGroupedProductSpecifications(productId);
      // Check if the response is an object with a data property
      if (response && typeof response === 'object' && 'data' in response) {
        const specsData = response.data;
        
        if (Array.isArray(specsData)) {
          setSpecifications(specsData);
        } else {
          console.error("Expected specifications.data to be an array, got:", specsData);
          setSpecifications([]);
          setError("Invalid specifications data format");
        }
      } else if (Array.isArray(response)) {
        // Handle direct array response
        setSpecifications(response);
      } else {
        console.error("Expected specifications to be an array or an object with data property, got:", response);
        setSpecifications([]);
        setError("Invalid specifications data format");
      }
    } catch (error) {
      console.error("Failed to load specifications:", error);
      setError("Failed to load specifications");
      setSpecifications([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full col-span-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!specifications || specifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No specifications available for this product.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        {specifications.map((group, groupIndex) => (
          <div key={`group-${groupIndex}-${group.title}`} className="space-y-3">
            <h3 className="text-lg font-medium">{group.title}</h3>
            <div className="border rounded-md divide-y">
              {Array.isArray(group.specs) ? (
                group.specs.map((spec, specIndex) => (
                  <div key={`spec-${groupIndex}-${specIndex}-${spec.id || spec.specKey}`} className="grid grid-cols-3 gap-4 p-3">
                    <div className="font-medium text-muted-foreground">{spec.specKey}</div>
                    <div className="col-span-2">{spec.specValue}</div>
                  </div>
                ))
              ) : (
                <div key={`no-specs-${groupIndex}`} className="p-3 text-muted-foreground">No specifications in this group</div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 