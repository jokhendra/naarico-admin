import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { FormTooltip } from "@/components/ui/form-tooltip";
import { 
  specificationsApi, 
  SpecificationTemplate, 
  CreateSpecificationTemplateDto 
} from "@/lib/api/specifications-api";

interface SpecificationTemplateFormProps {
  categoryId: string;
  onSuccess?: () => void;
}

export function SpecificationTemplateForm({ 
  categoryId,
  onSuccess
}: SpecificationTemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<SpecificationTemplate[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [specKey, setSpecKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [specGroup, setSpecGroup] = useState("Technical Specifications");
  const [sortOrder, setSortOrder] = useState(0);
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [dataType, setDataType] = useState("string");
  const [optionsStr, setOptionsStr] = useState("");

  useEffect(() => {
    if (categoryId) {
      loadTemplates();
    }
  }, [categoryId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await specificationsApi.getSpecificationTemplatesByCategory(categoryId);
      // Ensure we have an array, even if the API returns something unexpected
      if (Array.isArray(response)) {
        setTemplates(response);
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        // If API wraps the array in a data property
        setTemplates((response as any).data);
      } else {
        console.error("Unexpected API response format:", response);
        setTemplates([]);
      }
    } catch (error) {
      console.error("Failed to load specification templates:", error);
      toast.error("Failed to load specification templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSpecKey("");
    setDisplayName("");
    setSpecGroup("Technical Specifications");
    setSortOrder(0);
    setIsRequired(false);
    setIsFilterable(true);
    setDataType("string");
    setOptionsStr("");
    setAddMode(false);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validation
      if (!specKey || !displayName || !specGroup) {
        setError("Please provide all required fields");
        return;
      }
      
      // Parse options if provided
      let options: Record<string, any> | undefined = undefined;
      if (dataType === "enum" && optionsStr) {
        try {
          const optionsArray = optionsStr.split("\n")
            .map(line => line.trim())
            .filter(line => line)
            .map(option => {
              // Check if option is a key-value pair
              const parts = option.split(":");
              if (parts.length === 2) {
                return {
                  value: parts[0].trim(),
                  label: parts[1].trim()
                };
              }
              return option.trim();
            });
          
          options = { options: optionsArray };
        } catch (e) {
          setError("Invalid options format");
          return;
        }
      }
      
      const templateData: CreateSpecificationTemplateDto = {
        categoryId,
        specKey,
        displayName,
        specGroup,
        sortOrder,
        isRequired,
        isFilterable,
        dataType,
        options
      };
      
      // Create template
      await specificationsApi.createSpecificationTemplate(templateData);
      toast.success("Specification template created successfully");
      
      // Reset form
      resetForm();
      
      // Reload templates
      loadTemplates();
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create specification template:", error);
      
      if (error?.response?.data?.message) {
        setError(`Failed to create template: ${error.response.data.message}`);
        toast.error(`Failed to create template: ${error.response.data.message}`);
      } else {
        setError("Failed to create specification template");
        toast.error("Failed to create specification template");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const deleteTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      await specificationsApi.deleteSpecificationTemplate(templateId);
      toast.success("Template deleted successfully");
      
      // Reload templates
      loadTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    } finally {
      setLoading(false);
    }
  };
  
  // Group templates by specGroup
  const groupedTemplates = Array.isArray(templates) ? templates.reduce((groups, template) => {
    if (!groups[template.specGroup]) {
      groups[template.specGroup] = [];
    }
    groups[template.specGroup].push(template);
    return groups;
  }, {} as Record<string, SpecificationTemplate[]>) : {};
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Specification Templates</CardTitle>
        <CardDescription>
          Create and manage specification templates for this category
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
            {error}
          </div>
        )}
        
        {!addMode ? (
          <>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No specification templates created yet
                </p>
                <Button onClick={() => setAddMode(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Template
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">Existing Templates</h3>
                  <Button onClick={() => setAddMode(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </div>
                
                {Object.entries(groupedTemplates).map(([group, groupTemplates]) => (
                  <div key={group} className="space-y-3">
                    <h3 className="font-medium text-muted-foreground">{group}</h3>
                    <div className="space-y-2">
                      {groupTemplates.map((template) => (
                        <div key={template.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{template.displayName}</h4>
                              <p className="text-sm text-muted-foreground">Key: {template.specKey}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteTemplate(template.id)}
                              disabled={loading}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>Type: <span className="font-medium">{template.dataType}</span></div>
                            <div>Filterable: <span className="font-medium">{template.isFilterable ? 'Yes' : 'No'}</span></div>
                            <div>Required: <span className="font-medium">{template.isRequired ? 'Yes' : 'No'}</span></div>
                            <div>Order: <span className="font-medium">{template.sortOrder}</span></div>
                          </div>
                          {template.options && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Options:</span>
                              <div className="text-muted-foreground">
                                {Array.isArray(template.options.options) ? 
                                  template.options.options.map((opt: any) => 
                                    typeof opt === 'object' ? `${opt.value}: ${opt.label}` : opt
                                  ).join(', ') : 
                                  JSON.stringify(template.options)
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add New Template</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specKey" className="flex items-center">
                  Specification Key*
                  <FormTooltip content="A unique identifier for this specification (e.g., 'ram', 'storage_capacity')" />
                </Label>
                <Input
                  id="specKey"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="e.g., ram, storage_capacity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center">
                  Display Name*
                  <FormTooltip content="The name shown to users (e.g., 'RAM', 'Storage Capacity')" />
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., RAM, Storage Capacity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specGroup" className="flex items-center">
                  Group*
                  <FormTooltip content="The group this specification belongs to (e.g., 'Technical', 'Display')" />
                </Label>
                <Input
                  id="specGroup"
                  value={specGroup}
                  onChange={(e) => setSpecGroup(e.target.value)}
                  placeholder="e.g., Technical Specifications, Display"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataType" className="flex items-center">
                  Data Type
                  <FormTooltip content="The type of data for this specification" />
                </Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="enum">Predefined Options</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="flex items-center">
                  Sort Order
                  <FormTooltip content="The order this specification appears in its group" />
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder.toString()}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isRequired">Required</Label>
                  <Switch
                    id="isRequired"
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isFilterable">Filterable</Label>
                  <Switch
                    id="isFilterable"
                    checked={isFilterable}
                    onCheckedChange={setIsFilterable}
                  />
                </div>
              </div>
            </div>
            
            {dataType === 'enum' && (
              <div className="space-y-2">
                <Label htmlFor="options" className="flex items-center">
                  Options (one per line)
                  <FormTooltip content="Enter predefined options, one per line. For key-value pairs, use format 'key: label'" />
                </Label>
                <Textarea
                  id="options"
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="4GB: 4 GB RAM&#10;8GB: 8 GB RAM&#10;16GB: 16 GB RAM"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Format: One option per line. For key-value pairs, use "value: label"
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !specKey || !displayName}
              >
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 