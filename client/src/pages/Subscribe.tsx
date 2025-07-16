import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// Types for subscription plans from the database
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  frequency: string;
  features: string[];
  createdAt: string;
}

interface Bundle {
  id: number;
  name: string;
  description: string;
  price: number;
  juiceIds: number[];
  imageUrl: string;
  createdAt: string;
}

// Create a schema for the form
const subscriptionSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  address: z.string().min(5, { message: "Please enter your delivery address" }),
  planId: z.coerce.number(),
  additionalNotes: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

const Subscribe = () => {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  // Fetch subscription plans
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch bundles
  const { data: bundles = [], isLoading: isLoadingBundles } = useQuery<Bundle[]>({
    queryKey: ['/api/bundles'],
    refetchOnWindowFocus: false,
  });

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      planId: 0,
      additionalNotes: "",
    },
  });

  const subscription = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const response = await apiRequest("POST", "/api/subscriptions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to Sip of Eden.",
      });
      setIsSuccess(true);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Subscription failed",
        description: "There was an error with your subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubscriptionFormValues) => {
    subscription.mutate(data);
  };
  
  // Handle selecting a plan
  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    form.setValue('planId', planId);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Subscribe to Fresh Juices</h1>
        <p className="text-lg text-gray-600">Get fresh, organic juices delivered to your door - no account needed, just book with your details!</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <img 
            src="https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
            alt="Juice subscription box" 
            className="rounded-lg shadow-lg w-full h-auto" 
          />
        </div>
        
        <div className="md:w-1/2 md:pl-10">
          <h1 className="font-heading text-3xl font-semibold mb-4">Subscribe & Save</h1>
          <p className="text-lg mb-6">
            Get your favorite juices delivered weekly or monthly and save up to 15%. 
            Customize your box with seasonal favorites or let us surprise you.
          </p>
          
          {isSuccess ? (
            <Card className="bg-white card-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-primary mb-4">Thank You!</h2>
                  <p className="mb-4">Your subscription has been successfully created.</p>
                  <p className="text-gray-600">
                    We've sent a confirmation email with details about your subscription.
                  </p>
                  <Button 
                    className="mt-6"
                    onClick={() => setIsSuccess(false)}
                  >
                    Start a new subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Choose Your Plan</h2>
                {isLoadingPlans ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subscriptionPlans.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">No subscription plans available at the moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {subscriptionPlans.map((plan) => (
                      <Card 
                        key={plan.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedPlanId === plan.id 
                            ? 'border-2 border-primary shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        <CardHeader>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>
                            {plan.frequency} · {formatCurrency(plan.price)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-4">{plan.description}</p>
                          <ul className="space-y-2">
                            {(Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]')).map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="h-4 w-4 text-primary mr-2 mt-1 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant={selectedPlanId === plan.id ? "default" : "outline"}
                            className="w-full"
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            {selectedPlanId === plan.id ? "Selected" : "Select Plan"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedPlanId && (
                <Card className="bg-white card-shadow mb-6">
                  <CardHeader>
                    <CardTitle>Complete Your Subscription</CardTitle>
                    <CardDescription>
                      Enter your details to complete your subscription
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your email" type="email" {...field} />
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
                                <FormLabel>Phone Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your phone number" {...field} />
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
                              <FormLabel>Delivery Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your full delivery address" 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="additionalNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any special instructions or preferences" 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="planId"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-accent hover:bg-accent/90 text-white mt-4"
                          disabled={subscription.isPending}
                        >
                          {subscription.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Start Your Subscription"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          
          <p className="text-sm text-gray-600">
            No commitment required. Cancel or pause anytime. 
            First-time subscribers get a free wellness guide.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
