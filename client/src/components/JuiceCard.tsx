import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Juice } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface JuiceCardProps {
  juice: Juice;
}

const JuiceCard = ({ juice }: JuiceCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (juice.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This juice is currently unavailable",
        variant: "destructive",
      });
      return;
    }
    
    addItem(juice, 1);
    toast({
      title: "Added to cart",
      description: `${juice.name} has been added to your cart`,
    });
  };

  return (
    <Link href={`/product/${juice.id}`}>
      <div className="block cursor-pointer">
        <Card className="bg-white rounded-lg overflow-hidden card-shadow transition-transform hover:scale-[1.02]">
          <img 
            src={juice.imageUrl} 
            alt={juice.name} 
            className="w-full h-64 object-cover"
          />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading font-semibold text-xl">{juice.name}</h3>
              <span className="font-semibold text-accent">{formatCurrency(juice.price)}</span>
            </div>
            <p className="text-gray-600 mb-4">{juice.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {juice.category}
              </span>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white py-1.5 px-4"
                onClick={handleAddToCart}
                disabled={juice.stock <= 0}
              >
                {juice.stock <= 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  );
};

export default JuiceCard;
