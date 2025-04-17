import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const subscriptionSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  plan: z.enum(["weekly", "biweekly", "monthly"]),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

const Subscribe = () => {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      email: "",
      plan: "weekly",
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

  return (
    <div className="container mx-auto px-4 py-12">
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
            <Card className="bg-white card-shadow mb-6">
              <CardContent className="pt-6">
                <h2 className="font-heading text-xl font-semibold mb-4">Choose Your Plan</h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      name="plan"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Subscription Plan</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="weekly" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  <span className="font-medium">Weekly</span> - ₦12,500/week (Save 10%)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="biweekly" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  <span className="font-medium">Bi-weekly</span> - ₦22,000/2 weeks (Save 8%)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="monthly" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  <span className="font-medium">Monthly</span> - ₦42,000/month (Save 5%)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-accent hover:bg-accent/90 text-white"
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
