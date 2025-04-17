import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Juice } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Droplets, Zap, Heart } from "lucide-react";

const SubscriptionForm = () => {
  const [plan, setPlan] = useState("weekly");
  const [category, setCategory] = useState("all");
  const [selectedJuices, setSelectedJuices] = useState<number[]>([]);

  const { data: juices = [], isLoading } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });

  // Filter juices by category
  const filteredJuices = category === 'all'
    ? juices
    : juices.filter(juice => juice.category.toLowerCase() === category.toLowerCase());

  // Calculate subscription price based on selected plan
  const getSubscriptionPrice = () => {
    const basePrice = 3500;
    switch (plan) {
      case "weekly":
        return basePrice * 0.9; // 10% discount
      case "biweekly":
        return basePrice * 0.92; // 8% discount
      case "monthly":
        return basePrice * 0.95; // 5% discount
      default:
        return basePrice;
    }
  };

  // Toggle juice selection
  const toggleJuiceSelection = (juiceId: number) => {
    if (selectedJuices.includes(juiceId)) {
      setSelectedJuices(selectedJuices.filter(id => id !== juiceId));
    } else {
      if (selectedJuices.length < 5) { // Limit to 5 selections
        setSelectedJuices([...selectedJuices, juiceId]);
      }
    }
  };

  return (
    <section className="py-12 bg-white bg-opacity-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl font-semibold mb-2">Juice Subscription Plans</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select your favorite juices and get them delivered on a schedule that works for you.
            Save up to 15% with our subscription plans.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg card-shadow">
            <h3 className="font-heading text-xl font-semibold mb-4">Choose Your Juices</h3>
            
            <Tabs defaultValue="all" className="w-full" onValueChange={setCategory}>
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="immunity" className="flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Immunity
                </TabsTrigger>
                <TabsTrigger value="detox" className="flex items-center">
                  <Droplets className="w-3 h-3 mr-1" />
                  Detox
                </TabsTrigger>
                <TabsTrigger value="energy" className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Energy
                </TabsTrigger>
                <TabsTrigger value="wellness" className="flex items-center">
                  <Heart className="w-3 h-3 mr-1" />
                  Wellness
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Loading juices...</p>
                  </div>
                ) : filteredJuices.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No juices found in this category.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                    {filteredJuices.map(juice => (
                      <div 
                        key={juice.id}
                        className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedJuices.includes(juice.id) 
                            ? 'border-primary bg-primary/10' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleJuiceSelection(juice.id)}
                      >
                        <div className="flex-shrink-0 w-16 h-16 mr-3">
                          <img 
                            src={juice.imageUrl} 
                            alt={juice.name} 
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium">{juice.name}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {juice.category}
                            </span>
                            <span className="text-sm font-semibold">{formatCurrency(juice.price)}</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <input 
                            type="checkbox" 
                            checked={selectedJuices.includes(juice.id)}
                            onChange={() => {}} // Needed to avoid React warning
                            className="h-5 w-5 text-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-600">Selected: {selectedJuices.length} / 5</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Select up to 5 juices for your subscription box
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedJuices([])}
                    disabled={selectedJuices.length === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>
          
          <div className="bg-white p-6 rounded-lg card-shadow">
            <h3 className="font-heading text-xl font-semibold mb-4">Subscription Details</h3>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-2 block">Select Delivery Frequency</Label>
                <RadioGroup defaultValue="weekly" onValueChange={setPlan} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="flex justify-between w-full">
                      <span className="font-medium">Weekly</span>
                      <span>Save 10%</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="biweekly" id="biweekly" />
                    <Label htmlFor="biweekly" className="flex justify-between w-full">
                      <span className="font-medium">Bi-weekly</span>
                      <span>Save 8%</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex justify-between w-full">
                      <span className="font-medium">Monthly</span>
                      <span>Save 5%</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="text-base mb-2 block">Number of Bottles</Label>
                <Select defaultValue="6">
                  <SelectTrigger>
                    <SelectValue placeholder="Select quantity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 bottles</SelectItem>
                    <SelectItem value="6">6 bottles</SelectItem>
                    <SelectItem value="9">9 bottles</SelectItem>
                    <SelectItem value="12">12 bottles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span>Subscription Price:</span>
                  <span className="font-semibold">{formatCurrency(getSubscriptionPrice())}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm text-gray-600">
                  <span>Per Delivery</span>
                  <span>Billed on delivery</span>
                </div>
              </div>
              
              <Link href="/subscribe">
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  disabled={selectedJuices.length === 0}
                >
                  Start Your Subscription
                </Button>
              </Link>
              
              <p className="text-sm text-gray-600 text-center">
                No commitment required. Cancel or pause anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionForm;
