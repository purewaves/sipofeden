import React from 'react';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Link } from 'wouter';
import { Trash } from 'lucide-react';

const Cart = () => {
  const { cartItems, totalPrice, removeFromCart, updateQuantity } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <p className="text-gray-500 mb-6">Your cart is empty</p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[3fr_1fr]">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 font-medium mb-4">
            <div>Product</div>
            <div>Price</div>
            <div>Quantity</div>
            <div></div>
          </div>
          
          <Separator className="mb-4 hidden md:block" />
          
          {cartItems.map((item) => (
            <div key={item.id} className="py-4 border-b last:border-0">
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                <div className="flex items-center gap-4">
                  <img 
                    src={item.juice.imageUrl} 
                    alt={item.juice.name} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="font-medium">{item.juice.name}</h3>
                    <p className="text-sm text-gray-500">{item.juice.description}</p>
                  </div>
                </div>
                
                <div className="md:text-left">
                  <span className="md:hidden font-medium mr-2">Price:</span>
                  ₦{(item.juice.price / 100).toFixed(2)}
                </div>
                
                <div className="flex items-center">
                  <span className="md:hidden font-medium mr-2">Quantity:</span>
                  <div className="flex items-center border rounded-md">
                    <button 
                      className="px-3 py-1 border-r" 
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-3 py-1">{item.quantity}</span>
                    <button 
                      className="px-3 py-1 border-l"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <button 
                  className="text-red-500 hover:text-red-700 justify-self-end"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦{(totalPrice / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₦0.00</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{(totalPrice / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <Link href="/checkout">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="w-full mt-2">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart; 