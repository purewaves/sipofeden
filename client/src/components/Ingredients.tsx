const Ingredients = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-semibold text-center mb-8">Fresh Ingredients</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-lg group">
            <img 
              src="https://images.unsplash.com/photo-1457296898342-cdd24585d095?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Fresh fruits" 
              className="w-full h-48 md:h-60 object-cover transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white font-heading font-semibold text-xl">Fruits</h3>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg group">
            <img 
              src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Fresh vegetables" 
              className="w-full h-48 md:h-60 object-cover transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white font-heading font-semibold text-xl">Vegetables</h3>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg group">
            <img 
              src="https://images.unsplash.com/photo-1515594619990-9d921525ff2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Fresh herbs" 
              className="w-full h-48 md:h-60 object-cover transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white font-heading font-semibold text-xl">Herbs</h3>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg group">
            <img 
              src="https://images.unsplash.com/photo-1546548970-71785318a17b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Superfoods" 
              className="w-full h-48 md:h-60 object-cover transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-white font-heading font-semibold text-xl">Superfoods</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ingredients;
