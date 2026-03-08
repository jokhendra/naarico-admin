import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Save, Trash } from "lucide-react";
import { getRelativeTime, ProductDraft } from "@/lib/product-draft-utils";

interface ProductDraftAlertProps {
  draft: ProductDraft;
  onResume: () => void;
  onDiscard: () => void;
}

export function ProductDraftAlert({ draft, onResume, onDiscard }: ProductDraftAlertProps) {
  const relativeTime = getRelativeTime(draft.lastUpdated);
  
  return (
    <Alert className="bg-muted/50 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <AlertTitle className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Saved Draft Available
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="text-sm">
              <div className="flex items-center text-muted-foreground mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Last edited {relativeTime}</span>
              </div>
              <p>You have a product draft that contains your previous work.</p>
            </div>
          </AlertDescription>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            size="sm"
            variant="outline" 
            className="text-xs whitespace-nowrap"
            onClick={onDiscard}
          >
            <Trash className="h-3 w-3 mr-1" />
            Discard
          </Button>
          <Button 
            size="sm"
            variant="default" 
            className="text-xs whitespace-nowrap"
            onClick={onResume}
          >
            <Save className="h-3 w-3 mr-1" />
            Resume Draft
          </Button>
        </div>
      </div>
    </Alert>
  );
} 