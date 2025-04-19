import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Juice } from "@shared/schema";
import { Loader2, Upload, Image } from "lucide-react";

// Create a product schema based on the insertJuiceSchema
const productSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  imageUrl: z.string().min(1, { message: "Image is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  stock: z.coerce.number().int().nonnegative({ message: "Stock must be a non-negative integer" }),
  featured: z.boolean().default(false),
  sku: z.string().min(3, { message: "SKU must be at least 3 characters" }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData: Juice | null;
  onClose: () => void;
}

const ProductForm = ({ initialData, onClose }: ProductFormProps) => {
  const isEditing = !!initialData;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(initialData?.category || "");
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      imageUrl: initialData?.imageUrl || "",
      category: initialData?.category || "",
      stock: initialData?.stock || 0,
      featured: initialData?.featured === true ? true : false, // Ensure it's always a boolean
      sku: initialData?.sku || "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest("POST", "/api/admin/juices", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/juices'] });
      toast({
        title: "Product created",
        description: "The product has been created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      console.log("Updating product with data:", data);
      const response = await apiRequest("PUT", `/api/admin/juices/${initialData?.id}`, {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        category: data.category,
        stock: data.stock,
        featured: data.featured,
        sku: data.sku
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Product updated successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/juices'] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Failed to update product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please check console for details.",
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      // Use apiRequest helper to ensure authentication headers are included
      const response = await apiRequest("POST", "/api/admin/upload", formData, true);
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the form with the new image URL
      form.setValue('imageUrl', data.imageUrl);
      setPreviewImage(data.imageUrl);
      setIsUploading(false);
      
      // If editing mode, automatically update the product with the new image
      if (isEditing && initialData) {
        const updatedData = {
          ...initialData,
          imageUrl: data.imageUrl,
          featured: initialData.featured || false  // Ensure featured is always boolean
        };
        updateProductMutation.mutate(updatedData);
      }
      
      toast({
        title: "Image uploaded",
        description: "The image has been uploaded successfully",
      });
    },
    onError: () => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    },
  });
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Show local preview of the image before upload completes
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload the image
    setIsUploading(true);
    uploadImageMutation.mutate(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = (data: ProductFormValues) => {
    if (isEditing) {
      updateProductMutation.mutate(data);
    } else {
      createProductMutation.mutate(data);
    }
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  const categories = [
    "Detox",
    "Antioxidant",
    "Immune Boost",
    "Energy",
    "Hydration",
    "Wellness",
  ];

  return (
    <div className="relative p-2 h-full">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Product" : "Add New Product"}
      </h2>

      <Form {...form}>
        <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pb-28 max-h-[calc(80vh-130px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juice name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="JC-XX-001" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique identifier for the product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the juice ingredients and benefits" 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₦</span>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        className="pl-7" 
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setCategory(value);
                    }}
                    defaultValue={field.value}
                    value={category}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <div className="space-y-4">
                  <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 h-64 bg-gray-50 flex items-center justify-center">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Product Preview" 
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        <Image className="mx-auto h-12 w-12 mb-2 opacity-70" />
                        <p className="text-sm">No image uploaded</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <FormControl>
                      <Input 
                        placeholder="Or enter image URL" 
                        className="flex-1" 
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  
                  <FormDescription>
                    Upload an image or provide a URL for the product image
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Featured Product</FormLabel>
                  <FormDescription>
                    Featured products will appear on the home page
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t flex flex-col sm:flex-row-reverse gap-3 sm:gap-4 shadow-lg">
        <Button 
          type="submit"
          form="product-form"
          disabled={isPending} 
          className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto text-base py-5 h-auto font-medium"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Product" : "Create Product"
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="border-gray-300 text-gray-700 w-full sm:w-auto text-base py-5 h-auto font-medium"
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
