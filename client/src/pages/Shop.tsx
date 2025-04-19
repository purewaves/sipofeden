import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import JuiceCard from "@/components/JuiceCard";
import { Separator } from "@/components/ui/separator";
import { Juice } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const Shop = () => {
  const [category, setCategory] = useState<string>("all");
  const [filteredJuices, setFilteredJuices] = useState<Juice[]>([]);
  const { toast } = useToast();

  const { data: juices, isLoading, error } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });

  useEffect(() => {
    if (juices) {
      if (category === "all") {
        setFilteredJuices(juices);
      } else {
        setFilteredJuices(juices.filter(juice => juice.category.toLowerCase() === category.toLowerCase()));
      }
    }
  }, [juices, category]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load juices. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const categories = juices ? Array.from(new Set(juices.map(juice => juice.category))) : [];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-heading mb-2">Shop Our Juices</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse our selection of freshly pressed, organic juices made from the finest ingredients.
        </p>
      </div>

      <div className="overflow-x-auto pb-2 mb-8">
        <div className="flex flex-nowrap justify-start md:justify-center gap-2 md:gap-4 min-w-full">
          <button
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              category === "all" ? "bg-primary text-white" : "bg-white hover:bg-gray-100 border border-gray-200"
            }`}
            onClick={() => setCategory("all")}
          >
            All Juices
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                category === cat.toLowerCase() ? "bg-primary text-white" : "bg-white hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setCategory(cat.toLowerCase())}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden card-shadow">
              <Skeleton className="w-full h-64" />
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredJuices.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No juices found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJuices.map((juice) => (
                <JuiceCard key={juice.id} juice={juice} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shop;
