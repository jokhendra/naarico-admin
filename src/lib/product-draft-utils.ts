import { toast } from "sonner";

// Constant for the localStorage key where drafts are stored
const PRODUCT_DRAFT_KEY = 'product_draft';

// Define the structure of a product draft section
export type ProductDraftSection = 
  | 'basic'
  | 'pricing'
  | 'category' 
  | 'images' 
  | 'variants'
  | 'inventory'
  | 'seo'
  | 'specifications';

// Interface for the stored product draft
export interface ProductDraft {
  data: Record<string, any>;
  lastUpdated: number;
  completedSections: ProductDraftSection[];
  draftId: string;
}

// Interface for product form sections status
export interface ProductFormProgress {
  basic: boolean;
  pricing: boolean;
  category: boolean;
  images: boolean;
  variants: boolean;
  inventory: boolean;
  seo: boolean;
}

/**
 * Save the current product form state to localStorage
 * @param data - The product form data to save
 * @param completedSections - Array of completed section identifiers
 * @param draftId - Optional ID for the draft (generated if not provided)
 * @param silent - Whether to show a toast notification (default: false)
 */
export const saveProductDraft = (
  data: Record<string, any>,
  completedSections: ProductDraftSection[] = [],
  draftId?: string,
  silent: boolean = false
): string => {
  try {
    // Generate a draft ID if one doesn't exist
    const draft: ProductDraft = {
      data,
      lastUpdated: Date.now(),
      completedSections,
      draftId: draftId || `draft_${Date.now()}`
    };
    
    // Save to localStorage
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
    
    // Show toast notification if not silent
    if (!silent) {
      toast.success("Draft saved", {
        description: "Your product draft has been saved automatically"
      });
    }
    
    return draft.draftId;
  } catch (error) {
    console.error("Error saving product draft:", error);
    if (!silent) {
      toast.error("Failed to save draft", {
        description: "There was a problem saving your progress"
      });
    }
    return draftId || '';
  }
};

/**
 * Load the saved product draft from localStorage
 * @returns The product draft or null if none exists
 */
export const loadProductDraft = (): ProductDraft | null => {
  try {
    const savedDraft = localStorage.getItem(PRODUCT_DRAFT_KEY);
    if (!savedDraft) return null;
    
    return JSON.parse(savedDraft) as ProductDraft;
  } catch (error) {
    console.error("Error loading product draft:", error);
    toast.error("Failed to load saved draft", {
      description: "There was a problem loading your previous work"
    });
    return null;
  }
};

/**
 * Clear the saved product draft from localStorage
 * @param silent - Whether to show a toast notification (default: true)
 */
export const clearProductDraft = (silent: boolean = true): void => {
  try {
    localStorage.removeItem(PRODUCT_DRAFT_KEY);
    if (!silent) {
      toast.success("Draft cleared", {
        description: "Your product draft has been cleared"
      });
    }
  } catch (error) {
    console.error("Error clearing product draft:", error);
    if (!silent) {
      toast.error("Failed to clear draft", {
        description: "There was a problem clearing your saved draft"
      });
    }
  }
};

/**
 * Calculate the overall completion percentage of the form
 * @param completedSections - Array of completed section identifiers
 * @returns A number between 0-100 representing completion percentage
 */
export const calculateFormCompletion = (
  completedSections: ProductDraftSection[]
): number => {
  const totalSections = 8; // Update this if more sections are added (now including specifications)
  const uniqueCompletedSections = [...new Set(completedSections)];
  return Math.round((uniqueCompletedSections.length / totalSections) * 100);
};

/**
 * Determine which sections are completed based on form data
 * @param data - The product form data
 * @returns Array of section identifiers that are considered complete
 */
export const determineCompletedSections = (data: Record<string, any>): ProductDraftSection[] => {
  const completedSections: ProductDraftSection[] = [];
  
  // Basic section: title and sku are required
  if (data.title?.trim() && data.sku?.trim()) {
    completedSections.push('basic');
  }
  
  // Pricing section: price is required
  if (data.price && !isNaN(Number(data.price)) && Number(data.price) > 0) {
    completedSections.push('pricing');
  }
  
  // Category section: at least one of these should be selected
  if (data.brandId || data.categoryId) {
    completedSections.push('category');
  }
  
  // Images section: at least one image
  if (Array.isArray(data.productImages) && data.productImages.length > 0) {
    // Additional validation to ensure images have valid URLs
    const validImages = data.productImages.filter(img => img && img.imageUrl && img.imageUrl.trim());
    if (validImages.length > 0) {
      completedSections.push('images');
    }
  }
  
  // Variants section: either no variants or well-defined variants
  if (!Array.isArray(data.variants) || data.variants.length === 0 || 
      (data.variants.length > 0 && data.variants.every(v => v.variantName && v.sku))) {
    completedSections.push('variants');
  }
  
  // Inventory section: stockQuantity is set
  if (data.stockQuantity !== undefined && data.stockQuantity !== null) {
    completedSections.push('inventory');
  }
  
  // SEO section: at least one SEO field
  if (data.metaTitle || data.metaDescription || data.metaKeywords) {
    completedSections.push('seo');
  }
  
  // Specifications section: at least one specification with value
  if (Array.isArray(data.specifications) && data.specifications.length > 0 && 
      data.specifications.some(spec => spec.specValue?.trim())) {
    completedSections.push('specifications');
  }
  
  return completedSections;
};

/**
 * Format the relative time since last save in a human-readable format
 * @param timestamp - The timestamp when the draft was last saved
 * @returns A string like "2 minutes ago" or "just now"
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}; 