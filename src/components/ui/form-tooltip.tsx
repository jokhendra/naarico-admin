import React from "react";
import { Info } from "lucide-react";
import { Tooltip } from "./tooltip";
import { cn } from "@/lib/utils";

interface FormTooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  align?: "start" | "center" | "end";
}

export function FormTooltip({
  content,
  side = "top",
  align = "center",
  className
}: FormTooltipProps) {
  return (
    <Tooltip 
      content={content} 
      side={side} 
      align={align}
      className={cn("max-w-xs", className)}
    >
      <span className="ml-1.5 inline-flex cursor-help opacity-70 hover:opacity-100">
        <Info className="h-3.5 w-3.5" />
      </span>
    </Tooltip>
  );
} 