import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const SubscriptionForm = () => {
  return (
    <section className="py-12 bg-white bg-opacity-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <img 
              src="https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Juice subscription box" 
              className="rounded-lg shadow-lg w-full h-auto" 
            />
          </div>
          
          <div className="md:w-1/2 md:pl-10">
            <h2 className="font-heading text-3xl font-semibold mb-4">Subscribe & Save</h2>
            <p className="text-lg mb-6">
              Get your favorite juices delivered weekly or monthly and save up to 15%. 
              Customize your box with seasonal favorites or let us surprise you.
            </p>
            
            <div className="bg-white p-6 rounded-lg card-shadow mb-6">
              <h3 className="font-heading text-xl font-semibold mb-4">Choose Your Plan</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <input type="radio" id="weekly" name="plan" className="h-4 w-4 text-primary" defaultChecked />
                  <label htmlFor="weekly" className="ml-2 block">
                    <span className="font-medium">Weekly</span> - $35.99/week (Save 10%)
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="radio" id="biweekly" name="plan" className="h-4 w-4 text-primary" />
                  <label htmlFor="biweekly" className="ml-2 block">
                    <span className="font-medium">Bi-weekly</span> - $36.99/2 weeks (Save 8%)
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="radio" id="monthly" name="plan" className="h-4 w-4 text-primary" />
                  <label htmlFor="monthly" className="ml-2 block">
                    <span className="font-medium">Monthly</span> - $39.99/month (Save 5%)
                  </label>
                </div>
              </div>
              
              <Link href="/subscribe">
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                  Start Your Subscription
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-gray-600">
              No commitment required. Cancel or pause anytime. 
              First-time subscribers get a free wellness guide.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionForm;
