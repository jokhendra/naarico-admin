"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GripVertical, Plus, Trash, Upload, Save, X, Eye, Search, Tag } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  productsApi,
  CreateProductDto,
  Dimensions,
  CreateProductImageDto,
  CreateProductVariantDto
} from "@/lib/api/products-api";
import { categoriesApi } from "@/lib/api/categories-api";
import { brandsApi } from "@/lib/api/brands-api";
import { tagsApi } from "@/lib/api/tags-api";
import { specificationsApi } from "@/lib/api/specifications-api";
import {
  saveProductDraft,
  loadProductDraft,
  clearProductDraft,
  determineCompletedSections,
  ProductDraftSection
} from "@/lib/product-draft-utils";
import { toast } from "sonner";
import { FormTooltip } from "@/components/ui/form-tooltip";
import dynamic from "next/dynamic";
import { getSafeImageSrc, truncateText, getCurrencyOptions } from "@/lib/utils";
import { useProductPreview, PreviewProduct } from "@/hooks/useProductPreview";
import { ProductSpecificationsForm } from "@/components/ProductSpecificationsForm";
import { CreateProductSpecificationDto } from "@/lib/api/specifications-api";
import { inventoryService } from '@/services/inventoryService';
import { FileUpload } from "@/components/ui/file-upload";
import { UploadedFileInfo } from '@/types/upload';
import { useAuth } from "@/hooks/use-auth";
import { storesService } from "@/services/storesService";
import { usersService } from "@/services/usersService";
import { Store } from "@/types/store";
import { User } from "@/lib/api/users-api";

// Lazy load components with a different name
const LazyProductFormProgress = dynamic(
  () => import("@/components/ProductFormProgress").then(mod => mod.ProductFormProgress),
  { ssr: false }
);

const LazyProductDraftAlert = dynamic(
  () => import("@/components/ProductDraftAlert").then(mod => mod.ProductDraftAlert),
  { ssr: false }
);

const ProductPreviewModal = dynamic(() => import("@/components/ProductPreviewModal").then(mod => mod.ProductPreviewModal), { ssr: false });

