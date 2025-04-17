import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Juice } from "@shared/schema";
import { formatCurrency, getStockStatus, getStockStatusClass } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { ChevronLeft, Plus, Minus } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: juice, isLoading, error } = useQuery<Juice>({
    queryKey: [`/api/juices/${id}`],
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load product details. Please try again.",
      variant: "destructive",
    });
  }

  const handleAddToCart = () => {
    if (juice) {
      addItem(juice, quantity);
      toast({
        title: "Added to cart",
        description: `${quantity} x ${juice.name} added to your cart`,
      });
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <div className="container mx-auto px-4 py-10">
      <Link href="/shop">
        <a className="inline-flex items-center text-gray-600 hover:text-primary mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Shop
        </a>
      </Link>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="w-full h-[400px] rounded-lg" />
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : juice ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <img 
              src={juice.imageUrl} 
              alt={juice.name} 
              className="w-full h-auto rounded-lg card-shadow"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">{juice.name}</h1>
            <p className="text-2xl text-accent font-semibold mb-4">{formatCurrency(juice.price)}</p>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">{juice.description}</p>
              <div className="flex items-center">
                <span className={`text-sm px-2.5 py-0.5 rounded-full ${getStockStatusClass(juice.stock)}`}>
                  {getStockStatus(juice.stock)}
                </span>
                <span className="ml-3 text-sm text-gray-500">SKU: {juice.sku}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="font-medium mb-2">Quantity</p>
              <div className="flex items-center w-32 border rounded-md overflow-hidden">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={decrementQuantity}
                  className="px-3 py-1 border-r rounded-none hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center px-3">{quantity}</div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={incrementQuantity}
                  className="px-3 py-1 border-l rounded-none hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleAddToCart} 
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={juice.stock === 0}
              size="lg"
            >
              {juice.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">Product not found.</p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
