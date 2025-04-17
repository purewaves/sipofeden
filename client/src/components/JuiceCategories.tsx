import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Juice } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JuiceCard from './JuiceCard';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Droplets, Zap, Heart, Leaf } from 'lucide-react';

// Define categories with their icons and colors
const categories = [
  { 
    id: 'all', 
    name: 'All Juices', 
    icon: Leaf, 
    color: 'bg-primary/10 text-primary',
    description: 'Explore our full range of cold-pressed juices'
  },
  { 
    id: 'immunity', 
    name: 'Immunity', 
    icon: ShieldCheck, 
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Boost your immune system with vitamin-rich juices' 
  },
  { 
    id: 'detox', 
    name: 'Detox', 
    icon: Droplets, 
    color: 'bg-green-100 text-green-700',
    description: 'Cleanse and refresh with our detoxifying blends'
  },
  { 
    id: 'energy', 
    name: 'Energy', 
    icon: Zap, 
    color: 'bg-orange-100 text-orange-700',
    description: 'Revitalize and power up with natural energy boosters'
  },
  { 
    id: 'wellness', 
    name: 'Wellness', 
    icon: Heart, 
    color: 'bg-red-100 text-red-700',
    description: 'Support overall health with our wellness formulas'
  }
];

const JuiceCategories = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const { data: juices = [], isLoading } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });

  // Filter juices by category
  const filteredJuices = activeCategory === 'all' 
    ? juices 
    : juices.filter(juice => juice.category.toLowerCase() === activeCategory.toLowerCase());

  const CategoryIcon = categories.find(cat => cat.id === activeCategory)?.icon || Leaf;
  const categoryDescription = categories.find(cat => cat.id === activeCategory)?.description || '';
  
  return (
    <section className="py-16 bg-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Explore Our Juice Collection</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We offer a variety of specialized cold-pressed juices designed to support your health and wellness goals.
          </p>
        </div>
        
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white p-1 rounded-full shadow-sm">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="rounded-full px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="outline" className={`px-6 py-2 ${categories.find(cat => cat.id === activeCategory)?.color}`}>
                <CategoryIcon className="w-4 h-4 mr-2" />
                {categories.find(cat => cat.id === activeCategory)?.name}
              </Badge>
            </div>
            <p className="text-gray-600">{categoryDescription}</p>
          </div>
          
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading juices...</p>
                </div>
              ) : filteredJuices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No juices found in this category.</p>
                  <Link href="/shop">
                    <a className="text-primary hover:underline mt-2 inline-block">View all juices</a>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredJuices.map((juice) => (
                    <JuiceCard key={juice.id} juice={juice} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="text-center mt-12">
          <Link href="/shop">
            <a className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90">
              View All Products
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JuiceCategories;