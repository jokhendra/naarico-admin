# Product Preview Feature

## Overview

The Product Preview feature allows users to see how a product will look before publishing it. This feature helps reduce errors and improves the overall user experience by providing immediate visual feedback.

## Features

- **Live Preview**: See how the product will appear on the storefront in real-time as you fill out the form
- **Multiple Contexts**: Preview products in different contexts:
  - Product page (storefront view)
  - Search results
  - Category page
- **Device Toggle**: Switch between desktop and mobile views to ensure your product looks good on all devices
- **Open in New Tab**: View the product in a dedicated browser window for a full-screen experience

## Implementation Details

### Components

1. **ProductPreviewModal.tsx** - A modal component that displays the product preview
   - Supports different views (storefront, search, category)
   - Includes mobile/desktop toggle
   - Provides "Open in new tab" functionality

2. **useProductPreview.ts** - A custom hook for managing preview state
   - Controls visibility of the preview modal
   - Manages the active device and context
   - Provides toggle functions for easy interaction

### Architecture

The product preview feature follows a scalable and maintainable architecture:

- **Separation of Concerns**: The preview functionality is isolated from the form logic
- **Reusable Components**: The preview system can be used across different pages
- **Non-intrusive Integration**: The feature works alongside existing form functionality without breaking it
- **Responsive Design**: The preview adjusts to different screen sizes and device types

## Usage

To add the product preview button to a form:

```tsx
import { useProductPreview } from '@/hooks/useProductPreview';
import { ProductPreviewModal } from '@/components/ProductPreviewModal';

// Inside your component:
const { 
  isPreviewOpen,
  togglePreview,
  // Other state and functions...
} = useProductPreview();

// Build preview product object from form data
const previewProduct = {
  title: formData.title,
  // Other properties...
};

// In your JSX:
<Button onClick={togglePreview}>
  <Eye className="mr-2 h-4 w-4" />
  Preview
</Button>

<ProductPreviewModal 
  open={isPreviewOpen}
  onOpenChange={setIsPreviewOpen}
  product={previewProduct}
/>
```

## Future Enhancements

- Save preview preferences to user settings
- Add additional context views (e.g., related products, featured section)
- Implement animation controls for previewing product interactions
- Add SEO preview to show how the product will appear in search engines 