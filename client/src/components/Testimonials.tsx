import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Testimonials = () => {
  return (
    <section className="py-12 bg-white bg-opacity-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-semibold text-center mb-8">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "I've been subscribed for 3 months, and I feel more energetic than ever. The Green Detox is my absolute favorite!"
              </p>
              <div className="font-medium">Sarah K.</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The subscription service is so convenient, and the juices arrive fresh every time. Great customer service too!"
              </p>
              <div className="font-medium">Michael T.</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  <Star className="h-4 w-4 fill-current" fill="none" />
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "I love that I can customize my juice box. Perfect for my fitness journey and the taste is amazing!"
              </p>
              <div className="font-medium">Jessica M.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