export default function NewProductPage() {
  const router = useRouter();


  // Add this for auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add state for tracking completed sections and draft
  const [completedSections, setCompletedSections] = useState<ProductDraftSection[]>([]);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [draftId, setDraftId] = useState<string>("");
  const [showDraftAlert, setShowDraftAlert] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "HIDDEN">("PUBLIC");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [productImages, setProductImages] = useState<CreateProductImageDto[]>([]);

  // Debug product images state changes
  useEffect(() => {
    console.log('productImages state changed:', productImages);
  }, [productImages]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Multi-tenancy: Store and Seller state
  const { user, isAdmin, isSeller } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [sellers, setSellers] = useState<User[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [loadingStores, setLoadingStores] = useState(false);
  const [currency, setCurrency] = useState<string>("BDT");
  const [variants, setVariants] = useState<CreateProductVariantDto[]>([]);
  
  // Tag search and creation state
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
  const [showCreateTagForm, setShowCreateTagForm] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>("");
  const [creatingTag, setCreatingTag] = useState<boolean>(false);


  // Form validation and submission state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data loading state
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Add state for product specifications
  const [specifications, setSpecifications] = useState<CreateProductSpecificationDto[]>([]);

  // Add a new state variable for lowStockThreshold near the other state variables
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");

  // Available currencies

  // Add product preview functionality
  const {
    isPreviewOpen,
    previewDevice,
    previewContext,
    togglePreview,
    openPreview,
    closePreview,
    setPreviewDevice,
    setPreviewContext
  } = useProductPreview();

  // Fetch categories, brands, and tags on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingBrands(true);
        setLoadingTags(true);

        const [categoryTreeData, brandsData, tagsData] = await Promise.all([
          categoriesApi.getCategoryTree(),
          brandsApi.getBrands(),
          tagsApi.getTags()
        ]);

        // Create a flat list of all categories
        const flattenCategories = (categories: any[], parentId: string | null = null): any[] => {
          return categories.reduce((acc, category) => {
            const children = category.children || [];
            const current = {
              ...category,
              parentId
            };

            // Remove the children property from the current category
            delete current.children;

            return [...acc, current, ...flattenCategories(children, category.id)];
          }, []);
        };

        const allCategories = flattenCategories(categoryTreeData);

        // Show all categories
        setCategories(allCategories);

        // Store all categories for filtering subcategories later
        setAllCategories(allCategories);
        setBrands(brandsData);
        setTags(tagsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load required data. Please try again.");
      } finally {
        setLoadingCategories(false);
        setLoadingBrands(false);
        setLoadingTags(false);
      }
    };

    fetchData();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      setLoadingSubcategories(true);
      // Reset subcategory selection when parent category changes
      setSubCategoryId("");

      // Filter all categories to find subcategories of the selected category
      const subs = allCategories.filter(cat => cat.parentId === categoryId);
      setSubcategories(subs);

      setLoadingSubcategories(false);
    } else {
      // Clear subcategories when no parent category is selected
      setSubcategories([]);
      setSubCategoryId("");
    }
  }, [categoryId, allCategories]);

  // Multi-tenancy: Load stores for seller
  useEffect(() => {
    if (isSeller) {
      loadSellerStores();
    }
  }, [isSeller]);

  // Multi-tenancy: Load sellers for admin
  useEffect(() => {
    if (isAdmin) {
      loadSellers();
    }
  }, [isAdmin]);

  const loadSellerStores = async () => {
    setLoadingStores(true);
    try {
      const response = await storesService.getStores();
      if (response.success) {
        const approvedStores = response.data.filter(s => s.status === 'APPROVED');
        setStores(approvedStores);
        if (approvedStores.length === 1) {
          setStoreId(approvedStores[0].id); // Auto-select if only one
        }
      } else {
        toast.error(response.error || 'Failed to load stores');
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoadingStores(false);
    }
  };

  const loadSellers = async () => {
    try {
      const response = await usersService.getUsers({ role: 'SELLER' });
      if (response.success) {
        setSellers(response.data.users);
      } else {
        toast.error(response.error || 'Failed to load sellers');
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
      toast.error('Failed to load sellers');
    }
  };

  const handleSellerChange = async (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setStoreId(""); // Reset store selection
    setLoadingStores(true);
    
    try {
      // Load stores for selected seller
      const response = await storesService.getStores();
      if (response.success) {
        const sellerStores = response.data.filter(s => 
          s.sellerId === sellerId && s.status === 'APPROVED'
        );
        setStores(sellerStores);
      } else {
        toast.error(response.error || 'Failed to load seller stores');
      }
    } catch (error) {
      console.error('Error loading seller stores:', error);
      toast.error('Failed to load seller stores');
    } finally {
      setLoadingStores(false);
    }
  };

  // Generate SKU for product
  const generateSku = (title: string): string => {
    if (!title.trim()) return "";

    // Extract prefix from title (first 3 characters, uppercase)
    const prefix = title
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    // Add timestamp and random string for uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `${prefix}-${timestamp}-${random}`;
  };

  // Generate SKU for variant
  const generateVariantSku = (baseSku: string, variantName: string): string => {
    if (!baseSku.trim() || !variantName.trim()) return "";

    // Extract suffix from variant name (first 5 characters, uppercase)
    const variantSuffix = variantName
      .substring(0, 5)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .padEnd(5, 'X');

    return `${baseSku}-${variantSuffix}`;
  };

  // Update SKU when title changes
  useEffect(() => {
    if (title && !sku) {
      setSku(generateSku(title));
    }
  }, [title, sku]);

  // Add a new variant with auto-generated SKU
  const addVariant = () => {
    const variantName = "";
    const variantSku = sku ? generateVariantSku(sku, variantName) : "";

    setVariants([
      ...variants,
      {
        variantName,
        sku: variantSku,
        stockQuantity: 0,
        price: Number(price) || 0,  // Use the main product price as default
        additionalPrice: 0,
        threshold: Number(lowStockThreshold) || 5  // Use main product threshold as default
      }
    ]);
  };

  // Update a variant
  const updateVariant = (index: number, field: keyof CreateProductVariantDto, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === 'stockQuantity' || field === 'price' || field === 'additionalPrice'
        ? Number(value) || 0 // Ensure we always have a number, default to 0
        : value
    };

    // Auto-generate SKU when variant name changes
    if (field === 'variantName' && sku) {
      updatedVariants[index].sku = generateVariantSku(sku, value);
    }

    setVariants(updatedVariants);
  };

  // Remove a variant
  const removeVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);
  };







  // Memoize the dimensions object to prevent unnecessary re-renders
  const dimensions = useMemo(() => ({
    length: length || "",
    width: width || "",
    height: height || ""
  }), [length, width, height]);

  // Memoize the filtered subcategories
  const filteredSubcategories = useMemo(() => {
    if (!categoryId) return [];
    return allCategories.filter(cat => cat.parentId === categoryId);
  }, [categoryId, allCategories]);

  // Optimize image URLs by using a lazy-access approach
  const imageObjectURLs = useMemo(() => {
    return productImages.map(image => ({
      image,
      // Use helper function to safely create object URL
      url: getSafeImageSrc(image.imageUrl)
    }));
  }, [productImages]);

  // Update the form validation function to be memoized with better error messages
  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate required fields with user-friendly messages
    if (!title.trim()) {
      newErrors.title = "Please enter a product title. This helps customers identify your product.";
    } else if (title.trim().length < 3) {
      newErrors.title = "Product title must be at least 3 characters long.";
    } else if (title.trim().length > 100) {
      newErrors.title = "Product title cannot exceed 100 characters.";
    }

    if (!sku.trim()) {
      newErrors.sku = "Please enter a SKU (Stock Keeping Unit). This unique code helps track your inventory.";
    } else if (sku.trim().length < 3) {
      newErrors.sku = "SKU must be at least 3 characters long.";
    } else if (sku.trim().length > 50) {
      newErrors.sku = "SKU cannot exceed 50 characters.";
    }

    if (!price || price.trim() === "") {
      newErrors.price = "Please enter a price for your product.";
    } else if (isNaN(Number(price))) {
      newErrors.price = "Please enter a valid price (numbers only).";
    } else if (Number(price) <= 0) {
      newErrors.price = "Price must be greater than 0.";
    } else if (Number(price) > 999999) {
      newErrors.price = "Price cannot exceed ₹9,99,999.";
    }

    if (!categoryId.trim()) {
      newErrors.categoryId = "Please select a category. This helps customers find your product.";
    }

    // Validate discount price if provided
    if (discountPrice && discountPrice.trim() !== "") {
      if (isNaN(Number(discountPrice))) {
        newErrors.discountPrice = "Please enter a valid discount price (numbers only).";
      } else if (Number(discountPrice) <= 0) {
        newErrors.discountPrice = "Discount price must be greater than 0.";
      } else if (Number(discountPrice) >= Number(price)) {
        newErrors.discountPrice = "Discount price must be less than the regular price.";
      }
    }

    // Validate stock quantity
    if (stockQuantity && stockQuantity.trim() !== "") {
      if (isNaN(Number(stockQuantity))) {
        newErrors.stockQuantity = "Please enter a valid stock quantity (numbers only).";
      } else if (Number(stockQuantity) < 0) {
        newErrors.stockQuantity = "Stock quantity cannot be negative.";
      } else if (Number(stockQuantity) > 999999) {
        newErrors.stockQuantity = "Stock quantity cannot exceed 999,999.";
      }
    }

    // Validate variants with detailed messages
    variants.forEach((variant, index) => {
      if (!variant.variantName || !variant.variantName.trim()) {
        newErrors[`variant_${index}_name`] = `Please enter a name for variant ${index + 1} (e.g., "Red", "Large", "XL").`;
      } else if (variant.variantName.trim().length < 1) {
        newErrors[`variant_${index}_name`] = `Variant ${index + 1} name cannot be empty.`;
      } else if (variant.variantName.trim().length > 50) {
        newErrors[`variant_${index}_name`] = `Variant ${index + 1} name cannot exceed 50 characters.`;
      }

      if (!variant.sku || !variant.sku.trim()) {
        newErrors[`variant_${index}_sku`] = `Please enter a SKU for variant ${index + 1}.`;
      } else if (variant.sku.trim().length < 3) {
        newErrors[`variant_${index}_sku`] = `Variant ${index + 1} SKU must be at least 3 characters long.`;
      } else if (variant.sku.trim().length > 50) {
        newErrors[`variant_${index}_sku`] = `Variant ${index + 1} SKU cannot exceed 50 characters.`;
      }

      if (variant.price <= 0) {
        newErrors[`variant_${index}_price`] = `Variant ${index + 1} price must be greater than 0.`;
      } else if (variant.price > 999999) {
        newErrors[`variant_${index}_price`] = `Variant ${index + 1} price cannot exceed ₹9,99,999.`;
      }

      if (variant.stockQuantity < 0) {
        newErrors[`variant_${index}_stock`] = `Variant ${index + 1} stock quantity cannot be negative.`;
      } else if (variant.stockQuantity > 999999) {
        newErrors[`variant_${index}_stock`] = `Variant ${index + 1} stock quantity cannot exceed 999,999.`;
      }
    });

    // Validate image URLs with helpful messages
    productImages.forEach((image, index) => {
      if (!image.imageUrl || !image.imageUrl.trim()) {
        newErrors[`image_${index}_url`] = `Please provide a URL for image ${index + 1}.`;
      } else {
        // Check if URL is valid
        try {
          const url = new URL(image.imageUrl);
          // Check if it's a valid image URL
          if (!url.protocol.match(/^https?:$/)) {
            newErrors[`image_${index}_url`] = `Image ${index + 1} URL must start with http:// or https://`;
          }
        } catch (e) {
          newErrors[`image_${index}_url`] = `Image ${index + 1} URL is not valid. Please check the format.`;
        }
      }
    });

    // Multi-tenancy validation
    if (!storeId) {
      toast.error("Please select a store for this product");
      return false;
    }

    if (isAdmin && !selectedSellerId) {
      toast.error("Please select a seller for this product");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, sku, price, discountPrice, stockQuantity, variants, productImages, categoryId, storeId, isAdmin, selectedSellerId]);



  // Function to collect all form data
  const collectFormData = useCallback(() => {
    return {
      title,
      description,
      shortDescription,
      price,
      discountPrice,
      sku,
      barcode,
      weight,
      dimensions,
      stockQuantity,
      brandId,
      categoryId,
      subCategoryId,
      isActive,
      isFeatured,
      visibility,
      metaTitle,
      metaDescription,
      metaKeywords,
      productImages,
      selectedTags,
      currency,
      variants,
      specifications,
      lowStockThreshold,
      storeId,
      ...(isAdmin && { selectedSellerId }),
    };
  }, [
    title, description, shortDescription, price, discountPrice,
    sku, barcode, weight, dimensions, stockQuantity,
    brandId, categoryId, subCategoryId, isActive, isFeatured,
    visibility, metaTitle, metaDescription, metaKeywords,
    productImages, selectedTags, currency, variants,
    specifications, lowStockThreshold, storeId, isAdmin, selectedSellerId
  ]);

  // Auto-save function
  const autoSaveDraft = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const formData = collectFormData();

        // Only save if there's at least some data (title or SKU)
        if (formData.title || formData.sku) {
          // Determine completed sections
          const sections = determineCompletedSections(formData);
          setCompletedSections(sections);

          // Save draft
          const newDraftId = saveProductDraft(formData, sections, draftId, true);
          setDraftId(newDraftId);
          setHasDraft(true);
          setLastSaved(Date.now());
        }
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
  }, [collectFormData, draftId]);

  // Function to manually save draft
  const saveDraft = useCallback(() => {
    try {
      const formData = collectFormData();
      const sections = determineCompletedSections(formData);
      setCompletedSections(sections);

      const newDraftId = saveProductDraft(formData, sections, draftId);
      setDraftId(newDraftId);
      setHasDraft(true);
      setLastSaved(Date.now());
    } catch (error) {
      console.error("Save draft error:", error);
    }
  }, [collectFormData, draftId]);

  // Function to load draft
  const loadDraft = useCallback(() => {
    const draft = loadProductDraft();

    if (draft && draft.data) {
      // Set form fields from draft data
      const data = draft.data;

      // Basic info
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.shortDescription) setShortDescription(data.shortDescription);
      if (data.price) setPrice(data.price.toString());
      if (data.discountPrice) setDiscountPrice(data.discountPrice.toString());
      if (data.sku) setSku(data.sku);
      if (data.barcode) setBarcode(data.barcode);

      // Dimensions
      if (data.dimensions?.length) setLength(data.dimensions.length.toString());
      if (data.dimensions?.width) setWidth(data.dimensions.width.toString());
      if (data.dimensions?.height) setHeight(data.dimensions.height.toString());
      if (data.weight) setWeight(data.weight.toString());

      // Inventory
      if (data.stockQuantity) setStockQuantity(data.stockQuantity.toString());
      if (data.lowStockThreshold) setLowStockThreshold(data.lowStockThreshold.toString());

      // Categories and relations
      if (data.brandId) setBrandId(data.brandId);
      if (data.categoryId) setCategoryId(data.categoryId);
      if (data.subCategoryId) setSubCategoryId(data.subCategoryId);

      // Multi-tenancy
      if (data.storeId) setStoreId(data.storeId);
      if (data.selectedSellerId) setSelectedSellerId(data.selectedSellerId);

      // Product status
      if (data.isActive !== undefined) setIsActive(data.isActive);
      if (data.isFeatured !== undefined) setIsFeatured(data.isFeatured);
      if (data.visibility) setVisibility(data.visibility);

      // SEO
      if (data.metaTitle) setMetaTitle(data.metaTitle);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
      if (data.metaKeywords) setMetaKeywords(data.metaKeywords);

      // Complex arrays
      if (data.productImages) setProductImages(data.productImages);
      if (data.selectedTags) setSelectedTags(data.selectedTags);
      if (data.variants) setVariants(data.variants);
      if (data.currency) setCurrency(data.currency);

      // Specifications - ensure we have a complete specifications array
      if (data.specifications && Array.isArray(data.specifications)) {
        // Make sure each specification has all required properties
        const validSpecs = data.specifications.map(spec => ({
          productId: spec.productId || "new",
          specKey: spec.specKey || "",
          specValue: spec.specValue || "",
          specGroup: spec.specGroup || "Technical Specifications",
          sortOrder: spec.sortOrder || 0,
          isFilterable: spec.isFilterable !== undefined ? spec.isFilterable : true
        })).filter(spec => spec.specKey && spec.specKey.trim() !== "");

        setSpecifications(validSpecs);
      }

      // Update state
      setDraftId(draft.draftId);
      setHasDraft(true);
      setLastSaved(draft.lastUpdated);
      setCompletedSections(draft.completedSections);
      setShowDraftAlert(false);

      toast.success("Draft loaded", {
        description: "Your saved work has been restored"
      });
    }
  }, []);

  // Function to discard draft
  const discardDraft = useCallback(() => {
    clearProductDraft(false);
    setHasDraft(false);
    setDraftId("");
    setShowDraftAlert(false);
  }, []);

  // Set up form field change listeners to trigger auto-save
  useEffect(() => {
    autoSaveDraft();
  }, [
    title, description, shortDescription, price, discountPrice,
    sku, barcode, weight, length, width, height, stockQuantity,
    brandId, categoryId, subCategoryId, isActive, isFeatured,
    visibility, metaTitle, metaDescription, metaKeywords,
    productImages, selectedTags, currency, variants,
    specifications, lowStockThreshold,
    autoSaveDraft
  ]);

  // Check for existing draft on initial load
  useEffect(() => {
    const draft = loadProductDraft();
    if (draft) {
      setShowDraftAlert(true);
      setDraftId(draft.draftId);
      setHasDraft(true);
      setLastSaved(draft.lastUpdated);
      setCompletedSections(draft.completedSections);
    }
  }, []);

  // Clear auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Validate images section when productImages changes
  useEffect(() => {
    setCompletedSections(prev => {
      const otherSections = prev.filter(section => section !== 'images');

      // Check if images section should be completed
      if (productImages.length > 0) {
        const validImages = productImages.filter(img => img && img.imageUrl && img.imageUrl.trim());
        if (validImages.length > 0) {
          return [...otherSections, 'images'];
        }
      }

      return otherSections;
    });
  }, [productImages]);

  // Add handler for specifications change
  const handleSpecificationsChange = (newSpecs: CreateProductSpecificationDto[]) => {
    setSpecifications(newSpecs);
  };

  // Real-time validation for individual fields
  const validateField = useCallback((fieldName: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = "Please enter a product title. This helps customers identify your product.";
        } else if (value.trim().length < 3) {
          newErrors.title = "Product title must be at least 3 characters long.";
        } else if (value.trim().length > 100) {
          newErrors.title = "Product title cannot exceed 100 characters.";
        } else {
          delete newErrors.title;
        }
        break;
        
      case 'sku':
        if (!value.trim()) {
          newErrors.sku = "Please enter a SKU (Stock Keeping Unit). This unique code helps track your inventory.";
        } else if (value.trim().length < 3) {
          newErrors.sku = "SKU must be at least 3 characters long.";
        } else if (value.trim().length > 50) {
          newErrors.sku = "SKU cannot exceed 50 characters.";
        } else {
          delete newErrors.sku;
        }
        break;
        
      case 'price':
        if (!value || value.trim() === "") {
          newErrors.price = "Please enter a price for your product.";
        } else if (isNaN(Number(value))) {
          newErrors.price = "Please enter a valid price (numbers only).";
        } else if (Number(value) <= 0) {
          newErrors.price = "Price must be greater than 0.";
        } else if (Number(value) > 999999) {
          newErrors.price = "Price cannot exceed ₹9,99,999.";
        } else {
          delete newErrors.price;
        }
        break;
        
      case 'categoryId':
        if (!value.trim()) {
          newErrors.categoryId = "Please select a category. This helps customers find your product.";
        } else {
          delete newErrors.categoryId;
        }
        break;
        
      case 'discountPrice':
        if (value && value.trim() !== "") {
          if (isNaN(Number(value))) {
            newErrors.discountPrice = "Please enter a valid discount price (numbers only).";
          } else if (Number(value) <= 0) {
            newErrors.discountPrice = "Discount price must be greater than 0.";
          } else if (Number(value) >= Number(price)) {
            newErrors.discountPrice = "Discount price must be less than the regular price.";
          } else {
            delete newErrors.discountPrice;
          }
        } else {
          delete newErrors.discountPrice;
        }
        break;
        
      case 'stockQuantity':
        if (value && value.trim() !== "") {
          if (isNaN(Number(value))) {
            newErrors.stockQuantity = "Please enter a valid stock quantity (numbers only).";
          } else if (Number(value) < 0) {
            newErrors.stockQuantity = "Stock quantity cannot be negative.";
          } else if (Number(value) > 999999) {
            newErrors.stockQuantity = "Stock quantity cannot exceed 999,999.";
          } else {
            delete newErrors.stockQuantity;
          }
        } else {
          delete newErrors.stockQuantity;
        }
        break;
    }
    
    setErrors(newErrors);
  }, [errors, price]);

  // Update the handleSubmit function to include specifications
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorEl = document.querySelector(".border-destructive");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare dimensions object if any dimension field is provided
      let dimensions: Dimensions | undefined;
      if (length || width || height) {
        dimensions = {
          length: Number(length) || 0,
          width: Number(width) || 0,
          height: Number(height) || 0
        };
      }

      // Create product data object
      const productData: CreateProductDto = {
        title: title.trim(),
        sku: sku.trim(),
        price: Number(price),
        storeId: storeId, // Required for multi-tenancy
        ...(isAdmin && selectedSellerId && { sellerId: selectedSellerId }), // Admin can specify seller
      };

      // Add optional fields if they have values
      if (description) productData.description = description;
      if (shortDescription) productData.shortDescription = shortDescription;
      if (discountPrice) productData.discountPrice = Number(discountPrice);
      if (stockQuantity) productData.stockQuantity = Number(stockQuantity);
      if (barcode) productData.barcode = barcode;
      if (weight) productData.weight = Number(weight);
      if (dimensions) productData.dimensions = dimensions;
      if (brandId) productData.brandId = brandId;
      if (categoryId) productData.categoryId = categoryId;
      if (subCategoryId) productData.subCategoryId = subCategoryId;
      if (metaTitle) productData.metaTitle = metaTitle;
      if (metaDescription) productData.metaDescription = metaDescription;
      if (metaKeywords) productData.metaKeywords = metaKeywords;
      if (productImages.length > 0) {
        productData.images = productImages;
      }
      if (selectedTags.length > 0) productData.tagIds = selectedTags;
      if (variants.length > 0) {
        // Ensure all variants have proper price values
        productData.variants = variants.map(variant => ({
          ...variant,
          price: variant.price > 0 ? variant.price : Number(price),
          additionalPrice: variant.additionalPrice || 0,
          stockQuantity: variant.stockQuantity || 0
        }));
      }

      // These properties have default values
      productData.isActive = isActive;
      productData.isFeatured = isFeatured;
      productData.visibility = visibility;
      productData.currency = currency;

      // Call API to create product
      const result = await productsApi.createProduct(productData);

      // If we have specifications, save them
      if (specifications.length > 0) {
        // Update product IDs in specifications
        const specsWithProductId = specifications.map(spec => ({
          ...spec,
          productId: result.id
        }));

        try {
          // Save specifications in bulk
          await specificationsApi.createProductSpecificationsBulk(
            specsWithProductId.filter(spec => spec.specValue.trim() !== "")
          );
        } catch (specError) {
          console.error("Error saving specifications:", specError);
          // Don't fail the whole process if specs fail
          toast.error("Product created but specifications could not be saved");
        }
      }

      // Add this at the end after successful creation
      clearProductDraft(true); // Silently clear the draft

      // Show success message
      toast.success("Product created successfully");

      // Navigate to product detail page
      router.push(`/products/${result.id}`);
    } catch (error: any) {
      console.error("Error creating product:", error);

      // Extract error message from API response
      let errorMessage = "Failed to create product";
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          // Handle array of error messages
          if (Array.isArray(error.response.data.message)) {
            errorMessage = error.response.data.message.join('\n');
          } else {
            errorMessage = error.response.data.message;
          }
        } else if (error.response.status === 400) {
          errorMessage = "Invalid product data. Please check all required fields.";
        } else if (error.response.status === 401) {
          errorMessage = "You are not authorized to create products";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [tags, tagSearchQuery]);

  // Create new tag function
  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    
    setCreatingTag(true);
    try {
      // You'll need to implement this API call in your tags-api.ts
      const newTag = await tagsApi.createTag({ name: newTagName.trim() });
      
      // Add the new tag to the tags list
      setTags(prev => [...prev, newTag]);
      
      // Automatically select the new tag
      setSelectedTags(prev => [...prev, newTag.id]);
      
      // Reset form
      setNewTagName("");
      setShowCreateTagForm(false);
      setTagSearchQuery("");
      
      toast.success("Tag created successfully");
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  // Build a preview-ready product object from form data
  const previewProduct: PreviewProduct = {
    title: title || "New Product",
    shortDescription: shortDescription || "",
    description: description || "",
    price,
    discountPrice,
    images: productImages.map(img => ({
      imageUrl: img.imageUrl,
      altText: img.altText
    })),
    brand: brandId ? {
      name: brands.find(b => b.id === brandId)?.name || ''
    } : undefined,
    category: categoryId ? {
      name: categories.find(c => c.id === categoryId)?.name || ''
    } : undefined,
    isActive,
    isFeatured,
    currency
  };

  return (
    <MainLayout>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/products" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-3xl font-bold">Add New Product</h1>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={togglePreview}
                title="Preview product"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={submitting}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button type="submit" disabled={submitting}>
                <Plus className="mr-2 h-4 w-4" />
                {submitting ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </div>

          {showDraftAlert && (
            <LazyProductDraftAlert
              draft={{
                data: {},
                lastUpdated: lastSaved || Date.now(),
                completedSections,
                draftId
              }}
              onResume={loadDraft}
              onDiscard={discardDraft}
            />
          )}

          {hasDraft && (
            <LazyProductFormProgress
              completedSections={completedSections}
              className="mb-2"
            />
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              {error}
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <X className="h-4 w-4" />
                <h3 className="font-semibold">Please fix the following issues:</h3>
              </div>
              <ul className="space-y-1 text-sm">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field} className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>{message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-2 space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Basic product details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center">
                        Product Title*
                        <FormTooltip content="Enter a clear, descriptive title that will help customers find your product. Good titles include key product attributes like brand, model, color or size." />
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter product title"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          validateField('title', e.target.value);
                        }}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="sku" className="flex items-center">
                          SKU* (Auto-generated)
                          <FormTooltip content="SKU (Stock Keeping Unit) is a unique identifier for your product. It's used for inventory management and helps track products across your store." />
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSku(generateSku(title))}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <Input
                        id="sku"
                        placeholder="Enter SKU code"
                        value={sku}
                        onChange={(e) => {
                          setSku(e.target.value);
                          validateField('sku', e.target.value);
                        }}
                        className={errors.sku ? "border-destructive" : ""}
                      />
                      {errors.sku && (
                        <p className="text-sm text-destructive">{errors.sku}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        SKU is auto-generated based on the product title, but you can edit it manually
                      </p>
                    </div>

                    <div className="space-y-2">

                      <div className="flex items-center justify-between mb-2">
                        <Label>
                          Brand
                          <FormTooltip content="Associating your product with a brand helps with categorization and makes it easier for customers to find related products." />

                        </Label>
                        <Link href="/brands/new" className="text-sm text-blue-600 hover:text-blue-800">
                          + Create New Brand
                        </Link>
                      </div>
                      <Select value={brandId} onValueChange={setBrandId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingBrands ? (
                            <SelectItem value="loading" disabled>Loading brands...</SelectItem>
                          ) : (
                            brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">

                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center">
                          Category*
                          <FormTooltip content="Categories help organize your products and make them easier to find. Select the most relevant category for this product." />
                        </Label>
                        <Link href="/categories/new" className="text-sm text-blue-600 hover:text-blue-800">
                          + Create New Category
                        </Link>
                      </div>
                      <Select value={categoryId} onValueChange={(value) => {
                        setCategoryId(value);
                        validateField('categoryId', value);
                      }}>
                        <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
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
                      {errors.categoryId && (
                        <p className="text-sm text-destructive">{errors.categoryId}</p>
                      )}
                    </div>

                    {categoryId && (
                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Subcategory</Label>
                        <Select value={subCategoryId} onValueChange={setSubCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingSubcategories ? (
                              <SelectItem value="loading" disabled>Loading subcategories...</SelectItem>
                            ) : subcategories.length > 0 ? (
                              subcategories.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                  {subcategory.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No subcategories available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Optional</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="price" className="flex items-center">
                        Price*
                        <FormTooltip content="Set your product's base price. This is what customers will pay when there's no discount or sale applied." />
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          validateField('price', e.target.value);
                        }}
                        className={errors.price ? "border-destructive" : ""}
                      />
                      {errors.price && (
                        <p className="text-sm text-destructive">{errors.price}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCurrencyOptions().map((curr) => (
                            <SelectItem key={curr.value} value={curr.value}>
                              {curr.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountPrice" className="flex items-center">
                        Discount Price
                        <FormTooltip content="Optional discounted price that will be shown as a special offer. Leave empty if your product isn't on sale." />
                      </Label>
                      <Input
                        id="discountPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={discountPrice}
                        onChange={(e) => {
                          setDiscountPrice(e.target.value);
                          validateField('discountPrice', e.target.value);
                        }}
                        className={errors.discountPrice ? "border-destructive" : ""}
                      />
                      {errors.discountPrice && (
                        <p className="text-sm text-destructive">{errors.discountPrice}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        placeholder="Enter barcode"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity" className="flex items-center">
                        Stock Quantity*
                        <FormTooltip content="Enter the number of units currently available for sale. This will decrease as orders are placed." />
                      </Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        placeholder="0"
                        value={stockQuantity}
                        onChange={(e) => {
                          setStockQuantity(e.target.value);
                          validateField('stockQuantity', e.target.value);
                        }}
                        className={errors.stockQuantity ? "border-destructive" : ""}
                      />
                      {errors.stockQuantity && (
                        <p className="text-sm text-destructive">{errors.stockQuantity}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold" className="flex items-center">
                        Low Stock Threshold
                        <FormTooltip content="When product stock falls below this value, it will be marked as 'Low Stock'" />
                      </Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        placeholder="5"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default value is 5. When stock is below this threshold, products will be marked as "Low Stock"
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Textarea
                        id="shortDescription"
                        rows={2}
                        placeholder="Brief product description"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description" className="flex items-center">
                        Full Description
                        <FormTooltip content="Provide a comprehensive description including all relevant product details, features, and benefits. Use formatting to make it readable." />
                      </Label>
                      <Textarea
                        id="description"
                        rows={5}
                        placeholder="Full product description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Different versions of the product (colors, sizes, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {variants.length > 0 ? (
                    <div className="space-y-6">
                      {variants.map((variant, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Variant #{index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`variant-${index}-name`}>Variant Name*</Label>
                              <Input
                                id={`variant-${index}-name`}
                                placeholder="e.g., Red, XL"
                                value={variant.variantName}
                                onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                                className={errors[`variant_${index}_name`] ? "border-destructive" : ""}
                              />
                              {errors[`variant_${index}_name`] && (
                                <p className="text-sm text-destructive">{errors[`variant_${index}_name`]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`variant-${index}-sku`}>Variant SKU* (Auto-generated)</Label>
                              <Input
                                id={`variant-${index}-sku`}
                                placeholder="Enter variant SKU"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                className={errors[`variant_${index}_sku`] ? "border-destructive" : ""}
                              />
                              {errors[`variant_${index}_sku`] && (
                                <p className="text-sm text-destructive">{errors[`variant_${index}_sku`]}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Auto-generated based on product SKU and variant name
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`variant-${index}-price`}>Price (leave empty to use base price)</Label>
                              <Input
                                id={`variant-${index}-price`}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={variant.price || ""}
                                onChange={(e) => updateVariant(index, 'price', e.target.value || null)}
                                className={errors[`variant_${index}_price`] ? "border-destructive" : ""}
                              />
                              {errors[`variant_${index}_price`] && (
                                <p className="text-sm text-destructive">{errors[`variant_${index}_price`]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`variant-${index}-additional`}>Additional Price</Label>
                              <Input
                                id={`variant-${index}-additional`}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={variant.additionalPrice || ""}
                                onChange={(e) => updateVariant(index, 'additionalPrice', e.target.value || 0)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`variant-${index}-stock`}>Stock Quantity</Label>
                              <Input
                                id={`variant-${index}-stock`}
                                type="number"
                                placeholder="0"
                                value={variant.stockQuantity || 0}
                                onChange={(e) => updateVariant(index, 'stockQuantity', e.target.value || 0)}
                                className={errors[`variant_${index}_stock`] ? "border-destructive" : ""}
                              />
                              {errors[`variant_${index}_stock`] && (
                                <p className="text-sm text-destructive">{errors[`variant_${index}_stock`]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`variant-${index}-threshold`}>Low Stock Threshold</Label>
                              <Input
                                id={`variant-${index}-threshold`}
                                type="number"
                                min="1"
                                placeholder="5"
                                value={variant.threshold || 5}
                                onChange={(e) => updateVariant(index, 'threshold', parseInt(e.target.value) || 5)}
                              />
                              <p className="text-xs text-muted-foreground">
                                When stock falls below this value, variant will be marked as "Low Stock"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      No variants added yet. Add a variant using the button below.
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVariant}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Specifications</CardTitle>
                  <CardDescription>
                    Technical details and measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="length">Length</Label>
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>
                    Search engine optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle" className="flex items-center">
                        Meta Title
                        <FormTooltip content="The meta title appears in search engine results and browser tabs. Keep it under 60 characters for best SEO practices." />
                      </Label>
                      <Input
                        id="metaTitle"
                        placeholder="SEO title"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        rows={3}
                        placeholder="SEO description"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">Meta Keywords</Label>
                      <Input
                        id="metaKeywords"
                        placeholder="keyword1, keyword2, keyword3"
                        value={metaKeywords}
                        onChange={(e) => setMetaKeywords(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              {/* Store Selection Section - Required for Multi-Tenancy */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Assignment</CardTitle>
                  <CardDescription>
                    {isAdmin 
                      ? "Select the seller and store for this product" 
                      : "Select which store this product belongs to"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Admin: Seller Selection */}
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="seller">
                        Seller <span className="text-destructive">*</span>
                      </Label>
                      <Select value={selectedSellerId} onValueChange={handleSellerChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seller first" />
                        </SelectTrigger>
                        <SelectContent>
                          {sellers.map(seller => (
                            <SelectItem key={seller.id} value={seller.id}>
                              {seller.firstName} {seller.lastName} ({seller.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Store Selection (both Admin and Seller) */}
                  <div className="space-y-2">
                    <Label htmlFor="store">
                      Store <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={storeId} 
                      onValueChange={setStoreId}
                      disabled={isAdmin && !selectedSellerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingStores 
                            ? "Loading stores..." 
                            : stores.length === 0 
                            ? "No approved stores available" 
                            : "Select store"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} {store.isOnVacation ? "(On Vacation)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {stores.length === 0 && !loadingStores && (
                      <p className="text-sm text-destructive">
                        {isAdmin 
                          ? "Selected seller has no approved stores" 
                          : "You need to create and get approval for a store first"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>
                    Product visibility settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={visibility}
                      onValueChange={(value: "PUBLIC" | "PRIVATE" | "HIDDEN") => setVisibility(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="HIDDEN">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(checked) => setIsActive(!!checked)}
                    />
                    <Label htmlFor="isActive">Active Product</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(!!checked)}
                    />
                    <Label htmlFor="isFeatured">Featured Product</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>
                    Product photos and media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    folder="products"
                    multiple={true}
                    maxSizeMB={10}
                    allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                    value={productImages
                      .filter(img => img && img.imageUrl)
                      .map((img, index) => {
                        // Try to detect mimetype from URL extension
                        const url = img.imageUrl.toLowerCase();
                        let mimetype = 'image/jpeg'; // default
                        if (url.includes('.png')) mimetype = 'image/png';
                        else if (url.includes('.gif')) mimetype = 'image/gif';
                        else if (url.includes('.webp')) mimetype = 'image/webp';
                        else if (url.includes('.svg')) mimetype = 'image/svg+xml';

                        return {
                          key: `product-image-${img.position || index}-${img.imageUrl.substring(img.imageUrl.lastIndexOf('/') + 1)}`,
                          url: img.imageUrl,
                          originalName: img.altText || `Product image ${index + 1}`,
                          mimetype,
                          size: 1024 // Placeholder size
                        };
                      })}
                    onFilesChange={(files: UploadedFileInfo[]) => {
                      // This handles file removal and reordering from the UI
                      const images = files.map((file, index) => ({
                        imageUrl: file.url,
                        altText: file.originalName || `Product image ${index + 1}`,
                        position: index
                      }));

                      setProductImages(images);
                    }}
                    onSuccess={(files) => {
                      // Directly process backend response and add to productImages
                      const newImages = files.map((file, index) => ({
                        imageUrl: file.url, // Backend URL from response
                        altText: file.originalName || `Product image ${productImages.length + index + 1}`,
                        position: productImages.length + index
                      }));

                      // Add to existing productImages
                      const updatedImages = [...productImages, ...newImages];
                      setProductImages(updatedImages);

                      // Immediate validation
                      setTimeout(() => {
                        const formData = {
                          title,
                          description,
                          shortDescription,
                          price,
                          discountPrice,
                          sku,
                          barcode,
                          weight,
                          dimensions,
                          stockQuantity,
                          brandId,
                          categoryId,
                          subCategoryId,
                          isActive,
                          isFeatured,
                          visibility,
                          metaTitle,
                          metaDescription,
                          metaKeywords,
                          productImages: updatedImages,
                          selectedTags,
                          currency,
                          variants,
                          specifications,
                          lowStockThreshold,
                        };
                        const sections = determineCompletedSections(formData);
                        setCompletedSections(sections);
                      }, 50);

                      toast.success(`Uploaded ${files.length} image(s) successfully`);
                    }}
                    onError={(error) => {
                      toast.error('Upload failed', { description: error });
                    }}
                    placeholder="Drag and drop product images here or click to browse"
                    dragText="Drop product images here to upload"
                    browseText="Browse Images"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                  <CardDescription>
                    Product tags for better discoverability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Create Tag Section */}
                  <div className="space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tags..."
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Create New Tag Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateTagForm(!showCreateTagForm)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Tag
                    </Button>

                    {/* Create Tag Form */}
                    {showCreateTagForm && (
                      <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                        <Label htmlFor="newTagName">New Tag Name</Label>
                        <div className="flex gap-2">
                          <Input
                            id="newTagName"
                            placeholder="Enter tag name"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                createNewTag();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={createNewTag}
                            disabled={!newTagName.trim() || creatingTag}
                          >
                            {creatingTag ? "Creating..." : "Create"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowCreateTagForm(false);
                              setNewTagName("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Tags Display */}
                  {selectedTags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Tags ({selectedTags.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <div
                              key={tagId}
                              className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                            >
                              <span>{tag.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleTag(tagId)}
                                className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Tags List */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Available Tags ({filteredTags.length})
                    </Label>
                    
                    {loadingTags ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground">Loading tags...</div>
                      </div>
                    ) : filteredTags.length > 0 ? (
                      <div className="max-h-110 overflow-y-auto border rounded-md p-2 space-y-1">
                        {filteredTags.map(tag => (
                          <div
                            key={tag.id}
                            className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors ${
                              selectedTags.includes(tag.id) ? 'bg-muted' : ''
                            }`}
                          >
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => toggleTag(tag.id)}
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {tag.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : tagSearchQuery ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No tags found matching "{tagSearchQuery}"
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No tags available. Create your first tag above.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Add the specifications form after the variants section */}
        <ProductSpecificationsForm
          productId="new"
          categoryId={categoryId}
          onSpecificationsChange={handleSpecificationsChange}
          specifications={specifications}
        />
      </form>

      {/* Add the preview modal */}
      <ProductPreviewModal
        open={isPreviewOpen}
        onOpenChange={(open) => open ? openPreview() : closePreview()}
        product={previewProduct}
      />
    </MainLayout>
  );
}