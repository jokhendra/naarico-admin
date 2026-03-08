import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, X } from "lucide-react";
import { toast } from "sonner";
import { FormTooltip } from "@/components/ui/form-tooltip";
import { 
  specificationsApi, 
  SpecificationTemplate, 
  ProductSpecification,
  CreateProductSpecificationDto
} from "@/lib/api/specifications-api";

interface ProductSpecificationsFormProps {
  productId: string;
  categoryId?: string;
  readOnly?: boolean;
  onSpecificationsChange?: (specifications: CreateProductSpecificationDto[]) => void;
  specifications?: CreateProductSpecificationDto[];
}

export function ProductSpecificationsForm({ 
  productId, 
  categoryId, 
  readOnly = false,
  onSpecificationsChange,
  specifications: initialSpecifications
}: ProductSpecificationsFormProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<SpecificationTemplate[]>([]);
  const [specifications, setSpecifications] = useState<CreateProductSpecificationDto[]>([]);
  const [existingSpecifications, setExistingSpecifications] = useState<ProductSpecification[]>([]);
  const [customSpecKey, setCustomSpecKey] = useState("");
  const [customSpecValue, setCustomSpecValue] = useState("");
  const [customSpecGroup, setCustomSpecGroup] = useState("Technical Specifications");
  const [error, setError] = useState<string | null>(null);

  // Initialize specifications from props
  useEffect(() => {
    if (initialSpecifications && initialSpecifications.length > 0 && specifications.length === 0) {
      console.log("Initializing specifications from props:", initialSpecifications);
      setSpecifications(initialSpecifications);
    }
  }, [initialSpecifications]);

  // Load existing specifications if product ID is provided and not "new"
  useEffect(() => {
    if (productId && productId !== "new") {
      loadExistingSpecifications();
    }
  }, [productId]);

  // Load templates when category changes
  useEffect(() => {
    if (categoryId) {
      loadTemplates();
    }
  }, [categoryId]);

  // Listen for external specifications changes (like when loading from draft)
  useEffect(() => {
    if (onSpecificationsChange && specifications.length > 0) {
      onSpecificationsChange(specifications);
    }
  }, [specifications, onSpecificationsChange]);
  
  // Initialize specifications from parent component (for drafts)
  useEffect(() => {
    const parent = document.querySelector('[data-specifications]');
    if (parent) {
      try {
        const parentSpecs = JSON.parse(parent.getAttribute('data-specifications') || '[]');
        if (Array.isArray(parentSpecs) && parentSpecs.length > 0 && specifications.length === 0) {
          console.log("Initializing specifications from parent:", parentSpecs);
          setSpecifications(parentSpecs);
        }
      } catch (e) {
        console.error("Failed to parse parent specifications:", e);
      }
    }
  }, []);

  const loadExistingSpecifications = async () => {
    try {
      setLoading(true);
      const response = await specificationsApi.getProductSpecifications(productId);
      
      let specsData: ProductSpecification[] = [];
      
      // Check if response has a data property (API returns wrapped response)
      if (response && typeof response === 'object' && 'data' in response) {
        if (Array.isArray(response.data)) {
          specsData = response.data;
        } else {
          console.error("Expected specifications.data to be an array, got:", response.data);
          setError("Invalid specifications data format");
          setLoading(false);
          return;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        specsData = response;
      } else {
        console.error("Expected specifications to be an array or object with data property, got:", response);
        setError("Invalid specifications data format");
        setLoading(false);
        return;
      }
      
      setExistingSpecifications(specsData);
      
      // Convert to CreateProductSpecificationDto format
      const formattedSpecs = specsData.map(spec => ({
        productId: spec.productId,
        specKey: spec.specKey,
        specValue: spec.specValue,
        specGroup: spec.specGroup,
        sortOrder: spec.sortOrder,
        isFilterable: spec.isFilterable
      }));
      
      setSpecifications(formattedSpecs);
    } catch (error) {
      console.error("Failed to load specifications:", error);
      setError("Failed to load specifications");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateData = await specificationsApi.getSpecificationTemplatesByCategory(categoryId!);
      setTemplates(templateData);
      
      // Pre-populate specifications based on templates if we don't have existing specifications
      if (templateData.length > 0 && specifications.length === 0) {
        const defaultSpecs = templateData.map(template => ({
          productId,
          specKey: template.specKey,
          specValue: "",
          specGroup: template.specGroup,
          sortOrder: template.sortOrder,
          isFilterable: template.isFilterable
        }));
        
        setSpecifications(defaultSpecs);
      }
    } catch (error) {
      console.error("Failed to load specification templates:", error);
      // Don't set error here, as templates might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleSpecificationChange = (index: number, value: string) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index].specValue = value;
    setSpecifications(updatedSpecs);
  };

  const addCustomSpecification = () => {
    if (!customSpecKey || !customSpecValue) {
      toast.error("Specification key and value are required");
      return;
    }

    // Check if specification with this key already exists
    const exists = specifications.some(spec => spec.specKey === customSpecKey);
    if (exists) {
      toast.error(`Specification with key "${customSpecKey}" already exists`);
      return;
    }

    const newSpec: CreateProductSpecificationDto = {
      productId,
      specKey: customSpecKey,
      specValue: customSpecValue,
      specGroup: customSpecGroup || "Technical Specifications",
      isFilterable: true
    };

    setSpecifications([...specifications, newSpec]);
    setCustomSpecKey("");
    setCustomSpecValue("");
  };

  const removeSpecification = (index: number) => {
    const updatedSpecs = [...specifications];
    updatedSpecs.splice(index, 1);
    setSpecifications(updatedSpecs);
  };

  const saveSpecifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter out empty specifications
      const validSpecs = specifications.filter(spec => spec.specValue.trim() !== "");
      
      // For new products, don't try to save to the backend yet
      if (productId === "new") {
        if (onSpecificationsChange) {
          onSpecificationsChange(validSpecs);
          toast.success("Specifications prepared for the new product");
        }
        setLoading(false);
        return;
      }
      
      if (validSpecs.length === 0) {
        // If no specifications, delete all existing ones
        if (existingSpecifications.length > 0) {
          await specificationsApi.deleteAllProductSpecifications(productId);
          toast.success("All specifications removed");
        }
        return;
      }
      
      // Save specifications in bulk
      await specificationsApi.createProductSpecificationsBulk(validSpecs);
      toast.success("Specifications saved successfully");
      
      // Reload specifications to get the updated list with IDs
      await loadExistingSpecifications();
    } catch (error: any) {
      console.error("Failed to save specifications:", error);
      
      // Check for specific error types
      if (error?.response?.data?.message) {
        setError(`Failed to save: ${error.response.data.message}`);
        toast.error(`Failed to save: ${error.response.data.message}`);
      } else {
        setError("Failed to save specifications");
        toast.error("Failed to save specifications");
      }
    } finally {
      setLoading(false);
    }
  };

  // Group specifications by specGroup
  const groupedSpecifications = specifications.reduce((groups, spec) => {
    if (!groups[spec.specGroup]) {
      groups[spec.specGroup] = [];
    }
    groups[spec.specGroup].push(spec);
    return groups;
  }, {} as Record<string, CreateProductSpecificationDto[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specifications</CardTitle>
        <CardDescription>
          Add detailed technical specifications for this product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
            {error}
          </div>
        )}

        {Object.entries(groupedSpecifications).map(([group, specs]) => (
          <div key={group} className="space-y-3">
            <h3 className="text-lg font-medium">{group}</h3>
            <div className="space-y-2">
              {specs.map((spec, index) => (
                <div key={`${spec.specKey}-${index}`} className="grid grid-cols-3 gap-4 items-center">
                  <Label htmlFor={`spec-${spec.specKey}`} className="col-span-1">
                    {spec.specKey}
                  </Label>
                  <div className="col-span-2 flex gap-2">
                    <Input
                      id={`spec-${spec.specKey}`}
                      value={spec.specValue}
                      onChange={(e) => handleSpecificationChange(
                        specifications.findIndex(s => s.specKey === spec.specKey),
                        e.target.value
                      )}
                      placeholder="Enter value"
                      disabled={readOnly}
                    />
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecification(
                          specifications.findIndex(s => s.specKey === spec.specKey)
                        )}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!readOnly && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Add Custom Specification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customSpecKey" className="flex items-center">
                  Specification Key
                  <FormTooltip content="Enter a unique identifier for this specification (e.g., RAM, OS, Battery)" />
                </Label>
                <Input
                  id="customSpecKey"
                  value={customSpecKey}
                  onChange={(e) => setCustomSpecKey(e.target.value)}
                  placeholder="e.g., RAM, OS, Battery"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customSpecValue">Specification Value</Label>
                <Input
                  id="customSpecValue"
                  value={customSpecValue}
                  onChange={(e) => setCustomSpecValue(e.target.value)}
                  placeholder="e.g., 8GB, Android 12, 5000mAh"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customSpecGroup">Specification Group</Label>
                <Input
                  id="customSpecGroup"
                  value={customSpecGroup}
                  onChange={(e) => setCustomSpecGroup(e.target.value)}
                  placeholder="e.g., Technical Specifications, Display, Battery"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addCustomSpecification}
              disabled={!customSpecKey || !customSpecValue}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Specification
            </Button>
          </div>
        )}
      </CardContent>
      {!readOnly && (
        <CardFooter>
          <Button
            type="button"
            onClick={saveSpecifications}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Specifications"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 