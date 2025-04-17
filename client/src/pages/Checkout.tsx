import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Create a checkout form schema
const checkoutFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name is required' }),
  lastName: z.string().min(2, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  address: z.string().min(5, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  zipCode: z.string().min(5, { message: 'Zip code is required' })
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// Dummy stripePromise for demo purposes
const stripePromise = loadStripe('pk_test_sample');

const CheckoutPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

const CheckoutForm = () => {
  const [, setLocation] = useLocation();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [paymentStep, setPaymentStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Calculate total
  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.juice.price * item.quantity);
  }, 0);
  
  const shippingCost = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormValues & { items: any[], total: number }) => {
      const response = await apiRequest('POST', '/api/orders', data);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.id);
      clearCart();
      setPaymentStep('confirmation');
    },
    onError: () => {
      toast({
        title: 'Order Failed',
        description: 'There was an issue processing your order. Please try again.',
        variant: 'destructive'
      });
      setProcessing(false);
    }
  });

  const onSubmitShipping = (data: CheckoutFormValues) => {
    setPaymentStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }
    
    setProcessing(true);
    setPaymentError(null);
    
    // This would normally use Stripe to create a payment
    // For this demo, we'll simulate a successful payment
    
    setTimeout(() => {
      // Get shipping data from form
      const shippingData = form.getValues();
      
      // Create order
      createOrderMutation.mutate({
        ...shippingData,
        items: cartItems.map(item => ({
          juiceId: item.juiceId,
          quantity: item.quantity,
          price: item.juice.price
        })),
        total
      });
    }, 1500);
  };

  const returnToCart = () => {
    setLocation('/');
  };

  if (cartItems.length === 0 && paymentStep !== 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="mb-6">You have no items in your cart to checkout.</p>
          <Button onClick={returnToCart}>Return to Shop</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-semibold text-center mb-8">Checkout</h1>
      
      {/* Checkout Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${paymentStep === 'shipping' ? 'bg-primary text-white' : 'bg-gray-200'}`}>1</div>
          <div className="text-sm ml-2">Shipping</div>
        </div>
        <div className="w-10 h-1 mx-2 bg-gray-200"></div>
        <div className="flex items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${paymentStep === 'payment' ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</div>
          <div className="text-sm ml-2">Payment</div>
        </div>
        <div className="w-10 h-1 mx-2 bg-gray-200"></div>
        <div className="flex items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center ${paymentStep === 'confirmation' ? 'bg-primary text-white' : 'bg-gray-200'}`}>3</div>
          <div className="text-sm ml-2">Confirmation</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {paymentStep === 'shipping' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitShipping)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Zip code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={returnToCart}>
                      Return to Cart
                    </Button>
                    <Button type="submit">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          
          {paymentStep === 'payment' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Card Information</label>
                    <div className="border rounded-md p-3">
                      {/* For demo purposes - in a real app, this would be the Stripe CardElement */}
                      <div className="h-10 flex items-center text-gray-600">
                        <CreditCard className="h-5 w-5 mr-2" />
                        <span>Demo Card: 4242 4242 4242 4242 | 12/28 | 123</span>
                      </div>
                    </div>
                  </div>
                  
                  {paymentError && (
                    <div className="text-destructive text-sm">{paymentError}</div>
                  )}
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setPaymentStep('shipping')}
                    disabled={processing}
                  >
                    Back to Shipping
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Complete Purchase</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {paymentStep === 'confirmation' && (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Thank You For Your Order!</h2>
              <p className="mb-4">Your order #{orderId || '00000'} has been placed successfully.</p>
              <p className="mb-6">We've sent a confirmation email with your order details.</p>
              <Link href="/">
                <Button>Return to Shop</Button>
              </Link>
            </div>
          )}
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            
            {paymentStep !== 'confirmation' && (
              <div className="space-y-4 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.juice.name}</span>
                      <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">{formatCurrency(item.juice.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            {paymentStep === 'confirmation' && (
              <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                <p className="text-sm">A receipt has been sent to your email.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;