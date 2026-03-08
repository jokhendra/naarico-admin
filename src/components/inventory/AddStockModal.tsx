"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddStockDto, Product } from '@/types/inventory';
import { inventoryService } from '@/services/inventoryService';
import { toast } from '@/components/ui/use-toast';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStockModal({ isOpen, onClose, onSuccess }: AddStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AddStockDto>({
    productId: '',
    quantity: 0,
    threshold: 5,
    note: 'Initial inventory setup'
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        productId: '',
        quantity: 0,
        threshold: 5,
        note: 'Initial inventory setup'
      });
      setSelectedProduct(null);
      setSearchTerm('');
      setProducts([]);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Fetch products when the modal opens or search term changes
  useEffect(() => {
    if (isOpen && open) {
      fetchProducts();
    }
  }, [isOpen, open]);

  // Debounce search
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      if (isOpen && searchTerm) {
        fetchProducts();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products based on search term
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.searchProducts(searchTerm);
      
      if (response.success) {
        setProducts(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load products",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'threshold' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productId: product.id
    }));
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId.trim()) {
      toast({
        title: "Missing Product ID",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await inventoryService.addStock(formData);
      
      if (result.success) {
        // Show success state
        setShowSuccess(true);
        
        // Call onSuccess to refresh parent data
        onSuccess();
        
        // Auto-close after 1.5 seconds
        setTimeout(() => {
          // Reset form
          setFormData({
            productId: '',
            quantity: 0,
            threshold: 5,
            note: 'Initial inventory setup'
          });
          setSelectedProduct(null);
          
          // Close modal
          onClose();
          setShowSuccess(false);
        }, 1500);
      } else {
        toast({
          title: "Failed to add stock",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Error adding stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success feedback view
  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Stock Added Successfully</h2>
            <p className="mt-2 text-center text-gray-500">
              Inventory has been updated for {selectedProduct?.title}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Add inventory for a product that doesn't have any stock records yet
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="productSelect">Select Product <span className="text-destructive">*</span></Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button" 
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedProduct ? selectedProduct.title : "Select product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <CommandInput 
                      placeholder="Search products..." 
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <CommandList>
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <p>Loading products...</p>
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>{searchTerm ? "No products found" : "Type to search products..."}</CommandEmpty>
                        <CommandGroup>
                          {products.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              onSelect={() => handleProductSelect(product)}
                              className="flex justify-between items-center"
                            >
                              <div className="flex flex-col">
                                <span>{product.title}</span>
                                {product.sku && (
                                  <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {product.stockQuantity !== undefined && (
                                  <Badge variant={product.stockQuantity > 0 ? "outline" : "secondary"}>
                                    {product.stockQuantity} in stock
                                  </Badge>
                                )}
                                <Check
                                  className={cn(
                                    "h-4 w-4",
                                    selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedProduct && (
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>ID: {selectedProduct.id}</span>
                {selectedProduct.sku && <span>SKU: {selectedProduct.sku}</span>}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Initial Stock Quantity <span className="text-destructive">*</span></Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter initial stock quantity"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="threshold">Low Stock Threshold</Label>
            <Input
              id="threshold"
              name="threshold"
              type="number"
              min="1"
              value={formData.threshold}
              onChange={handleChange}
              placeholder="Enter low stock threshold"
            />
            <p className="text-xs text-muted-foreground">
              When stock falls below this value, it will be marked as "Low Stock"
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note about this inventory addition"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </> : 
                "Add Stock"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 