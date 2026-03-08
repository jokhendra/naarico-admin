"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, Trash, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { productsApi, Product, CreateProductVariantDto } from "@/lib/api/products-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm, useFieldArray } from "react-hook-form";

export default function AddProductVariantPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  
  // Initialize form with react-hook-form for multiple variants
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm({
    defaultValues: {
      variants: [
        {
          variantName: '',
          sku: '',
          price: 0,
          stockQuantity: 0,
          additionalPrice: 0
        }
      ]
    }
  });

  // Setup field array for managing multiple variants
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants"
  });
  
  // Get the base product details to show in the form and potentially use for defaults
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        const data = await productsApi.getProductById(productId);
        setProduct(data);
        
        // Pre-fill price with the product's base price
        if (data.price) {
          setValue('variants.0.price', typeof data.price === 'string' ? parseFloat(data.price) : data.price);
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details. Please try again.");
      } finally {
        setProductLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, setValue]);
  
  // Generate a SKU based on the variant name
  const generateSku = (variantName: string, index: number): string => {
    if (!product || !variantName) return '';
    
    // Get base product SKU or create a simplified version from the product title
    const baseSku = product.sku || product.title.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Generate a variant suffix from the variant name
    const variantSuffix = variantName
      .substring(0, 8)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .padEnd(3, 'X');
    
    // Add numeric suffix if multiple variants with same name
    return `${baseSku}-${variantSuffix}${index > 0 ? `-${index + 1}` : ''}`;
  };
  
  // Auto-generate SKUs when variant names change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && name.startsWith('variants') && name.endsWith('variantName')) {
        const match = name.match(/variants\.(\d+)\.variantName/);
        if (match) {
          const index = parseInt(match[1]);
          const variantName = value.variants?.[index]?.variantName;
          const currentSku = value.variants?.[index]?.sku;
          
          // Only set SKU if variant name exists and SKU is empty or auto-generated
          if (variantName && (!currentSku || currentSku.includes(product?.sku || ''))) {
            setValue(`variants.${index}.sku`, generateSku(variantName, index));
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, setValue, product]);
  
  // Form submission handler
  const onSubmit = async (data: { variants: CreateProductVariantDto[] }) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Filter out empty variants
      const validVariants = data.variants.filter(variant => 
        variant.variantName.trim() !== '' && variant.sku.trim() !== ''
      );
      
      if (validVariants.length === 0) {
        setError("Please add at least one valid variant");
        setIsLoading(false);
        return;
      }
      
      // Ensure all number fields are numbers, not strings
      const processedVariants = validVariants.map(variant => ({
        ...variant,
        price: typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price,
        stockQuantity: typeof variant.stockQuantity === 'string' ? parseInt(String(variant.stockQuantity)) : variant.stockQuantity,
        additionalPrice: variant.additionalPrice ? (typeof variant.additionalPrice === 'string' ? parseFloat(variant.additionalPrice) : variant.additionalPrice) : undefined
      }));
      
      console.log("Creating variants with data:", processedVariants);
      
      // Send the array of variants to the API
      await productsApi.createVariant(productId, processedVariants);
      
      setSuccess(true);
      
      // Navigate back to product view after successful creation
      setTimeout(() => {
        router.push(`/products/${productId}/view`);
      }, 1500);
    } catch (error: any) {
      console.error("Error creating variants:", error);
      setError(error.message || "Failed to create product variants. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new empty variant
  const addVariant = () => {
    append({
      variantName: '',
      sku: '',
      price: product?.price || 0,
      stockQuantity: 0,
      additionalPrice: 0
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link href={`/products/${productId}/view`} className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Add Product Variants</h1>
        </div>
        
        {/* Product summary */}
        {product && (
          <div className="flex items-center gap-2 bg-muted p-4 rounded-md">
            <div className="flex-1">
              <h2 className="font-medium">Base Product: {product.title}</h2>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Base Price: ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Stock: {product.stockQuantity}</p>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-50 dark:border-green-800">
            <AlertDescription>Variants created successfully! Redirecting...</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className={index > 0 ? "border-t-4 border-t-primary/20" : ""}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Variant {index + 1}</CardTitle>
                    <CardDescription>
                      Create a new variant with different attributes
                    </CardDescription>
                  </div>
                  {index > 0 && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label 
                        htmlFor={`variants.${index}.variantName`} 
                        className={errors.variants?.[index]?.variantName ? "text-destructive" : ""}
                      >
                        Variant Name <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id={`variants.${index}.variantName`}
                        placeholder="e.g., Blue, 256GB, Large"
                        {...register(`variants.${index}.variantName` as const, { 
                          required: "Variant name is required" 
                        })}
                        className={errors.variants?.[index]?.variantName ? "border-destructive" : ""}
                      />
                      {errors.variants?.[index]?.variantName && (
                        <p className="text-sm text-destructive">{errors.variants?.[index]?.variantName?.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label 
                        htmlFor={`variants.${index}.sku`} 
                        className={errors.variants?.[index]?.sku ? "text-destructive" : ""}
                      >
                        SKU <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id={`variants.${index}.sku`}
                        placeholder="Stock Keeping Unit"
                        {...register(`variants.${index}.sku` as const, { 
                          required: "SKU is required" 
                        })}
                        className={errors.variants?.[index]?.sku ? "border-destructive" : ""}
                      />
                      {errors.variants?.[index]?.sku && (
                        <p className="text-sm text-destructive">{errors.variants?.[index]?.sku?.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Auto-generated based on variant name, but can be customized
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label 
                        htmlFor={`variants.${index}.price`} 
                        className={errors.variants?.[index]?.price ? "text-destructive" : ""}
                      >
                        Price <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id={`variants.${index}.price`}
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...register(`variants.${index}.price` as const, { 
                          required: "Price is required",
                          min: {
                            value: 0,
                            message: "Price must be a positive number"
                          }
                        })}
                        className={errors.variants?.[index]?.price ? "border-destructive" : ""}
                      />
                      {errors.variants?.[index]?.price && (
                        <p className="text-sm text-destructive">{errors.variants?.[index]?.price?.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`variants.${index}.additionalPrice`}>
                        Additional Price (Optional)
                      </Label>
                      <Input 
                        id={`variants.${index}.additionalPrice`}
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        {...register(`variants.${index}.additionalPrice` as const, {
                          min: {
                            value: 0,
                            message: "Additional price must be a positive number"
                          }
                        })}
                        className={errors.variants?.[index]?.additionalPrice ? "border-destructive" : ""}
                      />
                      {errors.variants?.[index]?.additionalPrice && (
                        <p className="text-sm text-destructive">{errors.variants?.[index]?.additionalPrice?.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added to the base product price if specified
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`variants.${index}.stockQuantity`}>
                        Stock Quantity
                      </Label>
                      <Input 
                        id={`variants.${index}.stockQuantity`}
                        type="number"
                        placeholder="0"
                        min="0"
                        {...register(`variants.${index}.stockQuantity` as const, {
                          min: {
                            value: 0,
                            message: "Stock quantity cannot be negative"
                          }
                        })}
                        className={errors.variants?.[index]?.stockQuantity ? "border-destructive" : ""}
                      />
                      {errors.variants?.[index]?.stockQuantity && (
                        <p className="text-sm text-destructive">{errors.variants?.[index]?.stockQuantity?.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={addVariant}
              className="w-full border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Variant
            </Button>
            
            <div className="flex justify-between mt-6">
              <Link href={`/products/${productId}/view`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Variants
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 