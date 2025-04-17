import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Juice, CartItem, InsertCartItem } from "@shared/schema";

interface CartContextType {
  cartItems: (CartItem & { juice: Juice })[];
  isCartOpen: boolean;
  isLoading: boolean;
  toggleCart: () => void;
  addItem: (juice: Juice, quantity: number) => void;
  updateItemQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { juice: Juice })[]>({
    queryKey: [`/api/cart/${sessionId}`],
  });

  // Add item to cart
  const addToCartMutation = useMutation({
    mutationFn: async (data: InsertCartItem) => {
      const response = await apiRequest("POST", "/api/cart", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  // Update cart item quantity
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    },
  });

  // Remove item from cart
  const removeCartItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/cart/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    },
  });

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/cart/clear/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const addItem = (juice: Juice, quantity: number) => {
    // Check if juice is in stock
    if (juice.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This juice is currently unavailable",
        variant: "destructive",
      });
      return;
    }
    
    // Find if item is already in cart
    const existingItem = cartItems.find(item => item.juiceId === juice.id);
    
    if (existingItem) {
      // Update quantity if item exists
      updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      // Add new item if it doesn't exist
      addToCartMutation.mutate({
        juiceId: juice.id,
        sessionId,
        quantity,
      });
    }
    
    // Open cart after adding item
    setIsCartOpen(true);
  };

  const updateItemQuantity = (id: number, quantity: number) => {
    updateCartItemMutation.mutate({ id, quantity });
  };

  const removeItem = (id: number) => {
    removeCartItemMutation.mutate(id);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        isLoading,
        toggleCart,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
