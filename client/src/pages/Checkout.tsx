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
import { Loader2, CheckCircle, Truck, CreditCard, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Create a checkout form schema
const checkoutFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name is required' }),
  lastName: z.string().min(2, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  address: z.string().min(5, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State is required' }),
  zipCode: z.string().min(5, { message: 'Zip code is required' }),
  notes: z.string().optional()
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

const CheckoutPage = () => {
  const [, setLocation] = useLocation();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
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
      zipCode: '',
      notes: ''
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormValues & { items: any[], total: number }) => {
      // Format the data according to what the server expects
      const order = {
        customerName: `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        total: data.total,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      
      const response = await apiRequest('POST', '/api/orders', {
        order,
        items: data.items
      });
      return response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.id);
      clearCart();
      setPaymentStep('confirmation');
      setProcessing(false);
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
    setProcessing(true);
    
    // Get shipping data from form
    const shippingData = form.getValues();
    
    // Create order with bank transfer payment method
    createOrderMutation.mutate({
      ...shippingData,
      items: cartItems.map(item => ({
        juiceId: item.juiceId,
        quantity: item.quantity,
        price: item.juice.price
      })),
      total
    });
  };

  const returnToCart = () => {
    setLocation('/');
  };

  const copyAccountDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Account details copied successfully!",
    });
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

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Special delivery instructions or other notes" 
                            className="h-24 resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                <div className="p-4 border rounded-md bg-gray-50">
                  <div className="flex items-center mb-4">
                    <Truck className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Delivery Information</h3>
                  </div>
                  <div className="text-sm space-y-1 text-gray-600 pl-7">
                    <p><span className="font-medium">Name:</span> {form.getValues('firstName')} {form.getValues('lastName')}</p>
                    <p><span className="font-medium">Address:</span> {form.getValues('address')}, {form.getValues('city')}, {form.getValues('state')} {form.getValues('zipCode')}</p>
                    <p><span className="font-medium">Contact:</span> {form.getValues('phone')}</p>
                    <p><span className="font-medium">Email:</span> {form.getValues('email')}</p>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-green-50">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Bank Transfer Details</h3>
                  </div>
                  <div className="text-sm space-y-3 pl-7">
                    <div className="flex justify-between items-center">
                      <p><span className="font-medium">Bank:</span> First National Bank</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => copyAccountDetails("First National Bank")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p><span className="font-medium">Account Name:</span> Sip of Eden LLC</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => copyAccountDetails("Sip of Eden LLC")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p><span className="font-medium">Account Number:</span> 1234567890</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => copyAccountDetails("1234567890")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p><span className="font-medium">Routing Number:</span> 987654321</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => copyAccountDetails("987654321")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="mt-3 text-xs bg-white p-3 rounded border border-green-200">
                      <p>Please include your name and order number in the payment reference. Your order will be processed once payment is received.</p>
                    </div>
                  </div>
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
                      <>Complete Order</>
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
              <p className="mb-2">Your order #{orderId || '00000'} has been placed successfully.</p>
              <p className="mb-4">We've sent a confirmation email with your order details and payment instructions.</p>
              <div className="bg-gray-50 p-4 rounded-md text-left mb-6">
                <h3 className="font-medium mb-2">Next Steps:</h3>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Complete your bank transfer using the provided details</li>
                  <li>Include your order number ({orderId || '00000'}) in the payment reference</li>
                  <li>Once payment is received, we'll prepare your order for shipping</li>
                  <li>You'll receive an email notification when your order ships</li>
                </ol>
              </div>
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
                <p className="text-sm">Thank you for your order! Please complete your bank transfer to finalize your purchase.</p>
              </div>
            )}
            
            {paymentStep === 'payment' && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                <p className="text-sm">Your order will be processed once payment is received.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;