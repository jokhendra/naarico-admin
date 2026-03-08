import { cn } from "@/lib/utils";
import { ProductDraftSection } from "@/lib/product-draft-utils";
import { CheckCircle } from "lucide-react";

interface ProductFormProgressProps {
  completedSections: ProductDraftSection[];
  className?: string;
}

export function ProductFormProgress({ 
  completedSections,
  className
}: ProductFormProgressProps) {
  // Define all sections in order
  const sections = [
    { id: 'basic' as ProductDraftSection, name: 'Basic Info' },
    { id: 'pricing' as ProductDraftSection, name: 'Pricing' },
    { id: 'category' as ProductDraftSection, name: 'Category' },
    { id: 'images' as ProductDraftSection, name: 'Images' },
    { id: 'variants' as ProductDraftSection, name: 'Variants' },
    { id: 'specifications' as ProductDraftSection, name: 'Specifications' },
    { id: 'inventory' as ProductDraftSection, name: 'Inventory' },
    { id: 'seo' as ProductDraftSection, name: 'SEO' }
  ];

  return (
    <div className={cn("flex items-center space-x-1 overflow-x-auto pb-2 w-full", className)}>
      {sections.map((section, index) => {
        const isCompleted = completedSections.includes(section.id);
        
        return (
          <div key={section.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs border",
                  isCompleted 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted text-muted-foreground border-muted-foreground/20"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 whitespace-nowrap",
                isCompleted 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}>
                {section.name}
              </span>
            </div>
            
            {index < sections.length - 1 && (
              <div className={cn(
                "h-[1px] w-4 mx-1",
                isCompleted && completedSections.includes(sections[index + 1].id)
                  ? "bg-primary"
                  : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
} 