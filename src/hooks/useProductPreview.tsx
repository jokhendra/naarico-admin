import { useState } from 'react';

export interface PreviewProduct {
  title: string;
  shortDescription: string;
  description: string;
  price: string;
  discountPrice?: string;
  images: Array<{
    imageUrl: string;
    altText?: string;
  }>;
  brand?: {
    name: string;
  };
  category?: {
    name: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  currency: string;
}

interface UseProductPreviewOptions {
  initialOpen?: boolean;
  initialDevice?: 'desktop' | 'mobile';
  initialContext?: 'storefront' | 'search' | 'category';
}

export function useProductPreview(options: UseProductPreviewOptions = {}) {
  const {
    initialOpen = false,
    initialDevice = 'desktop',
    initialContext = 'storefront'
  } = options;

  // State for preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(initialOpen);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(initialDevice);
  const [previewContext, setPreviewContext] = useState<'storefront' | 'search' | 'category'>(initialContext);
  
  // Toggle preview modal
  const togglePreview = () => setIsPreviewOpen(prev => !prev);
  
  // Open preview
  const openPreview = () => setIsPreviewOpen(true);
  
  // Close preview
  const closePreview = () => setIsPreviewOpen(false);
  
  return {
    isPreviewOpen,
    previewDevice,
    previewContext,
    togglePreview,
    openPreview,
    closePreview,
    setPreviewDevice,
    setPreviewContext
  };
} 