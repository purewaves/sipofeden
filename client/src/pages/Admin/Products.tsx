import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductForm from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Juice } from "@shared/schema";
import { formatCurrency, getStockStatus, getStockStatusClass } from "@/lib/utils";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminProducts = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [openProductForm, setOpenProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Juice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Juice | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const { data: juices, isLoading } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });

  // Handle product deletion
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/juices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/juices'] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Reset select all when products change
    setSelectAll(false);
    setSelectedProductIds([]);
  }, [juices]);

  if (!isAuthenticated) {
    return null;
  }

  // Filter juices based on search, category, and status
  const filteredJuices = juices?.filter(juice => {
    const matchesSearch = juice.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         juice.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || juice.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const stockStatus = getStockStatus(juice.stock).toLowerCase().replace(/\s+/g, '');
    const matchesStatus = selectedStatus === "all" || stockStatus === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Extract unique categories from juices
  const categories = juices ? Array.from(new Set(juices.map(juice => juice.category))) : [];

  // Handle checkbox selection
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProductIds([]);
    } else {
      if (filteredJuices) {
        setSelectedProductIds(filteredJuices.map(juice => juice.id));
      }
    }
    setSelectAll(!selectAll);
  };

  const handleSelectProduct = (id: number) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(productId => productId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Form dialog handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setOpenProductForm(true);
  };

  const handleEditProduct = (juice: Juice) => {
    setEditingProduct(juice);
    setOpenProductForm(true);
  };

  const handleDeleteClick = (juice: Juice) => {
    setProductToDelete(juice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-heading text-2xl font-semibold">Products</h1>
          <Button 
            onClick={handleAddProduct}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>
        
        <Card>
          <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select 
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category.toLowerCase()}>{category}</option>
                ))}
              </select>
              <select 
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="instock">In Stock</option>
                <option value="lowstock">Low Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={handleSelectAll} 
                        className="mr-2"
                      />
                      <span>Product</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Checkbox disabled className="mr-2" />
                          <Skeleton className="w-10 h-10 rounded mr-3" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredJuices && filteredJuices.length > 0 ? (
                  // Products list
                  filteredJuices.map(juice => (
                    <tr key={juice.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Checkbox 
                            checked={selectedProductIds.includes(juice.id)} 
                            onCheckedChange={() => handleSelectProduct(juice.id)}
                            className="mr-2"
                          />
                          <img 
                            src={juice.imageUrl} 
                            alt={juice.name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                          <span className="font-medium">{juice.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{juice.sku}</td>
                      <td className="px-4 py-3">{juice.category}</td>
                      <td className="px-4 py-3">{formatCurrency(juice.price)}</td>
                      <td className="px-4 py-3">{juice.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusClass(juice.stock)}`}>
                          {getStockStatus(juice.stock)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditProduct(juice)}
                            className="text-blue-500 hover:text-blue-700 h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteClick(juice)}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // No products found
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                      No products found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredJuices && filteredJuices.length > 0 && (
            <div className="p-4 border-t flex justify-between items-center">
              <div>
                <span className="text-gray-600">
                  Showing {filteredJuices.length} of {juices?.length || 0} products
                </span>
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" className="px-3 py-1 h-8">
                  <span className="sr-only">Previous</span>
                  &laquo;
                </Button>
                <Button variant="outline" size="sm" className="px-3 py-1 h-8 bg-primary text-white">1</Button>
                <Button variant="outline" size="sm" className="px-3 py-1 h-8">
                  <span className="sr-only">Next</span>
                  &raquo;
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
      
      {/* Product Form Dialog */}
      <Dialog open={openProductForm} onOpenChange={setOpenProductForm}>
        <DialogContent className="max-w-2xl">
          <ProductForm 
            initialData={editingProduct} 
            onClose={() => setOpenProductForm(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
