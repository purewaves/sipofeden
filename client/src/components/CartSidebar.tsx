import { Plus, Minus, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CartSidebar = () => {
  const { isCartOpen, cartItems, toggleCart, updateItemQuantity, removeItem, clearCart } = useCart();
  const { toast } = useToast();

  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.juice.price * item.quantity);
  }, 0);

  const handleCheckout = () => {
    window.location.href = "/checkout";
    toggleCart();
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg transform transition-transform z-50 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-heading font-semibold text-xl">
            Your Cart ({cartItems.reduce((count, item) => count + item.quantity, 0)})
          </h3>
          <Button variant="ghost" size="sm" onClick={toggleCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag className="h-12 w-12 mb-2" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className="flex border-b pb-4 mb-4">
                  <img 
                    src={item.juice.imageUrl} 
                    alt={item.juice.name} 
                    className="w-20 h-20 object-cover rounded" 
                  />
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{item.juice.name}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-destructive h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-gray-600 text-sm">500ml</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border rounded">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="h-8 px-2 text-gray-600 hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-2">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="h-8 px-2 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-medium">{formatCurrency(item.juice.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white mb-2"
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
          >
            Checkout
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={toggleCart}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
