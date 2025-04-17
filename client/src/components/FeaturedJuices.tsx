import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import JuiceCard from "@/components/JuiceCard";
import { Juice } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedJuices = () => {
  const { data: featuredJuices, isLoading } = useQuery<Juice[]>({
    queryKey: ['/api/juices/featured'],
  });

  return (
    <section className="py-10 bg-white bg-opacity-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-semibold text-center mb-8">Featured Juices</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden card-shadow">
                <Skeleton className="w-full h-64" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-1/6" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-1/4 rounded-full" />
                    <Skeleton className="h-9 w-1/3 rounded-md" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            featuredJuices?.map((juice) => (
              <JuiceCard key={juice.id} juice={juice} />
            ))
          )}
        </div>
        
        <div className="text-center mt-8">
          <Link href="/shop">
            <Button className="bg-accent hover:bg-accent/90 text-white">
              View All Juices
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJuices;
