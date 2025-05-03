import React, { createContext, useContext, useState, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Juice, CartItem } from "@shared/schema";

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

interface AddToCartParams {
  juiceId: number;
  sessionId: string;
  quantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    mutationFn: async (data: AddToCartParams) => {
      return apiRequest("POST", "/api/cart", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
      toast({
        title: "Added to cart",
        description: "Item added to cart successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add item",
        description: error instanceof Error ? error.message : "There was an error adding the item to cart",
        variant: "destructive",
      });
    },
  });

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update cart",
        description: error instanceof Error ? error.message : "There was an error updating your cart",
        variant: "destructive",
      });
    },
  });

  // Remove item from cart
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
      toast({
        title: "Item removed",
        description: "Item removed from cart",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove item",
        description: error instanceof Error ? error.message : "There was an error removing the item from cart",
        variant: "destructive",
      });
    },
  });

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/cart/clear/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear cart",
        description: error instanceof Error ? error.message : "There was an error clearing your cart",
        variant: "destructive",
      });
    },
  });

  // Handler functions that use the mutations
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
      updateQuantityMutation.mutate({ id: existingItem.id, quantity: existingItem.quantity + quantity });
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
    updateQuantityMutation.mutate({ id, quantity });
  };

  const removeItem = (id: number) => {
    removeItemMutation.mutate(id);
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
