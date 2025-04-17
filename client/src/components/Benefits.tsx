import { Leaf, Brush, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Benefits = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-semibold text-center mb-12">Why Choose Sip of Eden?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-primary text-3xl mb-4 flex justify-center">
                <Leaf className="h-10 w-10" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">100% Organic</h3>
              <p className="text-gray-600">All our ingredients are certified organic and sustainably sourced from local farms.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-primary text-3xl mb-4 flex justify-center">
                <Brush className="h-10 w-10" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Cold-Pressed Fresh</h3>
              <p className="text-gray-600">Our juices are cold-pressed daily to preserve nutrients and deliver maximum flavor.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-primary text-3xl mb-4 flex justify-center">
                <Truck className="h-10 w-10" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Free Delivery</h3>
              <p className="text-gray-600">Enjoy free delivery on all subscription plans and orders over $30.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
