import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="font-brand text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Nature's Freshness <span className="text-primary">In Every Sip</span>
            </h1>
            <p className="text-lg mb-6">
              Handcrafted juices made from locally sourced, organic ingredients. 
              Experience the taste of wellness delivered to your doorstep.
            </p>
            <div className="flex space-x-4">
              <Link href="/shop">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Shop Now
                </Button>
              </Link>
              <Link href="/subscribe">
                <Button className="bg-accent hover:bg-accent/90 text-white">
                  Subscribe
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Assorted fresh juices in bottles"
              className="rounded-lg shadow-lg w-full h-auto" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
